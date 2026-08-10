/**
 * Read the `email` claim out of an Apple identity token.
 *
 * Apple returns `credential.email` ONLY on a user's first-ever authorization
 * for an app; every later sign-in returns null. The identity token, however,
 * always carries the claim — so the token is the reliable source and the
 * credential field is not.
 *
 * This deliberately does NOT verify the signature. Verification happens in the
 * Cognito Lambda, which is the only place it means anything: a client that
 * verified its own token would be checking a value it could equally well have
 * fabricated. Here the claim is used solely to pick which account to sign into,
 * and the Lambda independently confirms that the token really vouches for that
 * address before issuing anything.
 */
export function readAppleEmailClaim(identityToken: string): string | null {
  const parts = identityToken.split(".");
  if (parts.length !== 3) return null;

  try {
    // Base64URL -> Base64, then pad. atob is available in React Native.
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const claims = JSON.parse(
      decodeURIComponent(
        atob(padded)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
      )
    );
    const email = claims?.email;
    return typeof email === "string" && email.length > 0 ? email : null;
  } catch {
    return null;
  }
}

/**
 * A throwaway password for the Cognito account backing an Apple sign-in.
 *
 * The user never sees or needs it: every subsequent sign-in goes through
 * CUSTOM_AUTH with an Apple token. It is deliberately NOT stored anywhere —
 * stashing it in the keychain would break on reinstall and on a second device,
 * and it has no purpose after signUp returns.
 */
export function generateThrowawayPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes)
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 24);
  // Satisfies the pool's policy regardless of how strict it is.
  return `Aa1!${body}`;
}
