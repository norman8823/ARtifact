import {
  SCAN_MAX_ATTEMPTS,
  SCAN_TIMEOUT_MS,
  SCAN_WARMING_MS,
  isRetriableScanFailure,
} from "../scanClient";

describe("isRetriableScanFailure", () => {
  /**
   * The whole point of the retry: Railway scales to zero, so the first scan of
   * the day wakes a container that loads TensorFlow and a 47MB model.
   */
  it("retries timeouts — that is the cold-start case", () => {
    expect(isRetriableScanFailure({ timedOut: true })).toBe(true);
  });

  it("retries network-level failures, which carry no status", () => {
    expect(isRetriableScanFailure({})).toBe(true);
  });

  it("retries 5xx and 429", () => {
    expect(isRetriableScanFailure({ status: 500 })).toBe(true);
    expect(isRetriableScanFailure({ status: 503 })).toBe(true);
    expect(isRetriableScanFailure({ status: 429 })).toBe(true);
  });

  /**
   * A 4xx means the request itself was wrong — resending it produces the same
   * answer and doubles the time the user waits for a failure.
   */
  it("does NOT retry ordinary 4xx", () => {
    expect(isRetriableScanFailure({ status: 400 })).toBe(false);
    expect(isRetriableScanFailure({ status: 404 })).toBe(false);
    expect(isRetriableScanFailure({ status: 413 })).toBe(false);
  });

  it("treats the 5xx boundaries correctly", () => {
    expect(isRetriableScanFailure({ status: 499 })).toBe(false);
    expect(isRetriableScanFailure({ status: 600 })).toBe(false);
  });
});

describe("scan timing constants", () => {
  it("warns about warming well before giving up", () => {
    expect(SCAN_WARMING_MS).toBeLessThan(SCAN_TIMEOUT_MS);
  });

  it("allows exactly one retry", () => {
    expect(SCAN_MAX_ATTEMPTS).toBe(2);
  });
});
