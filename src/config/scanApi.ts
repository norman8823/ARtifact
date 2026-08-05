/**
 * Scan recognition endpoint.
 *
 * The default below is a domain the LLC owns, pointed at the LLC's own Railway
 * service (2026-08-05). That is the property that matters: moving or replacing
 * the recognition service is a DNS change at Cloudflare that every shipped
 * build follows on its next scan — no app update, no env var, no stranded
 * users. It replaced a Railway-generated `*.up.railway.app` subdomain in a
 * project the LLC did not control, where the same event would have meant a
 * forced-update campaign.
 *
 * **Keep this default a hostname we own.** Baking a vendor-generated hostname
 * back in would silently re-create that exposure.
 *
 * `EXPO_PUBLIC_SCAN_API_URL` survives as an override, for pointing a build at a
 * local or replacement server without a code change.
 *
 * Deliberately NOT added to the required-env-var check in `src/aws/config.ts`:
 * that throws when a var is missing, so a value absent from the EAS build
 * environment would brick the app on launch. A missing value here degrades to
 * the default instead.
 */
const FALLBACK_SCAN_API_URL = "https://api.artifactar.com";

const rawBaseUrl = process.env.EXPO_PUBLIC_SCAN_API_URL?.trim();

/** Base URL with any trailing slashes removed, so path joining stays safe. */
export const SCAN_API_BASE_URL = (rawBaseUrl || FALLBACK_SCAN_API_URL).replace(
  /\/+$/,
  ""
);

/** The CNN inference endpoint the shutter button POSTs a photograph to. */
export const SCAN_PREDICT_URL = `${SCAN_API_BASE_URL}/predict`;
