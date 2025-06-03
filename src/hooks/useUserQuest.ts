import { type GetUserQuestQuery } from "@/src/API";
import { getUserQuest } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

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

  const checkAuthState = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      if (!session.tokens?.accessToken || !session.tokens?.idToken) {
        throw new Error("No valid auth tokens found");
      }

      return user.userId;
    } catch (authError) {
      console.error("Error checking auth state:", authError);
      throw new Error("Authentication required");
    }
  }, []);

  const getUserQuestStatus = useCallback(
    async (questId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const userId = await checkAuthState();

        // Create the composite key
        const id = `${userId}#${questId}`;

        const result = await client.graphql<GetUserQuestQuery>({
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
    [checkAuthState]
  );

  return {
    getUserQuestStatus,
    isLoading,
    error,
  };
}
