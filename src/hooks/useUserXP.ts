import {
  type CreateUserXPInput,
  type ListUserXPSQuery,
  type UpdateUserXPInput,
} from "@/src/API";
import { useAuthContext } from "@/src/contexts/AuthContext";
import { createUserXP, updateUserXP } from "@/src/graphql/mutations";
import { listUserXPS } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { useCallback, useState } from "react";

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
      const result = await getClient().graphql<ListUserXPSQuery>({
        query: listUserXPS,
        variables: {
          filter: {
            userId: { eq: user.userId },
          },
          limit: 1000,
        },
        authMode: "userPool",
      });

      if ("errors" in result && result.errors) {
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      const items = result.data?.listUserXPS?.items || [];

      // Get the latest XP record for the user
      const userXP = items
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt);
          const dateB = new Date(b.timestamp || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })[0];

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
        xpPoints: userXP.xpPoints || 0,
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

  const awardXP = useCallback(
    async (points: number) => {
      if (!user) {
        throw new Error("No authenticated user");
      }

      setError(null);
      try {
        const currentXP = await getUserXP();

        if (!currentXP || currentXP.id === "default") {
          // Create new XP record
          const createInput: CreateUserXPInput = {
            userId: user.userId,
            xpPoints: points,
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

          console.log(`✅ Created XP record with ${points} points`);
          return result.data?.createUserXP;
        } else {
          // Update existing XP record
          const newXPTotal = currentXP.xpPoints + points;
          const updateInput: UpdateUserXPInput = {
            id: currentXP.id,
            xpPoints: newXPTotal,
            timestamp: new Date().toISOString(),
          };

          const result = await getClient().graphql({
            query: updateUserXP,
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
            `✅ Updated XP: ${currentXP.xpPoints} + ${points} = ${newXPTotal}`
          );
          return result.data?.updateUserXP;
        }
      } catch (err) {
        console.error("Error awarding XP:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
        throw err;
      }
    },
    [getUserXP]
  );

  return {
    getUserXP,
    awardXP,
    isLoading,
    error,
  };
}
