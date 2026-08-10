import * as Sentry from "@sentry/react-native";
import { post } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import * as AppleAuthentication from "expo-apple-authentication";

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
 * Revoke the user's Apple token as part of deleting their account.
 *
 * Apple requires this of any app offering Sign in with Apple — skip it and the
 * account disappears on our side while Apple still lists ARtifact under the
 * user's Apple ID. It pairs with guideline 5.1.1(v) and reviewers check.
 *
 * Revocation needs a `client_secret` signed with the Apple private key, so it
 * happens in the `artifactAppleRevoke` Lambda. Rather than storing a refresh
 * token per user forever, the app requests a FRESH authorization code here and
 * the Lambda exchanges and revokes it immediately — nothing is stored, and the
 * Apple sheet doubles as confirmation before an irreversible action.
 *
 * TRANSPORT: Amplify's REST client, which signs with the Identity Pool's
 * authenticated credentials. Two alternatives are dead ends, recorded so they
 * are not retried:
 *  - `@aws-sdk/client-lambda` requires `node:https`; React Native has no such
 *    module and the app fails to bundle entirely.
 *  - Lambda Function URLs are blocked at the account level (403 regardless of
 *    the resource policy).
 */
export async function revokeAppleToken(): Promise<boolean> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    const authorizationCode = credential.authorizationCode;
    if (!authorizationCode) return false;

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    if (!idToken) return false;

    const { body } = await post({
      apiName: "rekognitionApi",
      path: "/revokeApple",
      options: { body: { idToken, authorizationCode } },
    }).response;

    const parsed = (await body.json()) as { revoked?: boolean } | null;
    return parsed?.revoked === true;
  } catch (err) {
    // Never block deletion on this. A user entitled to delete their account
    // should not be stopped because Apple is unreachable — a token outliving
    // the account is a better outcome than an account that cannot be deleted.
    Sentry.captureException(err, {
      tags: { component: "appleRevocation", action: "revoke" },
    });
    return false;
  }
}
