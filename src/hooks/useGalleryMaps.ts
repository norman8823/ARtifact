import { type ListGalleryMapsQuery } from "@/src/API";
import { listGalleryMaps } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface GalleryMap {
  id: string;
  galleryNumber: string;
  mapURL: string;
}

export function useGalleryMaps() {
  const [galleryMaps, setGalleryMaps] = useState<GalleryMap[]>([]);
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

  const loadGalleryMaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkAuthState();

      console.log("Fetching gallery maps from database...");
      const result = await client.graphql<ListGalleryMapsQuery>({
        query: listGalleryMaps,
        variables: {
          limit: 1000, // Set a high limit to get all gallery maps
        },
        authMode: "userPool" as any,
      });

      // Type guard for GraphQL errors
      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      // Type guard for data
      if (!("data" in result) || !result.data?.listGalleryMaps?.items) {
        console.log("No data in response");
        setGalleryMaps([]);
        return;
      }

      // Map the DynamoDB items to our simplified GalleryMap interface
      const galleryMapsData = result.data.listGalleryMaps.items
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<
              (typeof result.data.listGalleryMaps.items)[number]
            >
          ) => ({
            id: item.id,
            galleryNumber: item.galleryNumber,
            mapURL: item.mapURL,
          })
        );

      // console.log("Fetched gallery maps:", galleryMapsData.length);
      setGalleryMaps(galleryMapsData);
    } catch (err) {
      console.error("Error loading gallery maps:", err);
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
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthState]);

  const getMapURLByGalleryNumber = useCallback(
    (galleryNumber: string) => {
      const galleryMap = galleryMaps.find(
        (map) => map.galleryNumber === galleryNumber
      );
      return galleryMap?.mapURL || null;
    },
    [galleryMaps]
  );

  return {
    galleryMaps,
    isLoading,
    error,
    loadGalleryMaps,
    getMapURLByGalleryNumber,
  };
}
