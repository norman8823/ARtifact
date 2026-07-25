import { adaptFlaskResponse } from "../scanAdapter";

describe("adaptFlaskResponse", () => {
  it("maps a confident prediction to the Rekognition label shape", () => {
    const result = adaptFlaskResponse({
      success: true,
      prediction: "436535",
      confidence: 0.87,
    });
    expect(result).toEqual({
      success: true,
      labels: [{ Name: "436535", Confidence: 87 }],
      confidence: 87,
    });
  });

  it('treats an "Unknown" prediction as a failed scan but keeps the confidence', () => {
    const result = adaptFlaskResponse({
      success: true,
      prediction: "Unknown",
      confidence: 0.42,
    });
    expect(result).toEqual({
      success: false,
      labels: [],
      confidence: 42,
    });
  });

  it("treats a server-reported failure as a failed scan", () => {
    const result = adaptFlaskResponse({ success: false });
    expect(result).toEqual({ success: false, labels: [], confidence: 0 });
  });

  it("treats an empty prediction as a failed scan", () => {
    const result = adaptFlaskResponse({
      success: true,
      prediction: "",
      confidence: 0.9,
    });
    expect(result.success).toBe(false);
  });

  it("defaults a missing confidence to 0 on success", () => {
    const result = adaptFlaskResponse({
      success: true,
      prediction: "436535",
    });
    expect(result.confidence).toBe(0);
    expect(result.labels[0]).toEqual({ Name: "436535", Confidence: 0 });
  });
});
