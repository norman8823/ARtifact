import { listUsers } from "@/src/graphql/queries";
import * as Sentry from "@sentry/react-native";
import { generateClient } from "aws-amplify/api";
import { updatePassword } from "aws-amplify/auth";
import { useCallback, useState } from "react";

const getClient = () => generateClient();

interface UpdateProfileParams {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export function useProfileUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if a username is already taken by another user
   */
  const checkUsernameAvailability = useCallback(
    async (username: string, currentUserId: string): Promise<boolean> => {
      try {
        const result = await getClient().graphql({
          query: listUsers,
          variables: {
            filter: {
              username: { eq: username },
            },
            limit: 10,
          },
        });

        const users = result.data.listUsers.items;

        // If no users found, username is available
        if (!users || users.length === 0) {
          return true;
        }

        // If the only user with this username is the current user, it's available
        // (user is not changing their username)
        if (users.length === 1 && users[0].id === currentUserId) {
          return true;
        }

        // If any other user has this username, it's taken
        const isUsernameAvailable = !users.some(
          (user) => user.id !== currentUserId
        );

        return isUsernameAvailable;
      } catch (error) {
        console.error("Error checking username availability:", error);
        Sentry.captureException(error, {
          tags: {
            component: "useProfileUpdate",
            action: "checkUsernameAvailability",
          },
        });
        throw error;
      }
    },
    []
  );

  /**
   * Validate username format
   */
  const validateUsername = (username: string): ValidationError | null => {
    if (!username || username.trim().length === 0) {
      return { field: "username", message: "Username is required" };
    }

    if (username.length < 3) {
      return {
        field: "username",
        message: "Username must be at least 3 characters",
      };
    }

    if (username.length > 20) {
      return {
        field: "username",
        message: "Username must be 20 characters or less",
      };
    }

    // Alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return {
        field: "username",
        message: "Username can only contain letters, numbers, and underscores",
      };
    }

    return null;
  };

  /**
   * Validate password format
   */
  const validatePassword = (password: string): ValidationError | null => {
    if (!password || password.trim().length === 0) {
      return { field: "password", message: "Password is required" };
    }

    if (password.length < 8) {
      return {
        field: "password",
        message: "Password must be at least 8 characters",
      };
    }

    return null;
  };

  /**
   * Validate all update parameters
   */
  const validateUpdateParams = useCallback(
    async (
      params: UpdateProfileParams,
      currentUserId: string,
      currentUsername: string
    ): Promise<ValidationError | null> => {
      // Validate username if it's being updated
      if (params.username && params.username !== currentUsername) {
        const usernameError = validateUsername(params.username);
        if (usernameError) {
          return usernameError;
        }

        // Check availability
        const isAvailable = await checkUsernameAvailability(
          params.username,
          currentUserId
        );
        if (!isAvailable) {
          return {
            field: "username",
            message: "This username is already taken",
          };
        }
      }

      // Validate password if it's being updated
      if (params.newPassword) {
        const passwordError = validatePassword(params.newPassword);
        if (passwordError) {
          return passwordError;
        }

        if (!params.currentPassword) {
          return {
            field: "currentPassword",
            message: "Current password is required to set a new password",
          };
        }
      }

      return null;
    },
    [checkUsernameAvailability]
  );

  /**
   * Update user password in Cognito
   */
  const updateUserPassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<void> => {
      try {
        await updatePassword({
          oldPassword,
          newPassword,
        });
        console.log("✅ Password updated successfully");
      } catch (error: any) {
        console.error("Error updating password:", error);

        // Handle specific Cognito errors
        let errorMessage = "Failed to update password";

        if (error.name === "NotAuthorizedException") {
          errorMessage = "Current password is incorrect";
        } else if (error.name === "InvalidPasswordException") {
          errorMessage = "New password does not meet requirements";
        } else if (error.name === "LimitExceededException") {
          errorMessage = "Too many attempts. Please try again later";
        }

        Sentry.captureException(error, {
          tags: {
            component: "useProfileUpdate",
            action: "updateUserPassword",
          },
          extra: {
            errorName: error.name,
            errorCode: error.code,
          },
        });

        throw new Error(errorMessage);
      }
    },
    []
  );

  /**
   * Main update function
   */
  const updateProfile = useCallback(
    async (
      params: UpdateProfileParams,
      currentUserId: string,
      currentUsername: string,
      updateUserInDB: (
        userId: string,
        updates: { username?: string }
      ) => Promise<any>
    ): Promise<{ success: boolean; updatedFields: string[] }> => {
      setIsUpdating(true);
      setError(null);

      const updatedFields: string[] = [];

      try {
        // Validate all parameters
        const validationError = await validateUpdateParams(
          params,
          currentUserId,
          currentUsername
        );

        if (validationError) {
          throw new Error(validationError.message);
        }

        // Update username in DynamoDB if changed
        if (params.username && params.username !== currentUsername) {
          await updateUserInDB(currentUserId, { username: params.username });
          updatedFields.push("username");
          console.log("✅ Username updated successfully");
        }

        // Update password in Cognito if provided
        if (params.newPassword && params.currentPassword) {
          await updateUserPassword(params.currentPassword, params.newPassword);
          updatedFields.push("password");
        }

        return { success: true, updatedFields };
      } catch (error: any) {
        const errorMessage = error.message || "Failed to update profile";
        setError(errorMessage);

        Sentry.captureException(error, {
          tags: {
            component: "useProfileUpdate",
            action: "updateProfile",
          },
          extra: {
            updatedFields,
            errorMessage,
          },
        });

        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [validateUpdateParams, updateUserPassword]
  );

  return {
    updateProfile,
    isUpdating,
    error,
    checkUsernameAvailability,
    validateUsername,
    validatePassword,
  };
}
