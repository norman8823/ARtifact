import { Auth } from "aws-amplify";
import { useCallback, useState } from "react";

export interface AuthError {
  message: string;
  code?: string;
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, phoneNumber: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await Auth.signUp({
          username: email,
          password,
          attributes: {
            email,
            phone_number: phoneNumber.startsWith("+")
              ? phoneNumber
              : `+${phoneNumber}`,
          },
        });
        return { isVerificationRequired: true };
      } catch (err: any) {
        setError({
          message: err.message || "An error occurred during sign up",
          code: err.code,
        });
        throw err;
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
        await Auth.confirmSignUp(email, code);
      } catch (err: any) {
        setError({
          message: err.message || "An error occurred during confirmation",
          code: err.code,
        });
        throw err;
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
        await Auth.signIn(email, password);
      } catch (err: any) {
        setError({
          message: err.message || "An error occurred during sign in",
          code: err.code,
        });
        throw err;
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
  };
}
