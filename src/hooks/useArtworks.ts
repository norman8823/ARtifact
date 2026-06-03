import { type ListArtworksQuery } from "@/src/API";
import { listArtworks } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { getAuthMode } from "@/src/aws/authMode";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface Artwork {
  id: string;
  title: string;
  artistDisplayName: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  isFeatured: boolean | null;
  isScannable: boolean | null;
  hasAR: boolean | null;
  culture: string | null;
  medium: string | null;
  classification: string | null;
  objectType: string | null;
  tags: (string | null)[] | null;
  description: string | null;
}

export function useArtworks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getFeaturedArtworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // console.log("Fetching featured artworks as authenticated user...");
      const authMode = getAuthMode();
      const result = await getClient().graphql<ListArtworksQuery>({
        query: listArtworks,
        variables: {
          filter: {
            isFeatured: { eq: true },
          },
          // Get all featured artworks first, then we'll randomly select from them
          limit: 1000,
        },
        authMode: authMode as any,
      });

      // Log the raw response for debugging
      // console.log("Raw API Response:", result);

      // Type guard for GraphQL errors
      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      // Type guard for data
      if (!("data" in result) || !result.data?.listArtworks?.items) {
        console.log("No data in response");
        return [];
      }

      // Log the raw items before filtering
      // console.log("Raw items from API:", result.data.listArtworks.items);

      // Map the DynamoDB items to our simplified Artwork interface
      const allFeaturedArtworks = result.data.listArtworks.items
        .filter((item: any): item is NonNullable<typeof item> => {
          if (item === null) return false;
          // Validate required fields
          if (!item.id || typeof item.id !== "string") {
            console.warn("Invalid artwork item:", item);
            return false;
          }
          return true;
        })
        .map(
          (
            item: NonNullable<(typeof result.data.listArtworks.items)[number]>
          ) => ({
            id: item.id,
            title: item.title || "",
            artistDisplayName: item.artistDisplayName || null,
            primaryImage: item.primaryImage || null,
            primaryImageSmall: item.primaryImageSmall || null,
            isFeatured: item.isFeatured || false,
            isScannable: item.isScannable || false,
            hasAR: item.hasAR || false,
            culture: item.culture || null,
            medium: item.medium || null,
            classification: item.classification || null,
            objectType: item.objectType || null,
            tags: item.tags || null,
            description: item.description || null,
          })
        );

      // console.log("Fetched featured artworks:", allFeaturedArtworks.length);
      // console.log("Featured artworks details:", allFeaturedArtworks.map(a => ({
      //   id: a.id,
      //   title: a.title,
      //   isFeatured: a.isFeatured
      // })));

      // Randomly select 5 artworks
      const randomFeaturedArtworks = allFeaturedArtworks
        .sort(() => Math.random() - 0.5) // Shuffle the array
        .slice(0, 5); // Take the first 5 items

      // console.log("Selected random featured artworks:", randomFeaturedArtworks.length);
      return randomFeaturedArtworks;
    } catch (err) {
      console.error("Error fetching featured artworks:", err);
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      }
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllArtworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching all artworks as authenticated user...");
      const authMode = getAuthMode();
      const result = await getClient().graphql<ListArtworksQuery>({
        query: listArtworks,
        variables: {
          limit: 1000, // Set a high limit to get all artworks
        },
        authMode: authMode as any,
      });

      // Log the raw response for debugging
      // console.log("Raw API Response:", result);

      // Type guard for GraphQL errors
      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      // Type guard for data
      if (!("data" in result) || !result.data?.listArtworks?.items) {
        console.log("No data in response");
        return [];
      }

      // Map the DynamoDB items to our simplified Artwork interface
      const artworks = result.data.listArtworks.items
        .filter((item: any): item is NonNullable<typeof item> => {
          if (item === null) return false;
          // Validate required fields
          if (!item.id || typeof item.id !== "string") {
            console.warn("Invalid artwork item:", item);
            return false;
          }
          return true;
        })
        .map(
          (
            item: NonNullable<(typeof result.data.listArtworks.items)[number]>
          ) => ({
            id: item.id,
            title: item.title || "",
            artistDisplayName: item.artistDisplayName || null,
            primaryImage: item.primaryImage || null,
            primaryImageSmall: item.primaryImageSmall || null,
            isFeatured: item.isFeatured || false,
            isScannable: item.isScannable || false,
            hasAR: item.hasAR || false,
            culture: item.culture || null,
            medium: item.medium || null,
            classification: item.classification || null,
            objectType: item.objectType || null,
            tags: item.tags || null,
            description: item.description || null,
          })
        );

      console.log("Fetched all artworks:", artworks.length);
      return artworks;
    } catch (err) {
      console.error("Error fetching all artworks:", err);
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      }
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getFeaturedArtworks,
    getAllArtworks,
    isLoading,
    error,
  };
}
