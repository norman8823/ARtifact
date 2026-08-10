import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import { CognitoJwtVerifier } from "aws-jwt-verify";

/**
 * Revoke a user's Apple token when they delete their ARtifact account.
 *
 * Apple requires this of any app offering Sign in with Apple (it pairs with
 * guideline 5.1.1(v)); skip it and the account is gone on our side while Apple
 * still lists ARtifact under the user's Apple ID. Reviewers check.
 *
 * WHY A FRESH AUTHORIZATION CODE RATHER THAN A STORED REFRESH TOKEN
 * -----------------------------------------------------------------
 * Revocation needs a `client_secret` JWT signed with the Apple private key, so
 * it cannot happen on the device. The usual pattern is to exchange the
 * authorization code at every sign-in and store the resulting refresh token
 * per user — a long-lived Apple credential held server-side forever.
 *
 * Instead the app asks Apple for a FRESH authorization code at deletion time
 * and this function exchanges and revokes it immediately. Nothing is stored,
 * and the Apple sheet doubles as confirmation before an irreversible action.
 *
 * AUTHORISATION
 * -------------
 * Invoked directly through the Cognito Identity Pool's AUTHENTICATED role, so
 * only signed-in users of this app can reach it — there is no public endpoint.
 * (A Function URL was tried first and is blocked at the account level; IAM is
 * the better answer anyway.) The Cognito ID token is verified as well, so the
 * caller must be a real user of our pool and not merely hold app credentials.
 */

const {
  APPLE_TEAM_ID,
  APPLE_KEY_ID,
  APPLE_CLIENT_ID,
  APPLE_PRIVATE_KEY,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
} = process.env;

const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USER_POOL_ID,
  tokenUse: "id",
  clientId: COGNITO_CLIENT_ID,
});

const b64url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * Apple's `client_secret`: an ES256 JWT signed with the .p8, valid briefly.
 *
 * `dsaEncoding: "ieee-p1363"` matters — Node defaults to DER, which JOSE does
 * not accept, and Apple rejects it as an invalid client with no detail.
 */
function buildClientSecret() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: APPLE_KEY_ID };
  const payload = {
    iss: APPLE_TEAM_ID,
    iat: now,
    exp: now + 300,
    aud: "https://appleid.apple.com",
    sub: APPLE_CLIENT_ID,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(
    JSON.stringify(payload)
  )}`;
  const signature = cryptoSign(
    "sha256",
    Buffer.from(signingInput),
    {
      key: createPrivateKey(APPLE_PRIVATE_KEY),
      dsaEncoding: "ieee-p1363",
    }
  );
  return `${signingInput}.${b64url(signature)}`;
}

const reply = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  // Direct SDK invoke delivers the payload as the event itself; an HTTP
  // front-end would wrap it in `body`. Accept either.
  let parsed;
  try {
    parsed = typeof event?.body === "string" ? JSON.parse(event.body) : event ?? {};
  } catch {
    return reply(400, { error: "invalid_body" });
  }

  const { idToken, authorizationCode } = parsed;
  if (!idToken || !authorizationCode) {
    return reply(400, { error: "missing_parameters" });
  }

  // Prove the caller is a signed-in user of our pool before spending anything.
  try {
    await cognitoVerifier.verify(idToken);
  } catch {
    console.log("REVOKE unauthorized: cognito token failed verification");
    return reply(401, { error: "unauthorized" });
  }

  const clientSecret = buildClientSecret();

  // Exchange the one-time code for a refresh token.
  const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text();
    console.log("REVOKE token exchange failed", tokenRes.status, detail.slice(0, 200));
    return reply(502, { error: "token_exchange_failed", status: tokenRes.status });
  }

  const tokens = await tokenRes.json();
  const token = tokens.refresh_token ?? tokens.access_token;
  if (!token) {
    console.log("REVOKE no token in exchange response");
    return reply(502, { error: "no_token_returned" });
  }

  const revokeRes = await fetch("https://appleid.apple.com/auth/revoke", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APPLE_CLIENT_ID,
      client_secret: clientSecret,
      token,
      token_type_hint: tokens.refresh_token ? "refresh_token" : "access_token",
    }),
  });

  // Apple returns 200 with an empty body on success.
  if (!revokeRes.ok) {
    const detail = await revokeRes.text();
    console.log("REVOKE failed", revokeRes.status, detail.slice(0, 200));
    return reply(502, { error: "revoke_failed", status: revokeRes.status });
  }

  console.log("REVOKE ok");
  return reply(200, { revoked: true });
};
