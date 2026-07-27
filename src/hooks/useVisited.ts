import { asQueryResult } from "@/src/aws/graphqlResult";
import { type CreateVisitedInput, type ListVisitedsQuery } from "@/src/API";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { createVisited } from "@/src/graphql/mutations";
import { listVisiteds } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";
import { isConditionalCheckFailed, visitedRecordId } from "../utils/xpAward";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface Visited {
  id: string;
  userId: string;
  artworkId: string;
  timestamp: string;
}

export function useVisited() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuthContext();

  const getVisitedArtworks = useCallback(async () => {
    if (!user) {
      console.warn("No authenticated user");
      return [];
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching visited artworks for user:", user.userId);
      const result = asQueryResult<ListVisitedsQuery>(
        await getClient().graphql<ListVisitedsQuery>({
          query: listVisiteds,
          variables: {
            filter: {
              userId: { eq: user.userId },
            },
            limit: 1000,
          },
          authMode: "userPool",
        })
      );

      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      if (!("data" in result) || !result.data?.listVisiteds?.items) {
        console.log("No visited artworks found");
        return [];
      }

      const visitedArtworks = result.data.listVisiteds.items
        .filter((item) => item !== null)
        .map(
          (item): Visited => ({
            id: item.id,
            userId: item.userId,
            artworkId: item.artworkId,
            // Generated as `timestamp?: AWSDateTime | null`; normalise here so
            // the Visited interface can keep it required.
            timestamp: item.timestamp ?? "",
          })
        );

      return visitedArtworks;
    } catch (err) {
      console.error("Error fetching visited artworks:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const getVisitedArtworkIds = useCallback(async () => {
    const visited = await getVisitedArtworks();
    return visited.map((v) => v.artworkId);
  }, [getVisitedArtworks]);

  const checkIfArtworkVisited = useCallback(
    async (artworkId: string) => {
      if (!user) {
        console.warn("No authenticated user");
        return null;
      }

      setError(null);
      try {
        const result = asQueryResult<ListVisitedsQuery>(
          await getClient().graphql<ListVisitedsQuery>({
            query: listVisiteds,
            variables: {
              filter: {
                and: [
                  { userId: { eq: user.userId } },
                  { artworkId: { eq: artworkId } },
                ],
              },
            },
            authMode: "userPool",
          })
        );

        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        const visits = result.data?.listVisiteds?.items || [];
        return visits.length > 0 ? visits[0] : null;
      } catch (err) {
        console.error("Error checking if artwork is visited:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        return null;
      }
    },
    [user]
  );

  const createVisitRecord = useCallback(
    async (artworkId: string) => {
      if (!user) {
        throw new Error("No authenticated user");
      }

      setError(null);
      try {
        const createInput: CreateVisitedInput = {
          // Deterministic id: a concurrent duplicate create fails the
          // resolver's id-uniqueness condition instead of double-writing,
          // which is what gates duplicate XP awards in useScanSuccess.
          id: visitedRecordId(user.userId, artworkId),
          userId: user.userId,
          artworkId: artworkId,
          timestamp: new Date().toISOString(),
        };

        const result = await getClient().graphql({
          query: createVisited,
          variables: { input: createInput },
          authMode: "userPool",
        });

        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        console.log("✅ Created visit record for artwork:", artworkId);
        return result.data?.createVisited;
      } catch (err) {
        if (isConditionalCheckFailed(err)) {
          // Visit already recorded (lost a race or stale pre-check) —
          // not an error, but signal the caller that nothing new happened.
          console.log("🔄 Visit record already exists for artwork:", artworkId);
          return null;
        }
        console.error("Error creating visit record:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        throw err;
      }
    },
    [user]
  );

  return {
    getVisitedArtworks,
    getVisitedArtworkIds,
    checkIfArtworkVisited,
    createVisitRecord,
    isLoading,
    error,
  };
}
