import { type ListQuestsQuery, type GetArtworkQuery } from "@/src/API";
import { listQuests, getArtwork } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { getAuthMode } from "@/src/aws/authMode";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface QuestArtworkThumbnail {
  id: string;
  title: string;
  primaryImageSmall: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string | null;
  requiredArtworks: string[] | null;
  artworkThumbnails?: QuestArtworkThumbnail[];
  isPremium: boolean | null;
  galleryMap: string | null;
}

export function useQuests() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Removed cached quests to force fresh data fetches

  // Helper function to fetch artwork thumbnails for a quest
  const fetchArtworkThumbnails = useCallback(async (artworkIds: string[]): Promise<QuestArtworkThumbnail[]> => {
    if (!artworkIds || artworkIds.length === 0) return [];

    console.log(`🎨 Fetching artwork thumbnails for IDs:`, artworkIds);

    try {
      // Fetch all artworks in parallel
      const artworkPromises = artworkIds.map(async (id) => {
        try {
          const artworkAuthMode = getAuthMode();
          const result = await getClient().graphql<GetArtworkQuery>({
            query: getArtwork,
            variables: { id },
            authMode: artworkAuthMode as any,
          });

          if ("errors" in result && result.errors) {
            console.warn(`Error fetching artwork ${id}:`, result.errors);
            return null;
          }

          if (!("data" in result) || !result.data?.getArtwork) {
            console.warn(`No data for artwork ${id}`);
            return null;
          }

          const artwork = result.data.getArtwork;
          const thumbnailData = {
            id: artwork.id,
            title: artwork.title || "",
            primaryImageSmall: artwork.primaryImageSmall || null,
          };

          // Debug log for specific problematic quests - simplified
          if (["247117", "252958", "246701", "247000", "255973", "204758", "11952", "437372", "437261", "459016", "459062", "459072"].includes(artwork.id)) {
            console.log(`🖼️ Artwork ${artwork.id}: ${artwork.title} - ${artwork.primaryImageSmall ? 'Has image' : 'No image'}`);
          }

          return thumbnailData;
        } catch (err) {
          console.warn(`Failed to fetch artwork ${id}:`, err);
          return null;
        }
      });

      const artworks = await Promise.all(artworkPromises);
      const validArtworks = artworks.filter((artwork): artwork is QuestArtworkThumbnail => artwork !== null);
      console.log(`🖼️ Successfully fetched ${validArtworks.length}/${artworkIds.length} artwork thumbnails`);
      return validArtworks;
    } catch (error) {
      console.error("Error fetching artwork thumbnails:", error);
      return [];
    }
  }, []);
  const getAllQuests = useCallback(async () => {
    // Force fresh data with timestamp to prevent caching
    const timestamp = Date.now();
    console.log(`🔄 Force refreshing quest data from database... [${timestamp}]`);

    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching all quests as authenticated user...");

      // Use a completely fresh query to bypass AppSync caching
      const timestampedQuery = `
        query GetFreshQuests {
          listQuests(limit: 1000) {
            items {
              id
              title
              description
              icon
              xpReward
              requiredArtworks
              isPremium
              galleryMap
              createdAt
              updatedAt
              __typename
            }
            nextToken
            __typename
          }
        }
      `;

      console.log("🔄 Using custom query to bypass AppSync cache");

      // Create fresh client instance with custom query
      const freshClient = generateClient();
      const authMode = getAuthMode();
      const result = await freshClient.graphql({
        query: timestampedQuery,
        authMode: authMode as any,
      });

      // Debug: Simple API response summary
      console.log(`✅ Fetched ${result.data?.listQuests?.items?.length || 0} quests from GraphQL`);

      // Type guard for GraphQL errors
      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      // Type guard for data
      if (!("data" in result) || !result.data?.listQuests?.items) {
        console.log("No data in response");
        return [];
      }

      // Map the DynamoDB items to our simplified Quest interface
      const basicQuests = result.data.listQuests.items
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<(typeof result.data.listQuests.items)[number]>
          ) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            xpReward: item.xpReward,
            icon: item.icon,
            requiredArtworks: item.requiredArtworks,
            isPremium: item.isPremium,
            galleryMap: item.galleryMap,
          })
        );

      console.log("Fetched basic quests:", basicQuests.length);

      // Debug: Log the first quest's description to verify it's being fetched
      if (basicQuests.length > 0) {
        console.log("🔍 Debug - First quest description:", basicQuests[0].description);
      }

      // Fetch artwork thumbnails for each quest
      const questsWithThumbnails = await Promise.all(
        basicQuests.map(async (quest) => {
          if (quest.requiredArtworks && quest.requiredArtworks.length > 0) {
            const artworkThumbnails = await fetchArtworkThumbnails(quest.requiredArtworks);
            return {
              ...quest,
              artworkThumbnails,
            };
          }
          return quest;
        })
      );

      console.log("✅ Fetched quests with thumbnails:", questsWithThumbnails.length);

      // Debug thumbnail fetching
      questsWithThumbnails.forEach(quest => {
        console.log(`📋 Quest "${quest.title}": ${quest.artworkThumbnails?.length || 0} thumbnails`);
      });

      // Specific debug for missing quests
      const missingQuests = ["Bronze Legacy", "Marble Legends", "Renaissance Masterpieces"];
      missingQuests.forEach(questTitle => {
        const found = questsWithThumbnails.find(q => q.title === questTitle);
        if (found) {
          console.log(`✅ Found "${questTitle}":`, {
            id: found.id,
            thumbnails: found.artworkThumbnails?.length || 0,
            requiredArtworks: found.requiredArtworks?.length || 0
          });
        } else {
          console.log(`❌ Missing "${questTitle}"`);
        }
      });

      return questsWithThumbnails;
    } catch (err) {
      console.error("Error fetching quests:", err);
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
    getAllQuests,
    isLoading,
    error,
  };
}
