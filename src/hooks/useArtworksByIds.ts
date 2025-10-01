import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";
import { type GetArtworkQuery } from "../API";
import { getArtwork } from "../graphql/queries";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface Artwork {
  id: string;
  title: string;
  artistDisplayName: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  medium: string | null;
  galleryNumber: string | null;
}

export function useArtworksByIds() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getArtworksByIds = useCallback(async (artworkIds: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch artworks one by one since DynamoDB doesn't support IN operator
      const artworkPromises = artworkIds.map((id) =>
        getClient().graphql<GetArtworkQuery>({
          query: getArtwork,
          variables: {
            id: id,
          },
          authMode: "userPool" as any,
        })
      );

      const results = await Promise.all(artworkPromises);

      // Process all results
      const artworks = results
        .map((result, index) => {
          const artworkId = artworkIds[index];
          if ("errors" in result && result.errors) {
            console.error(
              `GraphQL Errors for artwork ${artworkId}:`,
              result.errors
            );
            return null;
          }
          const artwork = result.data?.getArtwork;
          if (!artwork) {
            console.warn(`Artwork ${artworkId} not found in database`);
            return null;
          }
          return artwork;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map((item) => ({
          id: item.id,
          title: item.title,
          artistDisplayName: item.artistDisplayName,
          primaryImage: item.primaryImage,
          primaryImageSmall: item.primaryImageSmall,
          medium: item.medium,
          galleryNumber: item.galleryNumber,
        }));

      // Sort artworks to match the order of input IDs
      const sortedArtworks = artworkIds
        .map((id) => artworks.find((artwork) => artwork.id === id))
        .filter((artwork): artwork is Artwork => artwork !== undefined);

      // Log which artworks were found vs requested
      const foundIds = sortedArtworks.map((artwork) => artwork.id);
      const missingIds = artworkIds.filter((id) => !foundIds.includes(id));
      if (missingIds.length > 0) {
        console.warn(`Missing artworks from database:`, missingIds);
      }
      console.log(
        `Found ${foundIds.length}/${artworkIds.length} artworks for IDs:`,
        artworkIds
      );

      return sortedArtworks;
    } catch (err) {
      console.error("Error fetching artworks:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getArtworksByIds,
    isLoading,
    error,
  };
}
