import { type ListRanksQuery } from "@/src/API";
import { listRanks } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface Rank {
  id: string;
  title: string;
  minXP: number;
  maxXP: number;
  icon: string | null;
  description: string | null;
}

export function useRanks() {
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

  const getAllRanks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkAuthState();

      const result = await client.graphql<ListRanksQuery>({
        query: listRanks,
        variables: {
          limit: 1000,
        },
        authMode: "userPool",
      });

      if ("errors" in result && result.errors) {
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      const items = result.data?.listRanks?.items || [];

      // Map and sort ranks by minXP
      return items
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map((rank) => ({
          id: rank.id,
          title: rank.title,
          minXP: rank.minXP || 0,
          maxXP: rank.maxXP || 0,
          icon: rank.icon,
          description: rank.description,
        }))
        .sort((a, b) => a.minXP - b.minXP);
    } catch (err) {
      console.error("Error fetching ranks:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthState]);

  const getRankByXP = useCallback(
    async (xpPoints: number) => {
      try {
        const ranks = await getAllRanks();
        return (
          ranks.find(
            (rank) => xpPoints >= rank.minXP && xpPoints <= rank.maxXP
          ) || ranks[0]
        );
      } catch (err) {
        console.error("Error getting rank by XP:", err);
        return null;
      }
    },
    [getAllRanks]
  );

  return {
    getAllRanks,
    getRankByXP,
    isLoading,
    error,
  };
}
