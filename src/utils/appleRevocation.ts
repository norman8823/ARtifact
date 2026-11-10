import * as Sentry from "@sentry/react-native";
import { post } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { readAppleEmailClaim } from "./appleToken";

/**
 * Request a fresh Apple code and exchange/revoke it through the existing
 * authenticated REST endpoint. A false result means deletion must offer
 * manual Apple removal (TN3194); it must never claim revocation succeeded.
 */
export async function revokeAppleToken(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    const accountEmail = session.tokens?.idToken?.payload.email;
    if (!idToken || typeof accountEmail !== "string") return false;

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    const authorizationCode = credential.authorizationCode;
    if (!authorizationCode) return false;

    // Prevent accidentally revoking a different Apple account selected in
    // the sheet. The server authenticates the Cognito token independently.
    const appleEmail = credential.identityToken
      ? readAppleEmailClaim(credential.identityToken)
      : null;
    if (!appleEmail || appleEmail.toLowerCase() !== accountEmail.toLowerCase()) {
      return false;
    }

    const { body } = await post({
      apiName: "rekognitionApi",
      path: "/revokeApple",
      options: { body: { idToken, authorizationCode } },
    }).response;

    const parsed = (await body.json()) as { revoked?: boolean } | null;
    return parsed?.revoked === true;
  } catch (err) {
    if ((err as { code?: string })?.code === "ERR_REQUEST_CANCELED") return false;
    // Keep deletion available and surface the manual-removal fallback.
    Sentry.captureException(err, {
      tags: { component: "appleRevocation", action: "revoke" },
    });
    return false;
  }
}
