import { type SignInOutput } from "@aws-amplify/auth";
import * as Sentry from "@sentry/react-native";
import { confirmSignUp, signIn, signOut, signUp } from "aws-amplify/auth";
import { useCallback, useState } from "react";
import { useUserData } from "./useUserData";

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
    phoneNumber: string,
    username: string
  ) => Promise<{ isVerificationRequired: boolean }>;
  confirmEmailSignUp: (
    email: string,
    code: string
  ) => Promise<{ isSignUpConfirmed: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<SignInOutput>;
  signOut: () => Promise<void>;
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
    async (
      email: string,
      password: string,
      phoneNumber: string,
      username: string
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Starting sign up process for email:", email);
        // Store password and username for auto sign-in after confirmation
        setTempPassword(password);
        setTempUsername(username);

        const formattedPhoneNumber = phoneNumber.startsWith("+")
          ? phoneNumber
          : `+${phoneNumber}`;

        const signUpResult = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              phone_number: formattedPhoneNumber,
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

      // Set user context for Sentry
      Sentry.setUser({
        email,
        username: tempUsername || email,
      });

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
          // Ensure user exists in DynamoDB with the correct username and email
          await ensureUserInDB(tempUsername || undefined, email);
        }

        return signInResult;
      } catch (err: any) {
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

  return {
    isLoading,
    error,
    signUpWithEmail,
    confirmEmailSignUp,
    signInWithEmail,
    signOut: handleSignOut,
    getStoredPassword,
    clearTempCredentials,
  };
}
