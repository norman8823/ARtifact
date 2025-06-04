import {
  CreateFavoritedInput,
  DeleteFavoritedInput,
  ListFavoritedsQuery,
} from "@/src/API";
import { createFavorited, deleteFavorited } from "@/src/graphql/mutations";
import { listFavoriteds } from "@/src/graphql/queries";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export function useFavorites() {
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

  const checkIfFavorited = useCallback(
    async (artworkId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await checkAuthState();

        const result = (await client.graphql<ListFavoritedsQuery>({
          query: listFavoriteds,
          variables: {
            filter: {
              and: [
                { userId: { eq: user.userId } },
                { artworkId: { eq: artworkId } },
              ],
            },
          },
          authMode: "userPool",
        })) as GraphQLResult<ListFavoritedsQuery>;

        if ("errors" in result && result.errors) {
          throw new Error(result.errors.map((e) => e.message).join(", "));
        }

        const favorites = result.data?.listFavoriteds?.items || [];
        return favorites.length > 0 ? favorites[0] : null;
      } catch (err) {
        console.error("Error checking if artwork is favorited:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuthState]
  );

  const toggleFavorite = useCallback(
    async (artworkId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await checkAuthState();
        const existingFavorite = await checkIfFavorited(artworkId);

        if (existingFavorite) {
          // Remove favorite
          const deleteInput: DeleteFavoritedInput = {
            id: existingFavorite.id,
          };

          await client.graphql({
            query: deleteFavorited,
            variables: { input: deleteInput },
            authMode: "userPool",
          });

          return false; // Indicates the artwork is now unfavorited
        } else {
          // Add favorite
          const createInput: CreateFavoritedInput = {
            userId: user.userId,
            artworkId: artworkId,
            timestamp: new Date().toISOString(),
          };

          await client.graphql({
            query: createFavorited,
            variables: { input: createInput },
            authMode: "userPool",
          });

          return true; // Indicates the artwork is now favorited
        }
      } catch (err) {
        console.error("Error toggling favorite:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuthState, checkIfFavorited]
  );

  return {
    checkIfFavorited,
    toggleFavorite,
    isLoading,
    error,
  };
}
