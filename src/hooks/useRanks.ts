import { type ListRanksQuery } from "@/src/API";
import { listRanks } from "@/src/graphql/queries";
import { asQueryResult } from "@/src/aws/graphqlResult";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";
import { getRankForXP } from "../utils/rankUtils";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

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
  const getAllRanks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = asQueryResult<ListRanksQuery>(
        await getClient().graphql<ListRanksQuery>({
          query: listRanks,
          variables: {
            limit: 1000,
          },
          authMode: "userPool",
        })
      );

      if ("errors" in result && result.errors) {
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      const items = result.data?.listRanks?.items || [];

      // Map and sort ranks by minXP
      return items
        .filter((item): item is NonNullable<typeof item> => item !== null)
        // The generated types make these optional (`icon?: string | null`), so
        // normalise nullish to null here rather than widening the Rank
        // interface — the boundary between GraphQL shapes and app types is the
        // right place to do it.
        .map((rank): Rank => ({
          id: rank.id,
          title: rank.title,
          minXP: rank.minXP ?? 0,
          maxXP: rank.maxXP ?? 0,
          icon: rank.icon ?? null,
          description: rank.description ?? null,
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
  }, []);

  const getRankByXP = useCallback(
    async (xpPoints: number) => {
      try {
        const ranks = await getAllRanks();
        return getRankForXP(ranks, xpPoints);
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
