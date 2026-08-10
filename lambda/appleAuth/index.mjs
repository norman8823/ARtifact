import { JwtRsaVerifier } from "aws-jwt-verify";

/**
 * Sign in with Apple for ARtifact, as a Cognito CUSTOM_AUTH flow.
 *
 * WHY THIS EXISTS RATHER THAN HOSTED-UI FEDERATION
 * ------------------------------------------------
 * The user pool has `phone_number` as a **required** attribute (a mistake at
 * pool creation; `Required` is immutable). Cognito force-maps every required
 * attribute from an IdP claim, Apple has no phone claim, and Cognito validates
 * `phone_number` as E.164 — so federated user creation fails with
 * `Invalid phone number format`, and the mapping cannot be removed (the API
 * accepts the change and silently restores it). Proven 2026-08-10.
 *
 * CUSTOM_AUTH avoids federation entirely: the *app* calls `signUp()` and
 * supplies the same valid dummy phone the email flow already uses, and this
 * function only verifies that the caller holds a genuine Apple identity token.
 * It also lets the app use Apple's NATIVE sheet rather than a browser session.
 *
 * ⚠️ SECURITY: enabling CUSTOM_AUTH opens a password-free authentication path
 * against every user in the pool. A permissive VerifyAuthChallengeResponse is
 * universal account takeover. Both handlers below therefore FAIL CLOSED —
 * `answerCorrect`/`issueTokens` start false and are only ever set true on a
 * fully verified token. Treat "verification threw" and "verification returned
 * false" identically. Never log the identity token: it is a bearer credential.
 */

const APPLE_ISSUER = "https://appleid.apple.com";

/** The iOS bundle id — Apple's `aud` for tokens from the NATIVE sheet. */
const APPLE_AUDIENCE = "com.rauljiminian.ARtifact";

/** Reject tokens older than this even if `exp` has not passed. */
const MAX_TOKEN_AGE_SECONDS = 300;

// Module scope: the JWKS is cached across invocations, so a warm container does
// not re-fetch Apple's keys on every sign-in.
const verifier = JwtRsaVerifier.create({
  issuer: APPLE_ISSUER,
  audience: APPLE_AUDIENCE,
  jwksUri: "https://appleid.apple.com/auth/keys",
});

/**
 * Verify an Apple identity token and return its claims, or null.
 *
 * Returns null rather than throwing so callers cannot accidentally treat an
 * exception as success.
 */
async function verifyAppleToken(identityToken) {
  if (typeof identityToken !== "string" || identityToken.length === 0) {
    return null;
  }
  try {
    const payload = await verifier.verify(identityToken);

    // `verify` already checks signature, issuer, audience and expiry. `iat` is
    // ours: it bounds replay of a token that is technically still valid.
    const iat = Number(payload.iat);
    if (!Number.isFinite(iat)) return null;
    const ageSeconds = Math.floor(Date.now() / 1000) - iat;
    if (ageSeconds > MAX_TOKEN_AGE_SECONDS || ageSeconds < -60) return null;

    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;

    return payload;
  } catch {
    // Deliberately opaque: a failure reason here would help an attacker probe.
    return null;
  }
}

/** Apple returns `email_verified`/`is_private_email` as either string or bool. */
const isTrue = (claim) => String(claim) === "true";

/**
 * DefineAuthChallenge — decide what happens next.
 *
 * Fail closed. Tokens are issued ONLY for a single custom challenge that was
 * answered correctly by a user who exists. Anything else fails the attempt;
 * there is no retry budget, because each attempt is a full Apple token and a
 * second guess adds nothing legitimate.
 */
function defineAuthChallenge(event) {
  const { session = [], userNotFound } = event.request;
  // DIAGNOSTIC: shapes only, no token, no email.
  console.log("DEFINE", JSON.stringify({
    sessionLen: session.length,
    userNotFound: !!userNotFound,
    steps: session.map((s) => ({ n: s?.challengeName, r: s?.challengeResult })),
  }));

  event.response.issueTokens = false;
  event.response.failAuthentication = false;

  if (userNotFound) {
    event.response.failAuthentication = true;
    return event;
  }

  if (session.length === 0) {
    event.response.challengeName = "CUSTOM_CHALLENGE";
    return event;
  }

  const [first] = session;
  if (
    session.length === 1 &&
    first?.challengeName === "CUSTOM_CHALLENGE" &&
    first?.challengeResult === true
  ) {
    event.response.issueTokens = true;
    return event;
  }

  event.response.failAuthentication = true;
  return event;
}

/**
 * CreateAuthChallenge — nothing to issue.
 *
 * The client already holds the Apple token; there is no server-generated
 * challenge. Both parameter bags stay EMPTY: `publicChallengeParameters` is
 * returned to an unauthenticated caller, so leaking user attributes here would
 * be an enumeration oracle.
 */
function createAuthChallenge(event) {
  event.response.publicChallengeParameters = {};
  event.response.privateChallengeParameters = {};
  event.response.challengeMetadata = "APPLE_IDENTITY_TOKEN";
  return event;
}

/**
 * VerifyAuthChallengeResponse — the security boundary.
 *
 * The answer must be an Apple identity token whose verified `email` matches the
 * Cognito user being signed in. Without that email check, any valid Apple token
 * would authenticate as ANY user in the pool.
 */
async function verifyAuthChallenge(event) {
  event.response.answerCorrect = false;

  const answer = event.request.challengeAnswer;
  const payload = await verifyAppleToken(answer);
  // DIAGNOSTIC: booleans only — never the token, never the addresses.
  console.log("VERIFY", JSON.stringify({
    answerType: typeof answer,
    answerLen: typeof answer === "string" ? answer.length : 0,
    tokenVerified: !!payload,
  }));
  if (!payload) return event;

  const claimEmail = String(payload.email ?? "").toLowerCase();
  const userEmail = String(
    event.request.userAttributes?.email ?? ""
  ).toLowerCase();

  console.log("VERIFY_CLAIMS", JSON.stringify({
    hasClaimEmail: !!claimEmail,
    hasUserEmail: !!userEmail,
    emailsMatch: !!claimEmail && claimEmail === userEmail,
    appleEmailVerified: isTrue(payload.email_verified),
    cognitoEmailVerified: isTrue(event.request.userAttributes?.email_verified),
  }));

  if (!claimEmail || !userEmail || claimEmail !== userEmail) return event;

  // Apple must vouch for the address, and so must Cognito. A user sitting at
  // UNCONFIRMED with an unverified email could have been created by an attacker
  // signing up with someone else's address.
  if (!isTrue(payload.email_verified)) return event;
  if (!isTrue(event.request.userAttributes?.email_verified)) return event;

  event.response.answerCorrect = true;
  return event;
}

/**
 * PreSignUp — auto-confirm ONLY a signup that proves an Apple token.
 *
 * Branching on `clientMetadata` is essential: without it this would
 * auto-confirm every signup, including the email/password flow, letting anyone
 * create a confirmed account on an address they do not own and skipping the
 * verification-code step entirely.
 */
async function preSignUp(event) {
  const token = event.request.clientMetadata?.appleIdentityToken;

  if (!token) {
    // Not the Apple flow — leave the existing email verification intact.
    return event;
  }

  const payload = await verifyAppleToken(token);
  if (!payload) {
    throw new Error("Invalid Apple identity token");
  }

  const claimEmail = String(payload.email ?? "").toLowerCase();
  const submitted = String(event.request.userAttributes?.email ?? "").toLowerCase();

  // Without this the token could vouch for one address while the account is
  // created on another.
  if (!claimEmail || claimEmail !== submitted) {
    throw new Error("Apple token email does not match the submitted email");
  }
  if (!isTrue(payload.email_verified)) {
    throw new Error("Apple email is not verified");
  }

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
}

export const handler = async (event) => {
  console.log("TRIGGER", event.triggerSource);
  switch (event.triggerSource) {
    case "DefineAuthChallenge_Authentication":
      return defineAuthChallenge(event);

    case "CreateAuthChallenge_Authentication":
      return createAuthChallenge(event);

    case "VerifyAuthChallengeResponse_Authentication":
      return verifyAuthChallenge(event);

    case "PreSignUp_SignUp":
    case "PreSignUp_AdminCreateUser":
    case "PreSignUp_ExternalProvider":
      return preSignUp(event);

    default:
      // Unknown trigger: return untouched rather than guessing.
      return event;
  }
};
