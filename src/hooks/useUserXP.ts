import {
  type CreateUserXPInput,
  type ListUserXPSQuery,
  type UpdateUserXPInput,
} from "@/src/API";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { createUserXP, updateUserXP } from "@/src/graphql/mutations";
import { listUserXPS } from "@/src/graphql/queries";
import { asQueryResult } from "@/src/aws/graphqlResult";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";
import {
  awardXpWithRetry,
  pickLatestXpRecord,
  userXpRecordId,
  type XpSnapshot,
} from "../utils/xpAward";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface UserXP {
  id: string;
  userId: string;
  xpPoints: number;
  timestamp: string;
}

export function useUserXP() {
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const getUserXP = useCallback(async (): Promise<UserXP | null> => {
    if (!user) {
      console.warn("No authenticated user");
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = asQueryResult<ListUserXPSQuery>(
        await getClient().graphql<ListUserXPSQuery>({
          query: listUserXPS,
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
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      const items = result.data?.listUserXPS?.items || [];

      // Get the latest XP record for the user. The explicit type argument this
      // used to carry is gone: asQueryResult now narrows the GraphQL result, so
      // `items` is properly typed and inference handles it.
      const userXP = pickLatestXpRecord(items);

      if (!userXP) {
        // Return default values if no XP record exists
        return {
          id: "default",
          userId: user.userId,
          xpPoints: 0,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: userXP.id,
        userId: userXP.userId,
        xpPoints: userXP.xpPoints,
        timestamp: userXP.timestamp || userXP.createdAt,
      };
    } catch (err) {
      console.error("Error fetching user XP:", err);
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Lean CAS read for awardXP: no loading-state churn, throws on failure
  // (unlike getUserXP, which swallows errors — a swallowed read must never
  // masquerade as "no record" or the create path would fork a duplicate).
  const fetchXpSnapshot = useCallback(async (): Promise<XpSnapshot> => {
    if (!user) {
      throw new Error("No authenticated user");
    }
    const result = asQueryResult<ListUserXPSQuery>(
      await getClient().graphql<ListUserXPSQuery>({
        query: listUserXPS,
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
      throw new Error(
        result.errors.map((e: { message: string }) => e.message).join(", ")
      );
    }

    const latest = pickLatestXpRecord(result.data?.listUserXPS?.items || []);
    return latest
      ? { id: latest.id, xpPoints: latest.xpPoints }
      : { id: null, xpPoints: 0 };
  }, [user]);

  const awardXP = useCallback(
    async (points: number) => {
      if (!user) {
        throw new Error("No authenticated user");
      }

      setError(null);
      try {
        // Compare-and-swap with retry: the update is conditioned on
        // xpPoints being unchanged since the read, and the first-ever
        // create uses a deterministic id so concurrent creates collide
        // instead of forking duplicate records.
        return await awardXpWithRetry(
          {
            read: fetchXpSnapshot,
            create: async (pts) => {
              const createInput: CreateUserXPInput = {
                id: userXpRecordId(user.userId),
                userId: user.userId,
                xpPoints: pts,
                timestamp: new Date().toISOString(),
              };
              const result = await getClient().graphql({
                query: createUserXP,
                variables: { input: createInput },
                authMode: "userPool",
              });
              if ("errors" in result && result.errors) {
                throw new Error(
                  result.errors
                    .map((e: { message: string }) => e.message)
                    .join(", ")
                );
              }
              console.log(`✅ Created XP record with ${pts} points`);
              return result.data?.createUserXP;
            },
            conditionalUpdate: async (id, expectedXp, pts) => {
              const newXPTotal = expectedXp + pts;
              const updateInput: UpdateUserXPInput = {
                id,
                xpPoints: newXPTotal,
                timestamp: new Date().toISOString(),
              };
              const result = await getClient().graphql({
                query: updateUserXP,
                variables: {
                  input: updateInput,
                  condition: { xpPoints: { eq: expectedXp } },
                },
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
                `✅ Updated XP: ${expectedXp} + ${pts} = ${newXPTotal}`
              );
              return result.data?.updateUserXP;
            },
          },
          points
        );
      } catch (err) {
        console.error("Error awarding XP:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        throw err;
      }
    },
    [user, fetchXpSnapshot]
  );

  return {
    getUserXP,
    awardXP,
    isLoading,
    error,
  };
}
