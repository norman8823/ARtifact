import { type ListUserXPSQuery } from "@/src/API";
import { listUserXPS } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface UserXP {
  id: string;
  userId: string;
  xpPoints: number;
  timestamp: string;
}

export function useUserXP() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkAuthState = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      if (!session.tokens?.accessToken || !session.tokens?.idToken) {
        throw new Error("No valid auth tokens found");
      }

      return user;
    } catch (authError) {
      console.error("Error checking auth state:", authError);
      throw new Error("Authentication required");
    }
  }, []);

  const getUserXP = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await checkAuthState();

      const result = await client.graphql<ListUserXPSQuery>({
        query: listUserXPS,
        variables: {
          filter: {
            userId: { eq: user.userId },
          },
          limit: 1000,
        },
        authMode: "userPool",
      });

      if ("errors" in result && result.errors) {
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      const items = result.data?.listUserXPS?.items || [];

      // Get the latest XP record for the user
      const userXP = items
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt);
          const dateB = new Date(b.timestamp || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })[0];

      if (!userXP) {
        // Return default values if no XP record exists
        return {
          id: "default",
          userId: user.userId,
          xpPoints: 0,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: userXP.id,
        userId: userXP.userId,
        xpPoints: userXP.xpPoints || 0,
        timestamp: userXP.timestamp || userXP.createdAt,
      };
    } catch (err) {
      console.error("Error fetching user XP:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthState]);

  return {
    getUserXP,
    isLoading,
    error,
  };
}
