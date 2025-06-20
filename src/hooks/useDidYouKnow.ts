import { type ListDidYouKnowsQuery } from "@/src/API";
import { listDidYouKnows } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface DidYouKnowFact {
  id: string;
  fact: string;
}

export function useDidYouKnow() {
  const [facts, setFacts] = useState<DidYouKnowFact[]>([]);
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

  const loadFacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkAuthState();

      console.log("Fetching did you know facts from database...");
      const result = await client.graphql<ListDidYouKnowsQuery>({
        query: listDidYouKnows,
        variables: {
          limit: 1000, // Set a high limit to get all facts
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
      if (!("data" in result) || !result.data?.listDidYouKnows?.items) {
        console.log("No data in response");
        setFacts([]);
        return;
      }

      // Map the DynamoDB items to our simplified DidYouKnowFact interface
      const didYouKnowFacts = result.data.listDidYouKnows.items
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<
              (typeof result.data.listDidYouKnows.items)[number]
            >
          ) => ({
            id: item.id,
            fact: item.fact,
          })
        );

      // console.log("Fetched did you know facts:", didYouKnowFacts.length);
      setFacts(didYouKnowFacts);
    } catch (err) {
      console.error("Error loading did you know facts:", err);
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

  const getRandomFact = useCallback(() => {
    if (facts.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * facts.length);
    return facts[randomIndex];
  }, [facts]);

  return {
    facts,
    isLoading,
    error,
    loadFacts,
    getRandomFact,
  };
}
