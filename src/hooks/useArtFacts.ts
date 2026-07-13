import { ArtFactsByArtworkIdAndTimestampQuery } from "@/src/API";
import { artFactsByArtworkIdAndTimestamp } from "@/src/graphql/queries";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { generateClient } from "aws-amplify/api";
import { getAuthMode } from "@/src/aws/authMode";
import { useCallback, useState } from "react";

const getClient = () => generateClient();

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
        const authMode = getAuthMode();
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
