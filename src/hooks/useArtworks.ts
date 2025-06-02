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
  isFeatured: boolean | null;
}

export function useArtworks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getFeaturedArtworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check authentication state
      console.log("Checking authentication state...");
      try {
        const user = await getCurrentUser();
        console.log("Current user:", user.username);

        const session = await fetchAuthSession();
        console.log("Auth session tokens:", {
          accessToken:
            session.tokens?.accessToken?.toString().substring(0, 20) + "...",
          idToken: session.tokens?.idToken?.toString().substring(0, 20) + "...",
        });

        // Make sure we have valid tokens before proceeding
        if (!session.tokens?.accessToken || !session.tokens?.idToken) {
          throw new Error("No valid auth tokens found");
        }
      } catch (authError) {
        console.error("Error checking auth state:", authError);
        throw new Error("Authentication required");
      }

      console.log("Fetching featured artworks as authenticated user...");
      const result = await client.graphql<ListArtworksQuery>({
        query: listArtworks,
        variables: {
          filter: {
            isFeatured: { eq: true },
          },
          limit: 5,
        },
        authMode: "userPool" as any
      });

      console.log("Raw API Response:", JSON.stringify(result, null, 2));

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
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<(typeof result.data.listArtworks.items)[number]>
          ) => ({
            id: item.id,
            title: item.title,
            artistDisplayName: item.artistDisplayName,
            primaryImage: item.primaryImage,
            primaryImageSmall: item.primaryImageSmall,
            isFeatured: item.isFeatured,
          })
        );

      console.log("Fetched artworks:", artworks.length);
      return artworks;
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

  return {
    getFeaturedArtworks,
    isLoading,
    error,
  };
}
