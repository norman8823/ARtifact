import { type ListDepartmentsQuery } from "@/src/API";
import { listDepartments } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface Department {
  id: string;
  displayName: string;
  description: string | null;
  coverImage: string | null;
}

export function useDepartments() {
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

  const getAllDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await checkAuthState();

      console.log("Fetching all departments as authenticated user...");
      const result = await client.graphql<ListDepartmentsQuery>({
        query: listDepartments,
        variables: {
          limit: 1000, // Set a high limit to get all departments
        },
        authMode: "userPool" as any,
      });

      // console.log("Raw API Response:", JSON.stringify(result, null, 2));

      // Type guard for GraphQL errors
      if ("errors" in result && result.errors) {
        console.error("GraphQL Errors:", result.errors);
        throw new Error(
          result.errors.map((e: { message: string }) => e.message).join(", ")
        );
      }

      // Type guard for data
      if (!("data" in result) || !result.data?.listDepartments?.items) {
        console.log("No data in response");
        return [];
      }

      // Map the DynamoDB items to our simplified Department interface
      const departments = result.data.listDepartments.items
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
        .map(
          (
            item: NonNullable<
              (typeof result.data.listDepartments.items)[number]
            >
          ) => ({
            id: item.id,
            displayName: item.displayName,
            description: item.description,
            coverImage: item.coverImage,
          })
        );

      console.log("Fetched departments:", departments.length);
      return departments;
    } catch (err) {
      console.error("Error fetching departments:", err);
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
    getAllDepartments,
    isLoading,
    error,
  };
}
