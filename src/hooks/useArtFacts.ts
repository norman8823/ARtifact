import { ArtFactsByArtworkIdAndTimestampQuery } from "@/src/API";
import { artFactsByArtworkIdAndTimestamp } from "@/src/graphql/queries";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { useCallback, useState } from "react";

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

export interface ArtFact {
  id: string;
  artworkId: string;
  content: string | null;
  isActive: boolean | null;
  timestamp: string | null;
}

export function useArtFacts() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const getArtFactsByArtworkId = useCallback(
    async (artworkId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const authMode = await getAuthMode();
        const result =
          (await getClient().graphql<ArtFactsByArtworkIdAndTimestampQuery>({
            query: artFactsByArtworkIdAndTimestamp,
            variables: {
              artworkId,
              filter: {
                isActive: { eq: true }, // Only get active facts
              },
              sortDirection: "DESC", // Get newest facts first
              limit: 10, // Limit to 10 facts
            },
            authMode: authMode,
          })) as GraphQLResult<ArtFactsByArtworkIdAndTimestampQuery>;

        if ("errors" in result && result.errors) {
          throw new Error(result.errors.map((e) => e.message).join(", "));
        }

        const facts = result.data?.artFactsByArtworkIdAndTimestamp?.items || [];

        // Map to our interface and filter out null values
        return facts
          .filter((fact): fact is NonNullable<typeof fact> => fact !== null)
          .map((fact) => ({
            id: fact.id,
            artworkId: fact.artworkId,
            content: fact.content,
            isActive: fact.isActive,
            timestamp: fact.timestamp,
          }));
      } catch (err) {
        console.error("Error fetching art facts:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    getArtFactsByArtworkId,
    isLoading,
    error,
  };
}
