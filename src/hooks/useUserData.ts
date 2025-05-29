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

  const getUserByOwnerFromDB = useCallback(
    async (ownerId: string, email?: string) => {
      try {
        // First, let's see all users to understand what's in the database
        console.log("Fetching all users to debug...");
        const allUsersResult = await client.graphql({
          query: listUsers,
          variables: {
            limit: 100, // Adjust if needed
          },
        });
        console.log(
          "All users in DB:",
          JSON.stringify(allUsersResult.data.listUsers.items, null, 2)
        );

        // Create possible owner ID formats
        const ownerIdFormats = [
          ownerId, // Plain ID
          `${ownerId}::${ownerId}`, // ID::ID format
        ];

        console.log("Searching for user with formats:", ownerIdFormats);
        console.log("Or email:", email);

        const result = await client.graphql({
          query: listUsers,
          variables: {
            filter: {
              or: [
                ...ownerIdFormats.map((id) => ({ owner: { eq: id } })),
                ...(email ? [{ email: { eq: email } }] : []),
              ],
            },
          },
        });

        console.log(
          "Search query result:",
          JSON.stringify(result.data.listUsers.items, null, 2)
        );

        const users = result.data.listUsers.items;
        if (users && users.length > 0) {
          console.log("Found existing user:", users[0]);
          return users[0];
        }

        console.log("No matching user found");
        return null;
      } catch (error) {
        console.error("Error fetching user from DB:", error);
        throw error;
      }
    },
    []
  );

  const ensureUserInDB = useCallback(
    async (preferredUsername?: string, userEmail?: string) => {
      try {
        // Get the current authenticated user
        const { userId } = await getCurrentUser();
        console.log("Current authenticated user ID:", userId);

        // Try to fetch existing user by owner ID or email
        const existingUser = await getUserByOwnerFromDB(userId, userEmail);

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
