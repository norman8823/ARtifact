import { useAuthContext } from "@/src/contexts/AuthContext";
import * as Sentry from "@sentry/react-native";
import { fetchUserAttributes, signInWithRedirect } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { useUserData } from "./useUserData";

/**
 * Sign in with Apple, through Cognito's hosted UI.
 *
 * Cognito user pools cannot exchange Apple's *native* sheet token for
 * user-pool tokens — federation is hosted-UI only — so this opens a browser
 * session rather than the native Apple sheet. The alternative was a
 * CUSTOM_AUTH flow backed by Lambda triggers.
 *
 * The completion runs in a Hub listener, not after the `signInWithRedirect`
 * call: that call returns as soon as the browser opens, and control comes back
 * via the `artifact://` deep link, which may even relaunch the app.
 */
export function useAppleSignIn() {
  const router = useRouter();
  const { refreshAuth } = useAuthContext();
  const { ensureUserInDB } = useUserData();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const stop = Hub.listen("auth", async ({ payload }) => {
      switch (payload.event) {
        case "signInWithRedirect": {
          try {
            const attrs = await fetchUserAttributes();
            // Apple only returns a name on the user's FIRST authorization, and
            // Cognito does not persist it (the app client can only write email
            // and phone_number). So fall back rather than treating it as
            // reliably present.
            const displayName =
              [attrs.given_name, attrs.family_name].filter(Boolean).join(" ") ||
              attrs.name ||
              undefined;

            // Same sequence as emailLogin, and the order is load-bearing:
            // ensureUserInDB, then await refreshAuth, THEN navigate. Navigating
            // before refreshAuth resolves leaves getAuthMode() on "apiKey", and
            // every owner-scoped query on Home is denied — an empty-state bug
            // that only reproduces under release timing.
            await ensureUserInDB(displayName, attrs.email);
            await refreshAuth();
            router.replace("/home");
          } catch (err) {
            Sentry.captureException(err, {
              tags: { component: "useAppleSignIn", action: "complete" },
            });
          } finally {
            setIsSigningIn(false);
          }
          break;
        }
        case "signInWithRedirect_failure": {
          setIsSigningIn(false);
          Sentry.captureMessage("Apple sign-in failed", {
            level: "error",
            tags: { component: "useAppleSignIn", action: "redirect" },
            extra: { data: JSON.stringify(payload.data ?? null) },
          });
          break;
        }
      }
    });

    return stop;
  }, [ensureUserInDB, refreshAuth, router]);

  const signInWithApple = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await signInWithRedirect({ provider: "Apple" });
    } catch (err) {
      setIsSigningIn(false);
      // A user dismissing the browser is not an error worth reporting.
      const name = (err as { name?: string })?.name;
      if (name !== "UserCancelledError") {
        Sentry.captureException(err, {
          tags: { component: "useAppleSignIn", action: "start" },
        });
      }
    }
  }, []);

  return { signInWithApple, isSigningIn };
}
