import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import * as Sentry from "@sentry/react-native";
import { fetchAuthSession } from "aws-amplify/auth";
import * as AppleAuthentication from "expo-apple-authentication";

/** Set when a user signs in with Apple; read by the deletion flow. */
export const APPLE_LINKED_KEY = "artifact.appleLinked";

const FUNCTION_NAME = "artifactAppleRevoke";
const REGION = "us-east-1";

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
export async function revokeAppleToken(): Promise<boolean> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });

    const authorizationCode = credential.authorizationCode;
    if (!authorizationCode) return false;

    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    const credentials = session.credentials;
    if (!idToken || !credentials) return false;

    const client = new LambdaClient({
      region: REGION,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    const result = await client.send(
      new InvokeCommand({
        FunctionName: FUNCTION_NAME,
        Payload: new TextEncoder().encode(
          JSON.stringify({ idToken, authorizationCode })
        ),
      })
    );

    const raw = result.Payload
      ? new TextDecoder().decode(result.Payload)
      : "{}";
    const parsed = JSON.parse(raw) as { statusCode?: number };
    return parsed.statusCode === 200;
  } catch (err) {
    // Never block deletion on this. A user who wants their account gone is
    // entitled to that even if Apple's endpoint is unreachable — failing the
    // whole flow here would be a worse 5.1.1(v) outcome than a token that
    // outlives the account. Reported so it does not fail silently.
    Sentry.captureException(err, {
      tags: { component: "appleRevocation", action: "revoke" },
    });
    return false;
  }
}
