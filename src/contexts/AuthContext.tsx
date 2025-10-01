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

  const initializeAuth = useCallback(async () => {
    try {
      console.log("🔐 AuthContext: Initializing authentication...");

      // Give AsyncStorage adequate time to load tokens
      // This prevents race conditions on cold app starts
      await new Promise((resolve) => setTimeout(resolve, 250));

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
        setIsAuthenticated(true);
      } else {
        console.log("⚠️ AuthContext: No valid tokens found");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log("ℹ️ AuthContext: No authenticated user found");
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
    await initializeAuth();
  }, [initializeAuth]);

  const signOut = useCallback(async () => {
    try {
      console.log("👋 AuthContext: Signing out...");
      await amplifySignOut();
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
      console.log("✅ AuthContext: Sign out complete");
    } catch (error) {
      console.error("❌ AuthContext: Error signing out:", error);
      throw error;
    }
  }, []);

  useEffect(() => {
    initializeAuth();
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
