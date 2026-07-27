import {
  canDeleteIdentity,
  type DeletionOutcome,
  OWNED_MODELS,
  summarizeDeletion,
} from "../accountDeletion";

const ok = (model: DeletionOutcome["model"], n = 2): DeletionOutcome => ({
  model,
  attempted: n,
  deleted: n,
  failed: 0,
});

const allOk = (): DeletionOutcome[] => OWNED_MODELS.map((m) => ok(m));

describe("summarizeDeletion", () => {
  it("totals across models", () => {
    const s = summarizeDeletion([
      { model: "Favorited", attempted: 3, deleted: 3, failed: 0 },
      { model: "Visited", attempted: 5, deleted: 4, failed: 1 },
    ]);
    expect(s.totalAttempted).toBe(8);
    expect(s.totalDeleted).toBe(7);
    expect(s.totalFailed).toBe(1);
    expect(s.failedModels).toEqual(["Visited"]);
    expect(s.allDeleted).toBe(false);
  });

  it("treats an empty account as fully deleted", () => {
    const s = summarizeDeletion(
      OWNED_MODELS.map((m) => ({ model: m, attempted: 0, deleted: 0, failed: 0 }))
    );
    expect(s.allDeleted).toBe(true);
    expect(s.totalDeleted).toBe(0);
  });

  it("handles no outcomes at all", () => {
    const s = summarizeDeletion([]);
    expect(s.allDeleted).toBe(true);
    expect(s.totalAttempted).toBe(0);
  });
});

describe("canDeleteIdentity", () => {
  it("allows deletion when every model is covered and nothing failed", () => {
    expect(canDeleteIdentity(allOk())).toBe(true);
  });

  it("allows deletion for an account that owned no rows", () => {
    expect(
      canDeleteIdentity(
        OWNED_MODELS.map((m) => ({
          model: m,
          attempted: 0,
          deleted: 0,
          failed: 0,
        }))
      )
    ).toBe(true);
  });

  it("BLOCKS deletion if any row failed — orphans would be unreachable forever", () => {
    const outcomes = allOk();
    outcomes[1] = { model: OWNED_MODELS[1], attempted: 3, deleted: 2, failed: 1 };
    expect(canDeleteIdentity(outcomes)).toBe(false);
  });

  it("BLOCKS deletion if a model was never attempted (fails closed)", () => {
    // A step that never ran is indistinguishable from one that failed.
    expect(canDeleteIdentity(allOk().slice(0, -1))).toBe(false);
  });

  it("BLOCKS deletion on no outcomes at all", () => {
    expect(canDeleteIdentity([])).toBe(false);
  });

  it("covers every owned model in the guard", () => {
    // Guards against someone adding a user-owned model without adding it here.
    expect([...OWNED_MODELS]).toEqual([
      "Favorited",
      "Visited",
      "UserQuest",
      "UserXP",
      "User",
    ]);
  });
});

