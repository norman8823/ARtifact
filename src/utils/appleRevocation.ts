import * as Sentry from "@sentry/react-native";

/** Set when a user signs in with Apple; read by the deletion flow. */
export const APPLE_LINKED_KEY = "artifact.appleLinked";

/**
 * Revoke the user's Apple token as part of deleting their account.
 *
 * Apple requires this of any app offering Sign in with Apple — skip it and the
 * account disappears on our side while Apple still lists ARtifact under the
 * user's Apple ID. It pairs with guideline 5.1.1(v) and reviewers check it.
 *
 * Revocation needs a `client_secret` signed with the Apple private key, so it
 * happens in the `artifactAppleRevoke` Lambda. Rather than storing a refresh
 * token per user forever, we ask Apple for a FRESH authorization code here and
 * the Lambda exchanges and revokes it immediately — nothing is stored, and the
 * Apple sheet doubles as confirmation before an irreversible action.
 *
 * Invoked over the Cognito Identity Pool's authenticated role. There is no
 * public endpoint; only a signed-in user of this app can reach the function.
 */
/**
 * ⚠️ NOT WIRED UP YET — returns false, and account deletion proceeds without
 * revoking. The Lambda (`artifactAppleRevoke`) is deployed and working; what is
 * missing is a way for the app to CALL it.
 *
 * `@aws-sdk/client-lambda` was tried and had to be reverted: it pulls in
 * `@smithy/node-http-handler`, which requires `node:https`, and React Native
 * has no such module — the app failed to bundle at all. Do not reinstall it.
 *
 * Remaining options, none of which are a one-liner:
 *  - a Lambda Function URL with `AWS_IAM` auth, signed with SigV4 (needs a
 *    SubtleCrypto-capable signer; React Native has no SubtleCrypto)
 *  - a route on the existing API Gateway, called via Amplify's REST client,
 *    which already signs with Identity Pool credentials and is RN-safe
 *  - an AppSync mutation backed by the Lambda (requires `amplify push`)
 *
 * The second is the most likely: `aws-amplify` is already a dependency and
 * already configured with a REST endpoint.
 */
export async function revokeAppleToken(): Promise<boolean> {
  Sentry.captureMessage("Apple token revocation skipped: transport not wired", {
    level: "warning",
    tags: { component: "appleRevocation" },
  });
  return false;
}
