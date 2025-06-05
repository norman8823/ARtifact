import { type ListVisitedsQuery } from "@/src/API";
import { listVisiteds } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface Visited {
  id: string;
  userId: string;
  artworkId: string;
  timestamp: string;
}

export function useVisited() {
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

  const getVisitedArtworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await checkAuthState();

      console.log("Fetching visited artworks for user:", user.userId);
      const result = await client.graphql<ListVisitedsQuery>({
        query: listVisiteds,
        variables: {
          filter: {
            userId: { eq: user.userId },
          },
          limit: 1000,
        },
        authMode: "userPool",
      });

      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      if (!("data" in result) || !result.data?.listVisiteds?.items) {
        console.log("No visited artworks found");
        return [];
      }

      const visitedArtworks = result.data.listVisiteds.items
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<(typeof result.data.listVisiteds.items)[number]>
          ) => ({
            id: item.id,
            userId: item.userId,
            artworkId: item.artworkId,
            timestamp: item.timestamp,
          })
        );

      return visitedArtworks;
    } catch (err) {
      console.error("Error fetching visited artworks:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthState]);

  const getVisitedArtworkIds = useCallback(async () => {
    const visited = await getVisitedArtworks();
    return visited.map((v) => v.artworkId);
  }, [getVisitedArtworks]);

  return {
    getVisitedArtworks,
    getVisitedArtworkIds,
    isLoading,
    error,
  };
}
