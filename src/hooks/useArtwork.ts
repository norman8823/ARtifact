import { type GetArtworkQuery } from "@/src/API";
import { getArtwork } from "@/src/graphql/queries";
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
  isFeatured: boolean | null;
  hasAudio: boolean | null;
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
    console.log("useArtwork - Starting getArtworkById with id:", id);
    setIsLoading(true);
    setError(null);
    try {
      // Check authentication state
      console.log("useArtwork - Checking authentication state...");
      try {
        const user = await getCurrentUser();
        console.log("useArtwork - Current user:", user.username);

        const session = await fetchAuthSession();
        console.log("useArtwork - Auth session tokens:", {
          accessToken:
            session.tokens?.accessToken?.toString().substring(0, 20) + "...",
          idToken: session.tokens?.idToken?.toString().substring(0, 20) + "...",
        });

        // Make sure we have valid tokens before proceeding
        if (!session.tokens?.accessToken || !session.tokens?.idToken) {
          console.error("useArtwork - No valid auth tokens found");
          throw new Error("No valid auth tokens found");
        }
      } catch (authError) {
        console.error("useArtwork - Error checking auth state:", authError);
        throw new Error("Authentication required");
      }

      console.log("useArtwork - Making GraphQL query for artwork:", id);
      const result = await client.graphql<GetArtworkQuery>({
        query: getArtwork,
        variables: {
          id,
        },
        authMode: "userPool" as any,
      });

      console.log(
        "useArtwork - Raw API Response:",
        JSON.stringify(result, null, 2)
      );

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
        isFeatured: artwork.isFeatured,
        hasAudio: artwork.hasAudio,
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
