import { useAuthContext } from "@/src/contexts/AuthContext";
import {
  generateThrowawayPassword,
  readAppleEmailClaim,
} from "@/src/utils/appleToken";
import * as Sentry from "@sentry/react-native";
import { confirmSignIn, signIn, signOut, signUp } from "aws-amplify/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { useUserData } from "./useUserData";

/**
 * Sign in with Apple — native sheet, via a Cognito CUSTOM_AUTH flow.
 *
 * NOT hosted-UI federation. That path is impossible on this pool: `phone_number`
 * is a required attribute, Cognito force-maps required attributes from an IdP
 * claim, Apple has no phone claim, and Cognito validates the field as E.164 —
 * so federated user creation always fails with `Invalid phone number format`,
 * and the mapping cannot be removed (proven 2026-08-10; see CLAUDE.md).
 *
 * CUSTOM_AUTH sidesteps it because the *app* creates the account and supplies
 * the same valid dummy phone the email flow already uses. It also means Apple's
 * native sheet instead of a browser session — one tap and Face ID.
 *
 * The Lambda (`artifactAppleAuth`) is the security boundary: it verifies the
 * identity token against Apple's JWKS and refuses to issue tokens unless the
 * verified email matches the Cognito user. Nothing here is trusted.
 */
export function useAppleSignIn() {
  const router = useRouter();
  const { refreshAuth } = useAuthContext();
  const { ensureUserInDB } = useUserData();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInWithApple = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) throw new Error("Apple returned no identity token");

      // Read the email from the TOKEN, not from `credential.email` — the latter
      // is null on every sign-in after the user's first authorization.
      const email = readAppleEmailClaim(identityToken);
      if (!email) throw new Error("Apple identity token carried no email");

      // Apple sends the name only on that first authorization, so treat it as a
      // bonus rather than something to depend on.
      const displayName =
        [credential.fullName?.givenName, credential.fullName?.familyName]
          .filter(Boolean)
          .join(" ") || undefined;

      const runCustomAuth = async () => {
        const result = await signIn({
          username: email,
          options: { authFlowType: "CUSTOM_WITHOUT_SRP" },
        });
        if (
          result.nextStep?.signInStep ===
          "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"
        ) {
          // The Lambda verifies this token; the client only carries it.
          await confirmSignIn({ challengeResponse: identityToken });
        }
      };

      try {
        await runCustomAuth();
      } catch (err) {
        const name = (err as { name?: string })?.name;

        // Amplify refuses a new sign-in while a stale session exists.
        if (name === "UserAlreadyAuthenticatedException") {
          await signOut();
          await runCustomAuth();
        } else if (
          name === "UserNotFoundException" ||
          name === "NotAuthorizedException"
        ) {
          // First time this Apple account has been seen. Create the Cognito
          // user ourselves — this is the whole point of CUSTOM_AUTH: WE supply
          // the dummy phone, so Cognito never has to derive one from Apple.
          // The token goes in clientMetadata, where the PreSignUp trigger
          // verifies it before auto-confirming; without that branch PreSignUp
          // would auto-confirm the email flow too.
          await signUp({
            username: email,
            password: generateThrowawayPassword(),
            options: {
              userAttributes: { email, phone_number: "+10000000000" },
              clientMetadata: { appleIdentityToken: identityToken },
            },
          });
          await runCustomAuth();
        } else {
          throw err;
        }
      }

      // Order is load-bearing and mirrors emailLogin: ensureUserInDB, then
      // await refreshAuth, THEN navigate. Navigating first leaves
      // getAuthMode() on "apiKey" and every owner-scoped query on Home is
      // denied — an empty-state bug that only reproduces under release timing.
      await ensureUserInDB(displayName, email);
      await refreshAuth();
      router.replace("/home");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // The user tapping Cancel on Apple's sheet is not an error.
      if (code !== "ERR_REQUEST_CANCELED") {
        Sentry.captureException(err, {
          tags: { component: "useAppleSignIn", action: "signIn" },
        });
        throw err;
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [ensureUserInDB, refreshAuth, router]);

  return { signInWithApple, isSigningIn };
}
