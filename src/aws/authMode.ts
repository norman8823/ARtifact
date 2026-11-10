// Single source of truth for the AppSync auth mode.
//
// Previously every data hook called `fetchAuthSession()` before each query to
// decide between "userPool" (signed-in) and "apiKey" (guest). On a cold session
// that meant N redundant Cognito round-trips per screen. The auth mode is now
// resolved ONCE in AuthContext (on cold-start init, post-login refreshAuth, and
// sign-out) and cached here for synchronous reads by the hooks.

export type AppSyncAuthMode = "userPool" | "apiKey";

// AppSync owns the key's expiration. Extend the existing key in AWS to keep
// installed clients working; a baked-in date becomes false after renewal.

// Default to guest until AuthContext resolves the session. Screens gate their
// fetches on `isAuthReady`, so this is updated before any query reads it.
let currentAuthMode: AppSyncAuthMode = "apiKey";

/**
 * Set by AuthContext whenever the auth state is resolved. This is the only
 * writer — keep auth-mode resolution centralized here.
 */
export function setAuthMode(mode: AppSyncAuthMode): void {
  currentAuthMode = mode;
}

/** Synchronous read of the auth mode resolved by AuthContext. */
export function getAuthMode(): AppSyncAuthMode {
  return currentAuthMode;
}
