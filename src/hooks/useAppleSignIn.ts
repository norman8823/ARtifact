import { APPLE_LINKED_KEY } from "@/src/utils/appleRevocation";
import { useAuthContext } from "@/src/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  generateThrowawayPassword,
  readAppleEmailClaim,
} from "@/src/utils/appleToken";
import * as Sentry from "@sentry/react-native";
import { confirmSignIn, signIn, signOut, signUp } from "aws-amplify/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

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
    let lastStep = "(not started)";
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
        lastStep = result.nextStep?.signInStep ?? "(none)";
        if (result.isSignedIn) return;
        if (
          result.nextStep?.signInStep ===
          "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"
        ) {
          // The Lambda verifies this token; the client only carries it.
          const confirmed = await confirmSignIn({
            challengeResponse: identityToken,
          });
          lastStep = `confirmed:${confirmed.nextStep?.signInStep ?? "done"}`;
          return;
        }
        // Anything else is unexpected — surface it instead of silently
        // returning as though sign-in had succeeded.
        throw new Error(`Unexpected sign-in step: ${lastStep}`);
      };

      try {
        await runCustomAuth();
      } catch (err) {
        const name = (err as { name?: string })?.name;

        // Amplify refuses a new sign-in while a stale session exists.
        if (name === "UserAlreadyAuthenticatedException") {
          await signOut();
          await runCustomAuth();
        } else if (name === "UserNotFoundException") {
          // ONLY UserNotFoundException means "create the account". Treating
          // NotAuthorizedException as that too was wrong: Cognito raises it for
          // several reasons, so a genuine auth failure got misrouted into
          // signUp, which then hit an existing account and buried the real
          // error (observed 2026-08-10 — the Lambda logs showed
          // userNotFound:false and a challenge issued, then PreSignUp_SignUp).
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
          try {
            await runCustomAuth();
          } catch (retryErr) {
            const retryName = (retryErr as { name?: string })?.name;
            // The account already existed — the signUp was unnecessary, so just
            // authenticate.
            if (retryName === "UsernameExistsException") await runCustomAuth();
            else throw retryErr;
          }
        } else {
          throw err;
        }
      }

      // Order is load-bearing and mirrors emailLogin: ensureUserInDB, then
      // await refreshAuth, THEN navigate. Navigating first leaves
      // getAuthMode() on "apiKey" and every owner-scoped query on Home is
      // denied — an empty-state bug that only reproduces under release timing.
      // Remember that this account is Apple-linked: account deletion must
      // revoke the Apple token, and there is no other way to tell afterwards
      // (Cognito shows only the email, which the email flow also uses).
      await AsyncStorage.setItem(APPLE_LINKED_KEY, "true");

      await ensureUserInDB(displayName, email);
      await refreshAuth();
      router.replace("/home");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // The user tapping Cancel on Apple's sheet is not an error.
      if (code !== "ERR_REQUEST_CANCELED") {
        const e = err as { name?: string; message?: string };
        Sentry.captureException(err, {
          tags: { component: "useAppleSignIn", action: "signIn" },
          extra: { lastStep },
        });
        // A real failure the user can act on, without leaking internals.
        // (`lastStep` still goes to Sentry for diagnosis.)
        void e;
        Alert.alert(
          "Sign-in failed",
          "We couldn't complete sign in with Apple. Please try again."
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [ensureUserInDB, refreshAuth, router]);

  return { signInWithApple, isSigningIn };
}
