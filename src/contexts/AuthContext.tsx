import { useQueryClient } from "@tanstack/react-query";
import {
  signOut as amplifySignOut,
  fetchAuthSession,
  getCurrentUser,
} from "aws-amplify/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { setAuthMode } from "@/src/aws/authMode";

interface AuthTokens {
  accessToken: string;
  idToken: string;
}

interface AuthUser {
  username: string;
  userId: string;
}

interface AuthContextType {
  isAuthReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const queryClient = useQueryClient();

  const initializeAuth = useCallback(async (isColdStart = false) => {
    try {
      console.log("🔐 AuthContext: Initializing authentication...");

      // Cold-start only: give AsyncStorage time to load persisted Cognito
      // tokens, preventing a race on app launch. Skipped on warm re-auth
      // (e.g. post-login refreshAuth) where tokens are already in memory.
      // TODO(perf/screen-load-caching): this fixed 250ms delay was added to
      // guard a cold-start token race; investigate the exact race so it can be
      // replaced with a deterministic wait (or removed) rather than a guess.
      if (isColdStart) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const currentUser = await getCurrentUser();
      console.log("✅ AuthContext: User found:", currentUser.username);

      const session = await fetchAuthSession();

      // Verify we have valid tokens
      if (session.tokens?.accessToken && session.tokens?.idToken) {
        console.log("✅ AuthContext: Valid tokens found");

        setUser({
          username: currentUser.username,
          userId: currentUser.userId,
        });
        setTokens({
          accessToken: session.tokens.accessToken.toString(),
          idToken: session.tokens.idToken.toString(),
        });
        setAuthMode("userPool");
        setIsAuthenticated(true);
      } else {
        console.log("⚠️ AuthContext: No valid tokens found");
        setAuthMode("apiKey");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log("ℹ️ AuthContext: No authenticated user found");
      setAuthMode("apiKey");
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
    } finally {
      setIsAuthReady(true);
      console.log("✅ AuthContext: Auth initialization complete");
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    console.log("🔄 AuthContext: Refreshing authentication...");
    setIsAuthReady(false);
    // Warm re-auth (e.g. right after login): skip the cold-start delay.
    await initializeAuth(false);
  }, [initializeAuth]);

  const signOut = useCallback(async () => {
    try {
      console.log("👋 AuthContext: Signing out...");

      await amplifySignOut();

      // Clear local state after successful AWS sign out
      setAuthMode("apiKey");
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
      // Drop the react-query cache (in-memory + persisted) so the next user on
      // this device can't inherit the previous user's state. Keys are already
      // userId-scoped, but this also clears the at-rest AsyncStorage snapshot.
      queryClient.clear();

      console.log("✅ AuthContext: Sign out complete, state cleared");
      console.log("✅ AuthContext: isAuthenticated is now:", false);
    } catch (error) {
      console.error("❌ AuthContext: Error signing out:", error);
      // Even if AWS sign out fails, clear local state to prevent issues
      setAuthMode("apiKey");
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
      queryClient.clear();
      console.log("✅ AuthContext: Local state cleared despite sign out error");
    }
  }, [queryClient]);

  useEffect(() => {
    // Cold-start path: apply the AsyncStorage token-load delay once on launch.
    initializeAuth(true);
  }, [initializeAuth]);

  const value: AuthContextType = {
    isAuthReady,
    isAuthenticated,
    user,
    tokens,
    signOut,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
