import { type GetArtworkQuery } from "@/src/API";
import { getArtwork } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

// Helper to determine auth mode based on user session
const getAuthMode = async (): Promise<"userPool" | "apiKey"> => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken ? "userPool" : "apiKey";
  } catch {
    return "apiKey";
  }
};

export interface Artwork {
  id: string;
  title: string;
  artistDisplayName: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  additionalImages: string[] | null;
  isFeatured: boolean | null;
  hasAudio: boolean | null;
  isScannable: boolean | null;
  hasAR: boolean | null;
  arImage: string | null;
  objectDate: string | null;
  medium: string | null;
  dimensions: string | null;
  galleryNumber: string | null;
  description: string | null;
}

export function useArtwork() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getArtworkById = useCallback(async (id: string) => {
    // console.log("useArtwork - Starting getArtworkById with id:", id);
    setIsLoading(true);
    setError(null);
    try {
      // console.log("useArtwork - Making GraphQL query for artwork:", id);
      const authMode = await getAuthMode();
      const result = await getClient().graphql<GetArtworkQuery>({
        query: getArtwork,
        variables: {
          id,
        },
        authMode: authMode as any,
      });

      // console.log(
      //   "useArtwork - Raw API Response:",
      //   JSON.stringify(result, null, 2)
      // );

      // Type guard for GraphQL errors
      if ("errors" in result && result.errors) {
        console.error("useArtwork - GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      // Type guard for data
      if (!("data" in result)) {
        console.error("useArtwork - No data in response");
        return null;
      }

      if (!result.data?.getArtwork) {
        console.log("useArtwork - No artwork found with ID:", id);
        return null;
      }

      const artwork = result.data.getArtwork;
      console.log(
        "useArtwork - Successfully retrieved artwork:",
        artwork.title
      );

      // Map the DynamoDB item to our simplified Artwork interface
      return {
        id: artwork.id,
        title: artwork.title,
        artistDisplayName: artwork.artistDisplayName,
        primaryImage: artwork.primaryImage,
        primaryImageSmall: artwork.primaryImageSmall,
        additionalImages: artwork.additionalImages,
        isFeatured: artwork.isFeatured,
        hasAudio: artwork.hasAudio,
        isScannable: artwork.isScannable,
        hasAR: artwork.hasAR,
        arImage: artwork.arImage,
        objectDate: artwork.objectDate,
        medium: artwork.medium,
        dimensions: artwork.dimensions,
        galleryNumber: artwork.galleryNumber,
        description: artwork.description,
      };
    } catch (err) {
      console.error("useArtwork - Error fetching artwork:", err);
      if (err instanceof Error) {
        console.error("useArtwork - Error details:", {
          message: err.message,
          name: err.name,
          stack: err.stack,
        });
      }
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return null;
    } finally {
      setIsLoading(false);
      console.log("useArtwork - Finished getArtworkById");
    }
  }, []);

  return {
    getArtworkById,
    isLoading,
    error,
  };
}
