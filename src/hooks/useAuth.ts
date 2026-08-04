import { type SignInOutput } from "@aws-amplify/auth";
import * as Sentry from "@sentry/react-native";
import {
  confirmResetPassword,
  confirmSignUp,
  getCurrentUser,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { useCallback, useState } from "react";
import { useUserData } from "./useUserData";

/**
 * Identify the Sentry session by Cognito sub, and nothing else.
 *
 * Deliberately NOT the email address or display name. Sentry is a third party,
 * the sub is all that's needed to tell whether an error hits one user or many,
 * and the published privacy policy describes exactly this — "an identifier for
 * your account". Sending the email would make that live wording false and would
 * hand a vendor every user's address for the sake of debugging.
 *
 * Must be called only AFTER sign-in succeeds: the sub does not exist until
 * then, which is why the old call sat before `signIn` and used the email.
 */
const identifySentryUser = async (): Promise<void> => {
  try {
    const { userId } = await getCurrentUser();
    Sentry.setUser({ id: userId });
  } catch {
    // Telemetry identification must never break sign-in. Leaving the previous
    // identity attached would misattribute errors, so clear it instead.
    Sentry.setUser(null);
  }
};

export interface AuthError {
  message: string;
  code?: string;
  name?: string;
}

export interface UseAuthReturn {
  isLoading: boolean;
  error: AuthError | null;
  signUpWithEmail: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ isVerificationRequired: boolean }>;
  confirmEmailSignUp: (
    email: string,
    code: string
  ) => Promise<{ isSignUpConfirmed: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<SignInOutput>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ isCodeSent: boolean }>;
  confirmPasswordReset: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<{ isPasswordReset: boolean }>;
  getStoredPassword: () => string;
  clearTempCredentials: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [tempPassword, setTempPassword] = useState<string>("");
  const [tempUsername, setTempUsername] = useState<string>("");
  const { ensureUserInDB } = useUserData();

  const handleError = (err: any, context?: string) => {
    const errorDetails = {
      name: err.name,
      code: err.code,
      message: err.message || "An unknown error occurred",
      details: err.details,
    };

    // Log to Sentry with essential context
    Sentry.captureException(err, {
      tags: {
        component: "useAuth",
        action: context || "unknown",
      },
      extra: {
        errorDetails,
        context,
      },
    });

    console.error("Auth Error Details:", JSON.stringify(errorDetails, null, 2));

    setError({
      message: errorDetails.message,
      code: errorDetails.code,
      name: errorDetails.name,
    });

    throw err;
  };

  const signUpWithEmail = useCallback(
    async (email: string, password: string, username: string) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting sign up process for email:", email);
        // Store password and username for auto sign-in after confirmation
        setTempPassword(password);
        setTempUsername(username);

        const signUpResult = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              phone_number: "+10000000000", // Dummy phone number to satisfy Cognito + requirement
            },
          },
        });

        console.log("Sign up result:", JSON.stringify(signUpResult, null, 2));
        return { isVerificationRequired: true };
      } catch (err: any) {
        return handleError(err, "signUpWithEmail");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting sign in process for email:", email);

        const signInResult = await signIn({
          username: email,
          password,
          options: {
            authFlowType: "USER_PASSWORD_AUTH",
          },
        });

        console.log(
          "Sign in result:",
          JSON.stringify(
            {
              isSignedIn: signInResult.isSignedIn,
              nextStep: signInResult.nextStep,
            },
            null,
            2
          )
        );

        if (signInResult.isSignedIn) {
          await identifySentryUser();

          // Ensure user exists in DynamoDB with the correct username and email
          await ensureUserInDB(tempUsername || undefined, email);
        }

        return signInResult;
      } catch (err: any) {
        // Handle case where there's already a signed-in user
        if (err.name === "UserAlreadyAuthenticatedException") {
          console.log("User already authenticated, signing out first...");
          try {
            await signOut();
            console.log("Previous session cleared, retrying sign in...");

            // Retry the sign in after clearing the previous session
            const retrySignInResult = await signIn({
              username: email,
              password,
              options: {
                authFlowType: "USER_PASSWORD_AUTH",
              },
            });

            if (retrySignInResult.isSignedIn) {
              await identifySentryUser();
              await ensureUserInDB(tempUsername || undefined, email);
            }

            return retrySignInResult;
          } catch (retryErr: any) {
            return handleError(retryErr, "signInWithEmail_retry");
          }
        }

        return handleError(err, "signInWithEmail");
      } finally {
        setIsLoading(false);
      }
    },
    [ensureUserInDB, tempUsername]
  );

  const confirmEmailSignUp = useCallback(
    async (email: string, code: string) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting confirmation for email:", email);

        const confirmResult = await confirmSignUp({
          username: email,
          confirmationCode: code,
        });

        console.log(
          "Confirmation result:",
          JSON.stringify(confirmResult, null, 2)
        );

        // DO NOT automatically sign in here. Let the UI handle it.
        // Return just the confirmation result with a success flag
        return { isSignUpConfirmed: true };
      } catch (err: any) {
        return handleError(err, "confirmEmailSignUp");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSignOut = useCallback(async () => {
    console.log("Starting sign out process...");
    setIsLoading(true);
    setError(null);

    try {
      await signOut();

      // Clear user context
      Sentry.setUser(null);

      console.log("Sign out completed successfully");
    } catch (err: any) {
      return handleError(err, "handleSignOut");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStoredPassword = useCallback(() => {
    return tempPassword;
  }, [tempPassword]);

  const clearTempCredentials = useCallback(() => {
    setTempPassword("");
    setTempUsername("");
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Requesting password reset for email:", email);

      const resetResult = await resetPassword({
        username: email,
      });

      console.log(
        "Password reset result:",
        JSON.stringify(resetResult, null, 2)
      );

      return { isCodeSent: true };
    } catch (err: any) {
      return handleError(err, "requestPasswordReset");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPasswordReset = useCallback(
    async (email: string, code: string, newPassword: string) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Confirming password reset for email:", email);

        await confirmResetPassword({
          username: email,
          confirmationCode: code,
          newPassword,
        });

        console.log("Password reset confirmed successfully");

        return { isPasswordReset: true };
      } catch (err: any) {
        return handleError(err, "confirmPasswordReset");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    signUpWithEmail,
    confirmEmailSignUp,
    signInWithEmail,
    signOut: handleSignOut,
    requestPasswordReset,
    confirmPasswordReset,
    getStoredPassword,
    clearTempCredentials,
  };
}
