import { type ListQuestsQuery } from "@/src/API";
import { listQuests } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string | null;
  requiredArtworks: string[] | null;
  isPremium: boolean | null;
  galleryMap: string | null;
}

export function useQuests() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkAuthState = useCallback(async () => {
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
  }, []);

  const getAllQuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkAuthState();

      console.log("Fetching all quests as authenticated user...");
      const result = await client.graphql<ListQuestsQuery>({
        query: listQuests,
        variables: {
          limit: 1000, // Set a high limit to get all quests
        },
        authMode: "userPool" as any,
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
      if (!("data" in result) || !result.data?.listQuests?.items) {
        console.log("No data in response");
        return [];
      }

      // Map the DynamoDB items to our simplified Quest interface
      const quests = result.data.listQuests.items
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

      console.log("Fetched quests:", quests.length);
      return quests;
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
  }, [checkAuthState]);

  return {
    getAllQuests,
    isLoading,
    error,
  };
}
