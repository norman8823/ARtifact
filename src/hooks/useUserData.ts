import { createUser } from "@/src/graphql/mutations";
import { listUsers } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client
const client = generateClient();

export interface UserData {
  id: string;
  username: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  isPremium?: boolean | null;
  remainingFreeScans?: number | null;
  xpPoints?: number | null;
  owner?: string | null;
}

export function useUserData() {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  const createUserInDB = useCallback(
    async (userData: Omit<UserData, "id" | "owner">) => {
      try {
        const result = await client.graphql({
          query: createUser,
          variables: {
            input: {
              ...userData,
              remainingFreeScans: 3, // Default value for new users
              xpPoints: 0, // Default value for new users
              isPremium: false, // Default value for new users
            },
          },
        });
        const newUser = result.data.createUser;
        setCurrentUser(newUser);
        return newUser;
      } catch (error) {
        console.error("Error creating user in DB:", error);
        throw error;
      }
    },
    []
  );

  const getUserByOwnerFromDB = useCallback(async (ownerId: string) => {
    try {
      console.log("Searching for user with owner ID:", ownerId);
      const result = await client.graphql({
        query: listUsers,
        variables: {
          filter: {
            owner: {
              contains: ownerId,
            },
          },
          limit: 1,
        },
      });

      const users = result.data.listUsers.items;
      if (users && users.length > 0) {
        console.log("Found existing user:", users[0]);
        return users[0];
      }
      console.log("No user found with owner ID:", ownerId);
      return null;
    } catch (error) {
      console.error("Error fetching user from DB:", error);
      throw error;
    }
  }, []);

  const ensureUserInDB = useCallback(
    async (preferredUsername?: string, userEmail?: string) => {
      try {
        // Get the current authenticated user
        const { userId } = await getCurrentUser();
        console.log("Current authenticated user ID:", userId);

        // Try to fetch existing user by owner ID
        const existingUser = await getUserByOwnerFromDB(userId);

        if (existingUser) {
          console.log("Using existing user:", existingUser);
          setCurrentUser(existingUser);
          return existingUser;
        }

        // No existing user found, create new user
        console.log(
          "No existing user found, creating new user for:",
          userEmail || userId
        );
        const newUser = await createUserInDB({
          username: preferredUsername || userEmail || userId,
          email: userEmail || userId,
        });

        console.log("Created new user in DB:", newUser);
        return newUser;
      } catch (error) {
        console.error("Error ensuring user in DB:", error);
        throw error;
      }
    },
    [createUserInDB, getUserByOwnerFromDB]
  );

  return {
    currentUser,
    createUserInDB,
    getUserByOwnerFromDB,
    ensureUserInDB,
  };
}
