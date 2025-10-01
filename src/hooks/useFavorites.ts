import {
  CreateFavoritedInput,
  DeleteFavoritedInput,
  ListFavoritedsQuery,
} from "@/src/API";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { createFavorited, deleteFavorited } from "@/src/graphql/mutations";
import { listFavoriteds } from "@/src/graphql/queries";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";

// Helper function to get client when needed
const getClient = () => generateClient();

export function useFavorites() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const checkIfFavorited = useCallback(
    async (artworkId: string) => {
      if (!user) {
        console.warn("No authenticated user");
        return null;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = (await getClient().graphql<ListFavoritedsQuery>({
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
    [user]
  );

  const toggleFavorite = useCallback(
    async (artworkId: string) => {
      if (!user) {
        throw new Error("No authenticated user");
      }

      setIsLoading(true);
      setError(null);
      try {
        const existingFavorite = await checkIfFavorited(artworkId);

        if (existingFavorite) {
          // Remove favorite
          const deleteInput: DeleteFavoritedInput = {
            id: existingFavorite.id,
          };

          await getClient().graphql({
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

          await getClient().graphql({
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
    [user, checkIfFavorited]
  );

  return {
    checkIfFavorited,
    toggleFavorite,
    isLoading,
    error,
  };
}
