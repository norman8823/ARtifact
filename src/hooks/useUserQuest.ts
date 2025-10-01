import { type GetUserQuestQuery } from "@/src/API";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { getUserQuest } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  isCompleted: boolean;
  progress: {
    visitedArtworks: string[];
    totalArtworks: number;
  };
  startedAt: string;
  completedAt?: string;
}

export function useUserQuest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthContext();

  const getUserQuestStatus = useCallback(
    async (questId: string) => {
      if (!user) {
        console.warn("No authenticated user");
        return null;
      }

      setIsLoading(true);
      setError(null);
      try {
        const userId = user.userId;
        // Create the composite key
        const id = `${userId}#${questId}`;

        const result = await getClient().graphql<GetUserQuestQuery>({
          query: getUserQuest,
          variables: {
            id,
          },
          authMode: "userPool" as any,
        });

        // Type guard for GraphQL errors
        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        // If no UserQuest document exists, return null
        if (!result.data?.getUserQuest) {
          return null;
        }

        const userQuest = result.data.getUserQuest;
        return {
          id: userQuest.id,
          userId: userQuest.userId,
          questId: userQuest.questId,
          isCompleted: userQuest.isCompleted,
          progress: {
            visitedArtworks: userQuest.visitedArtworks || [],
            totalArtworks: userQuest.totalArtworks,
          },
          startedAt: userQuest.startedAt,
          completedAt: userQuest.completedAt,
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
    [user]
  );

  return {
    getUserQuestStatus,
    isLoading,
    error,
  };
}
