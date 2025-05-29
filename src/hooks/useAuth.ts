import { type SignInOutput } from "@aws-amplify/auth";
import { confirmSignUp, signIn, signOut, signUp } from "aws-amplify/auth";
import { useCallback, useState } from "react";

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
    phoneNumber: string
  ) => Promise<{ isVerificationRequired: boolean }>;
  confirmEmailSignUp: (email: string, code: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<SignInOutput>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleError = (err: any) => {
    const errorDetails = {
      name: err.name,
      code: err.code,
      message: err.message || "An unknown error occurred",
      details: err.details,
    };

    console.error("Auth Error Details:", JSON.stringify(errorDetails, null, 2));

    setError({
      message: errorDetails.message,
      code: errorDetails.code,
      name: errorDetails.name,
    });

    throw err;
  };

  const signUpWithEmail = useCallback(
    async (email: string, password: string, phoneNumber: string) => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Starting sign up process for email:", email);
        const signUpResult = await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
              phone_number: phoneNumber.startsWith("+")
                ? phoneNumber
                : `+${phoneNumber}`,
            },
          },
        });
        console.log("Sign up result:", JSON.stringify(signUpResult, null, 2));
        return { isVerificationRequired: true };
      } catch (err: any) {
        return handleError(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
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
      } catch (err: any) {
        return handleError(err);
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

        return signInResult;
      } catch (err: any) {
        return handleError(err);
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
      const signOutResult = await signOut();
      console.log("Sign out result:", JSON.stringify(signOutResult, null, 2));
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    signUpWithEmail,
    confirmEmailSignUp,
    signInWithEmail,
    signOut: handleSignOut,
  };
}
