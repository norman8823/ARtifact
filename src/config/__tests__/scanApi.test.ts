/**
 * The module reads `process.env` once, at import time, so every case has to
 * reload it with `jest.isolateModules` after setting the var.
 */
const loadScanApi = (override?: string) => {
  if (override === undefined) {
    delete process.env.EXPO_PUBLIC_SCAN_API_URL;
  } else {
    process.env.EXPO_PUBLIC_SCAN_API_URL = override;
  }

  let mod!: typeof import("../scanApi");
  jest.isolateModules(() => {
    mod = require("../scanApi");
  });
  return mod;
};

describe("scan API endpoint", () => {
  const originalEnv = process.env.EXPO_PUBLIC_SCAN_API_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_SCAN_API_URL;
    } else {
      process.env.EXPO_PUBLIC_SCAN_API_URL = originalEnv;
    }
  });

  it("defaults to the domain we own when no override is set", () => {
    expect(loadScanApi().SCAN_PREDICT_URL).toBe(
      "https://api.artifactar.com/predict"
    );
  });

  /**
   * The regression that actually costs something: a vendor-generated hostname
   * baked into a shipped binary can only be repointed by an app update, so a
   * lost or lapsed hosting project breaks scanning on every install. The
   * default has to stay a hostname we control, over TLS.
   */
  it("never falls back to a vendor-generated hostname, and uses TLS", () => {
    const { SCAN_API_BASE_URL } = loadScanApi();
    expect(SCAN_API_BASE_URL).toMatch(/^https:\/\//);
    expect(SCAN_API_BASE_URL).not.toContain(".up.railway.app");
  });

  it("honours an override and strips its trailing slashes", () => {
    expect(loadScanApi("https://staging.example.com//").SCAN_PREDICT_URL).toBe(
      "https://staging.example.com/predict"
    );
  });

  it("falls back when the override is blank rather than building a bare /predict", () => {
    expect(loadScanApi("   ").SCAN_PREDICT_URL).toBe(
      "https://api.artifactar.com/predict"
    );
  });
});
