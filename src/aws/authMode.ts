// Single source of truth for the AppSync auth mode.
//
// Previously every data hook called `fetchAuthSession()` before each query to
// decide between "userPool" (signed-in) and "apiKey" (guest). On a cold session
// that meant N redundant Cognito round-trips per screen. The auth mode is now
// resolved ONCE in AuthContext (on cold-start init, post-login refreshAuth, and
// sign-out) and cached here for synchronous reads by the hooks.

export type AppSyncAuthMode = "userPool" | "apiKey";

// Guest access API key expiry — regenerate in the AWS AppSync console before
// this date or guest reads will start failing.
const GUEST_API_KEY_EXPIRY = new Date("2026-12-06T04:00:00Z");

// Default to guest until AuthContext resolves the session. Screens gate their
// fetches on `isAuthReady`, so this is updated before any query reads it.
let currentAuthMode: AppSyncAuthMode = "apiKey";

/**
 * Set by AuthContext whenever the auth state is resolved. This is the only
 * writer — keep auth-mode resolution centralized here.
 */
export function setAuthMode(mode: AppSyncAuthMode): void {
  currentAuthMode = mode;
  if (mode === "apiKey" && new Date() > GUEST_API_KEY_EXPIRY) {
    console.error(
      "Guest access API key has expired (Dec 6, 2026 04:00 GMT). Please generate a new API key in the AWS AppSync console."
    );
  }
}

/** Synchronous read of the auth mode resolved by AuthContext. */
export function getAuthMode(): AppSyncAuthMode {
  return currentAuthMode;
}
