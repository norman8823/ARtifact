import { SCAN_PREDICT_URL } from "@/src/config/scanApi";
import type { FlaskPredictResponse } from "./scanAdapter";

/**
 * Hardened client for the recognition endpoint (Gaps #4).
 *
 * The scan request had no timeout, no retry and no deduplication. That is the
 * app's headline feature and it is about to sit behind a paywall, so each of
 * those is a user-visible failure waiting to happen:
 *
 * - **No timeout** meant a hung connection span forever with a spinner.
 * - **No retry** meant Railway's scale-to-zero cold start — the only real
 *   server cold start in the app — surfaced as an outright failure.
 */

/** Generous: a Railway cold start loads TensorFlow and a 47MB model. */
export const SCAN_TIMEOUT_MS = 20_000;

/** One retry. More would keep a user staring at a broken scan even longer. */
export const SCAN_MAX_ATTEMPTS = 2;

export interface ScanFailureInfo {
  /** HTTP status, absent for network errors and timeouts. */
  status?: number;
  timedOut?: boolean;
}

/**
 * Retry only faults that a second attempt could plausibly fix.
 *
 * Timeouts and network errors are the cold-start case — exactly what retrying
 * is for. 5xx and 429 may be transient. A 4xx is a bad request (a malformed
 * image, say); resending it produces the same answer and just doubles the wait.
 */
export function isRetriableScanFailure(info: ScanFailureInfo): boolean {
  if (info.timedOut) return true;
  if (info.status === undefined) return true; // network-level failure
  if (info.status === 429) return true;
  return info.status >= 500 && info.status < 600;
}

export class ScanRequestError extends Error {
  readonly status?: number;
  readonly timedOut: boolean;

  constructor(message: string, info: ScanFailureInfo = {}) {
    super(message);
    this.name = "ScanRequestError";
    this.status = info.status;
    this.timedOut = info.timedOut ?? false;
  }
}

async function postOnce(uri: string): Promise<FlaskPredictResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);

  const formData = new FormData();
  // Field name is `image` — the server's contract, do not rename.
  formData.append("image", {
    uri,
    type: "image/jpeg",
    name: "artwork.jpg",
  } as unknown as Blob);

  try {
    const response = await fetch(SCAN_PREDICT_URL, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ScanRequestError(
        `Scan API error: ${response.status} ${response.statusText}`,
        { status: response.status }
      );
    }

    return (await response.json()) as FlaskPredictResponse;
  } catch (err) {
    if (err instanceof ScanRequestError) throw err;
    // AbortController surfaces as an AbortError; treat it as a timeout.
    const timedOut =
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("Aborted"));
    throw new ScanRequestError(
      timedOut ? "Scan timed out" : `Scan request failed: ${String(err)}`,
      { timedOut }
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * POST the photo to /predict, retrying once on a retriable fault.
 *
 * The response is returned untouched — `adaptFlaskResponse` still owns mapping
 * it to the legacy Rekognition shape, and a `prediction` of "Unknown" is a
 * successful response, not an error.
 */
export async function requestPrediction(
  uri: string
): Promise<FlaskPredictResponse> {
  let lastError: ScanRequestError | undefined;

  for (let attempt = 1; attempt <= SCAN_MAX_ATTEMPTS; attempt++) {
    try {
      return await postOnce(uri);
    } catch (err) {
      lastError = err as ScanRequestError;
      const canRetry =
        attempt < SCAN_MAX_ATTEMPTS &&
        isRetriableScanFailure({
          status: lastError.status,
          timedOut: lastError.timedOut,
        });
      if (!canRetry) throw lastError;
    }
  }

  throw lastError ?? new ScanRequestError("Scan failed");
}
