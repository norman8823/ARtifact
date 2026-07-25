import {
  awardXpWithRetry,
  isConditionalCheckFailed,
  pickLatestXpRecord,
  userXpRecordId,
  visitedRecordId,
  type XpAwardOps,
} from "../xpAward";

describe("deterministic record ids", () => {
  it("builds stable visited ids from user + artwork", () => {
    expect(visitedRecordId("user-1", "436535")).toBe("user-1#436535");
  });

  it("builds stable user XP ids", () => {
    expect(userXpRecordId("user-1")).toBe("xp-user-1");
  });
});

describe("isConditionalCheckFailed", () => {
  it("matches the DynamoDB error type on a thrown error", () => {
    expect(
      isConditionalCheckFailed({
        errors: [{ errorType: "DynamoDB:ConditionalCheckFailedException" }],
      })
    ).toBe(true);
  });

  it("matches the DynamoDB message text in a flattened Error", () => {
    expect(
      isConditionalCheckFailed(
        new Error("The conditional request failed (Service: DynamoDb...)")
      )
    ).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(isConditionalCheckFailed(new Error("Network request failed"))).toBe(
      false
    );
    expect(isConditionalCheckFailed(undefined)).toBe(false);
    expect(isConditionalCheckFailed("Unauthorized")).toBe(false);
  });
});

describe("pickLatestXpRecord", () => {
  it("returns the newest record by timestamp", () => {
    const latest = pickLatestXpRecord([
      { id: "a", xpPoints: 100, timestamp: "2026-01-01T00:00:00Z" },
      { id: "b", xpPoints: 300, timestamp: "2026-03-01T00:00:00Z" },
      { id: "c", xpPoints: 200, timestamp: "2026-02-01T00:00:00Z" },
    ]);
    expect(latest?.id).toBe("b");
  });

  it("falls back to createdAt when timestamp is missing", () => {
    const latest = pickLatestXpRecord([
      { id: "a", xpPoints: 100, createdAt: "2026-01-01T00:00:00Z" },
      { id: "b", xpPoints: 200, createdAt: "2026-02-01T00:00:00Z" },
    ]);
    expect(latest?.id).toBe("b");
  });

  it("skips null items and coerces null xpPoints to 0", () => {
    const latest = pickLatestXpRecord([
      null,
      { id: "a", xpPoints: null, timestamp: "2026-01-01T00:00:00Z" },
    ]);
    expect(latest).toMatchObject({ id: "a", xpPoints: 0 });
  });

  it("returns null for an empty list", () => {
    expect(pickLatestXpRecord([])).toBeNull();
  });
});

describe("awardXpWithRetry", () => {
  const conflict = () => {
    throw new Error("The conditional request failed");
  };

  it("creates the first record when none exists", async () => {
    const create = jest.fn().mockResolvedValue("created");
    const ops: XpAwardOps = {
      read: jest.fn().mockResolvedValue({ id: null, xpPoints: 0 }),
      create,
      conditionalUpdate: jest.fn(),
    };
    await expect(awardXpWithRetry(ops, 100)).resolves.toBe("created");
    expect(create).toHaveBeenCalledWith(100);
    expect(ops.conditionalUpdate).not.toHaveBeenCalled();
  });

  it("updates conditioned on the value it read", async () => {
    const conditionalUpdate = jest.fn().mockResolvedValue("updated");
    const ops: XpAwardOps = {
      read: jest.fn().mockResolvedValue({ id: "xp-1", xpPoints: 400 }),
      create: jest.fn(),
      conditionalUpdate,
    };
    await expect(awardXpWithRetry(ops, 100)).resolves.toBe("updated");
    expect(conditionalUpdate).toHaveBeenCalledWith("xp-1", 400, 100);
  });

  it("re-reads and retries after losing an update race", async () => {
    const read = jest
      .fn()
      .mockResolvedValueOnce({ id: "xp-1", xpPoints: 400 })
      .mockResolvedValueOnce({ id: "xp-1", xpPoints: 500 });
    const conditionalUpdate = jest
      .fn()
      .mockImplementationOnce(conflict)
      .mockResolvedValueOnce("updated");
    const ops: XpAwardOps = { read, create: jest.fn(), conditionalUpdate };

    await expect(awardXpWithRetry(ops, 100)).resolves.toBe("updated");
    // Second attempt must be conditioned on the FRESH value (500, not 400)
    expect(conditionalUpdate).toHaveBeenLastCalledWith("xp-1", 500, 100);
  });

  it("retries a lost create race as an update against the winner's record", async () => {
    const read = jest
      .fn()
      .mockResolvedValueOnce({ id: null, xpPoints: 0 })
      .mockResolvedValueOnce({ id: "xp-1", xpPoints: 100 });
    const create = jest.fn().mockImplementationOnce(conflict);
    const conditionalUpdate = jest.fn().mockResolvedValue("updated");
    const ops: XpAwardOps = { read, create, conditionalUpdate };

    await expect(awardXpWithRetry(ops, 100)).resolves.toBe("updated");
    expect(conditionalUpdate).toHaveBeenCalledWith("xp-1", 100, 100);
  });

  it("gives up after maxAttempts consecutive conflicts", async () => {
    const ops: XpAwardOps = {
      read: jest.fn().mockResolvedValue({ id: "xp-1", xpPoints: 400 }),
      create: jest.fn(),
      conditionalUpdate: jest.fn().mockImplementation(conflict),
    };
    await expect(awardXpWithRetry(ops, 100, 3)).rejects.toThrow(
      "conditional request failed"
    );
    expect(ops.conditionalUpdate).toHaveBeenCalledTimes(3);
  });

  it("propagates non-conflict errors immediately without retrying", async () => {
    const conditionalUpdate = jest.fn().mockRejectedValue(new Error("Network request failed"));
    const ops: XpAwardOps = {
      read: jest.fn().mockResolvedValue({ id: "xp-1", xpPoints: 400 }),
      create: jest.fn(),
      conditionalUpdate,
    };
    await expect(awardXpWithRetry(ops, 100)).rejects.toThrow(
      "Network request failed"
    );
    expect(conditionalUpdate).toHaveBeenCalledTimes(1);
  });

  it("propagates read errors instead of treating them as missing records", async () => {
    const ops: XpAwardOps = {
      read: jest.fn().mockRejectedValue(new Error("Unauthorized")),
      create: jest.fn(),
      conditionalUpdate: jest.fn(),
    };
    await expect(awardXpWithRetry(ops, 100)).rejects.toThrow("Unauthorized");
    expect(ops.create).not.toHaveBeenCalled();
  });
});
