import { type ListGalleryMapsQuery } from "@/src/API";
import { listGalleryMaps } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

// Helper to determine auth mode based on user session
// Note: Guest access API key expires on Dec 6, 2026 at 04:00 GMT
const GUEST_API_KEY_EXPIRY = new Date("2026-12-06T04:00:00Z");

const getAuthMode = async (): Promise<"userPool" | "apiKey"> => {
  try {
    const session = await fetchAuthSession();
    if (session.tokens?.accessToken) {
      return "userPool";
    }
    // Check if guest API key has expired
    if (new Date() > GUEST_API_KEY_EXPIRY) {
      console.error("Guest access API key has expired (Dec 6, 2026 04:00 GMT). Please generate a new API key in AWS AppSync console.");
    }
    return "apiKey";
  } catch {
    return "apiKey";
  }
};

export interface GalleryMap {
  id: string;
  galleryNumber: string;
  mapURL: string;
}

export function useGalleryMaps() {
  const [galleryMaps, setGalleryMaps] = useState<GalleryMap[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadGalleryMaps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching gallery maps from database...");
      const authMode = await getAuthMode();
      const result = await getClient().graphql<ListGalleryMapsQuery>({
        query: listGalleryMaps,
        variables: {
          limit: 1000, // Set a high limit to get all gallery maps
        },
        authMode: authMode as any,
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
  }, []);

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
