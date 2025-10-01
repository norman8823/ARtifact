import { ListFavoritedsQuery } from "@/src/API";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { listFavoriteds } from "@/src/graphql/queries";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";
import { useArtwork } from "./useArtwork";

const getClient = () => generateClient();

export interface FavoriteArtwork {
  id: string;
  title: string;
  artistDisplayName: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
}

export function useFavoriteArtworks() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getArtworkById } = useArtwork();
  const getFavoriteArtworks = useCallback(async () => {
    if (!user) {
      console.warn("No authenticated user");
      return [];
    }

    setIsLoading(true);
    setError(null);
    try {
      // Get all favorites for the user
      const result = (await getClient().graphql<ListFavoritedsQuery>({
        query: listFavoriteds,
        variables: {
          filter: {
            userId: { eq: user.userId },
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<ListFavoritedsQuery>;

      if ("errors" in result && result.errors) {
        throw new Error(result.errors.map((e) => e.message).join(", "));
      }

      const favorites = result.data?.listFavoriteds?.items || [];

      // Fetch full artwork details for each favorite
      const artworkPromises = favorites.map(async (favorite) => {
        if (!favorite?.artworkId) return null;
        const artwork = await getArtworkById(favorite.artworkId);
        if (!artwork) return null;

        // Map to FavoriteArtwork interface
        return {
          id: artwork.id,
          title: artwork.title,
          artistDisplayName: artwork.artistDisplayName,
          primaryImage: artwork.primaryImage,
          primaryImageSmall: artwork.primaryImageSmall,
        };
      });

      const artworks = await Promise.all(artworkPromises);

      // Filter out any null results
      return artworks.filter(
        (artwork): artwork is FavoriteArtwork => artwork !== null
      );
    } catch (err) {
      console.error("Error fetching favorite artworks:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user, getArtworkById]);

  const getFavoriteCount = useCallback(async () => {
    if (!user) {
      return 0;
    }

    try {
      const result = (await getClient().graphql<ListFavoritedsQuery>({
        query: listFavoriteds,
        variables: {
          filter: {
            userId: { eq: user.userId },
          },
        },
        authMode: "userPool",
      })) as GraphQLResult<ListFavoritedsQuery>;

      if ("errors" in result && result.errors) {
        throw new Error(result.errors.map((e) => e.message).join(", "));
      }

      return result.data?.listFavoriteds?.items?.length || 0;
    } catch (err) {
      console.error("Error getting favorite count:", err);
      return 0;
    }
  }, [user]);

  return {
    getFavoriteArtworks,
    getFavoriteCount,
    isLoading,
    error,
  };
}
