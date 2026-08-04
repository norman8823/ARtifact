/**
 * Scan recognition endpoint.
 *
 * The host is read from `EXPO_PUBLIC_SCAN_API_URL` so it can be repointed
 * without shipping an app update. That matters because the fallback below is a
 * Railway-generated subdomain living in a project the LLC does not control
 * (backlog PT.7) — with the hostname baked into shipped binaries, losing that
 * project would break scanning on every installed build with no server-side
 * fix. Once `api.artifactar.com` is in front of the service, set the env var to
 * it and the indirection becomes a DNS change instead of a release.
 *
 * Deliberately NOT added to the required-env-var check in `src/aws/config.ts`:
 * that throws when a var is missing, so a value absent from the EAS build
 * environment would brick the app on launch. A missing value here degrades to
 * exactly today's behaviour instead.
 */
const FALLBACK_SCAN_API_URL =
  "https://artifact-server-production.up.railway.app";

const rawBaseUrl = process.env.EXPO_PUBLIC_SCAN_API_URL?.trim();

/** Base URL with any trailing slashes removed, so path joining stays safe. */
export const SCAN_API_BASE_URL = (rawBaseUrl || FALLBACK_SCAN_API_URL).replace(
  /\/+$/,
  ""
);

/** The CNN inference endpoint the shutter button POSTs a photograph to. */
export const SCAN_PREDICT_URL = `${SCAN_API_BASE_URL}/predict`;
