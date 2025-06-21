import { type ListUserQuestsQuery, type UpdateUserQuestInput } from "@/src/API";
import { createUserQuest, updateUserQuest } from "@/src/graphql/mutations";
import { listUserQuests } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";
import { useVisited } from "./useVisited";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  title: string;
  description: string;
  icon: string | null;
  xpReward: number;
  requiredArtworks: string[];
  artworksVisited: string[];
  galleryMap: string | null;
  isCompleted: boolean;
  timestamp: string;
}

export function useUserQuests() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getVisitedArtworkIds } = useVisited();

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

  const getUserQuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await checkAuthState();

      console.log("Fetching user quests for user:", user.userId);
      const result = await client.graphql<ListUserQuestsQuery>({
        query: listUserQuests,
        variables: {
          filter: {
            userId: { eq: user.userId },
          },
          limit: 1000,
        },
        authMode: "userPool",
      });

      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      if (!("data" in result) || !result.data?.listUserQuests?.items) {
        console.log("No user quests found");
        return [];
      }

      const userQuests = result.data.listUserQuests.items
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<(typeof result.data.listUserQuests.items)[number]>
          ) => ({
            id: item.id,
            userId: item.userId,
            questId: item.questId,
            title: item.title,
            description: item.description,
            icon: item.icon,
            xpReward: item.xpReward,
            requiredArtworks: item.requiredArtworks,
            artworksVisited: item.artworksVisited,
            galleryMap: item.galleryMap,
            isCompleted: item.isCompleted,
            timestamp: item.timestamp,
          })
        );

      return userQuests;
    } catch (err) {
      console.error("Error fetching user quests:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthState]);

  const getUserQuestByQuestId = useCallback(
    async (questId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await checkAuthState();

        console.log(
          `Fetching user quest for user ${user.userId} and quest ${questId}`
        );
        const result = await client.graphql<ListUserQuestsQuery>({
          query: listUserQuests,
          variables: {
            filter: {
              and: [
                { userId: { eq: user.userId } },
                { questId: { eq: questId } },
              ],
            },
          },
          authMode: "userPool",
        });

        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        const items = result.data?.listUserQuests?.items;
        if (!items || items.length === 0) {
          return null;
        }

        const userQuest = items[0];
        return {
          id: userQuest.id,
          userId: userQuest.userId,
          questId: userQuest.questId,
          title: userQuest.title,
          description: userQuest.description,
          icon: userQuest.icon,
          xpReward: userQuest.xpReward,
          requiredArtworks: userQuest.requiredArtworks,
          artworksVisited: userQuest.artworksVisited,
          galleryMap: userQuest.galleryMap,
          isCompleted: userQuest.isCompleted,
          timestamp: userQuest.timestamp,
        };
      } catch (err) {
        console.error("Error fetching user quest:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuthState]
  );

  const startQuest = useCallback(
    async (quest: {
      id: string;
      title: string;
      description: string;
      icon: string | null;
      xpReward: number;
      requiredArtworks: string[];
      galleryMap: string | null;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const user = await checkAuthState();

        // Get all visited artwork IDs for the user
        const visitedArtworkIds = await getVisitedArtworkIds();

        // Filter visited artworks that are required for this quest
        const visitedQuestArtworks = quest.requiredArtworks.filter(
          (artworkId) => visitedArtworkIds.includes(artworkId)
        );

        // Check if all required artworks have been visited
        const isCompleted =
          visitedQuestArtworks.length === quest.requiredArtworks.length;

        const userQuest = {
          userId: user.userId,
          questId: quest.id,
          title: quest.title,
          description: quest.description,
          icon: quest.icon,
          xpReward: quest.xpReward,
          requiredArtworks: quest.requiredArtworks,
          artworksVisited: visitedQuestArtworks,
          galleryMap: quest.galleryMap,
          isCompleted,
          timestamp: new Date().toISOString(),
        };

        const result = await client.graphql({
          query: createUserQuest,
          variables: {
            input: userQuest,
          },
          authMode: "userPool",
        });

        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        return result.data.createUserQuest;
      } catch (err) {
        console.error("Error starting quest:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuthState, getVisitedArtworkIds]
  );

  const updateQuestProgress = useCallback(
    async (artworkId: string) => {
      setError(null);
      try {
        const user = await checkAuthState();

        // Get all user quests
        const userQuests = await getUserQuests();

        // Find quests that require this artwork
        const questsToUpdate = userQuests.filter(
          (quest) =>
            quest.requiredArtworks.includes(artworkId) && !quest.isCompleted
        );

        const updatedQuests = [];

        for (const quest of questsToUpdate) {
          // Check if artwork is already in artworksVisited
          if (!quest.artworksVisited.includes(artworkId)) {
            // Add artwork to visited list
            const newArtworksVisited = [...quest.artworksVisited, artworkId];

            // Check if quest is now completed
            const isCompleted =
              newArtworksVisited.length === quest.requiredArtworks.length;

            const updateInput: UpdateUserQuestInput = {
              id: quest.id,
              artworksVisited: newArtworksVisited,
              isCompleted: isCompleted,
            };

            const result = await client.graphql({
              query: updateUserQuest,
              variables: { input: updateInput },
              authMode: "userPool",
            });

            if ("errors" in result && result.errors) {
              throw new Error(
                result.errors
                  .map((e: { message: string }) => e.message)
                  .join(", ")
              );
            }

            console.log(
              `✅ Updated quest progress: ${quest.title} - ${newArtworksVisited.length}/${quest.requiredArtworks.length}`
            );
            if (isCompleted) {
              console.log(`🎉 Quest completed: ${quest.title}`);
            }

            updatedQuests.push({
              ...quest,
              artworksVisited: newArtworksVisited,
              isCompleted: isCompleted,
            });
          }
        }

        return updatedQuests;
      } catch (err) {
        console.error("Error updating quest progress:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        throw err;
      }
    },
    [checkAuthState, getUserQuests]
  );

  return {
    getUserQuests,
    getUserQuestByQuestId,
    startQuest,
    updateQuestProgress,
    isLoading,
    error,
  };
}
