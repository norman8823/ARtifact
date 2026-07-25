// Adapter between the Railway Flask CNN /predict response and the legacy
// Rekognition-shaped ScanResult that handleScanResult/useScanSuccess consume.
// The Rekognition shape (labels[{Name, Confidence}]) is preserved so the
// downstream scan flow did not have to change when the backend was swapped.

export interface FlaskPredictResponse {
  success: boolean;
  /** MET artwork ID, or "Unknown" when the model is not confident. */
  prediction?: string;
  /** Model confidence in the 0..1 range. */
  confidence?: number;
}

export interface ScanLabel {
  Name: string;
  Confidence: number;
}

export interface ScanResult {
  success: boolean;
  labels: ScanLabel[];
  /** Percentage, 0..100. */
  confidence: number;
}

export function adaptFlaskResponse(flask: FlaskPredictResponse): ScanResult {
  if (flask.success && flask.prediction && flask.prediction !== "Unknown") {
    const confidence = (flask.confidence ?? 0) * 100;
    return {
      success: true,
      labels: [{ Name: flask.prediction, Confidence: confidence }],
      confidence,
    };
  }
  return {
    success: false,
    labels: [],
    confidence: flask.confidence ? flask.confidence * 100 : 0,
  };
}
