import { type ListArtworksQuery } from "@/src/API";
import { listArtworks } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

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

  const checkAuthState = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      if (!session.tokens?.accessToken || !session.tokens?.idToken) {
        throw new Error("No valid auth tokens found");
      }
    } catch (authError) {
      console.error("Error checking auth state:", authError);
      throw new Error("Authentication required");
    }
  }, []);

  const getArtworksByIds = useCallback(
    async (artworkIds: string[]) => {
      setIsLoading(true);
      setError(null);
      try {
        await checkAuthState();

        // Fetch artworks one by one since DynamoDB doesn't support IN operator
        const artworkPromises = artworkIds.map((id) =>
          client.graphql<ListArtworksQuery>({
            query: listArtworks,
            variables: {
              filter: {
                id: { eq: id },
              },
            },
            authMode: "userPool" as any,
          })
        );

        const results = await Promise.all(artworkPromises);

        // Process all results
        const artworks = results
          .flatMap((result) => {
            if ("errors" in result && result.errors) {
              console.error("GraphQL Errors:", result.errors);
              return [];
            }
            return result.data?.listArtworks?.items || [];
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
    },
    [checkAuthState]
  );

  return {
    getArtworksByIds,
    isLoading,
    error,
  };
}
