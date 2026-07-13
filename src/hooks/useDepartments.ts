import { type ListDepartmentsQuery } from "@/src/API";
import { listDepartments } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { getAuthMode } from "@/src/aws/authMode";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface Department {
  id: string;
  displayName: string;
  description: string | null;
  coverImage: string | null;
}

export function useDepartments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAllDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching all departments as authenticated user...");
      const authMode = getAuthMode();
      const result = await getClient().graphql<ListDepartmentsQuery>({
        query: listDepartments,
        variables: {
          limit: 1000, // Set a high limit to get all departments
        },
        authMode: authMode as any,
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
  }, []);

  return {
    getAllDepartments,
    isLoading,
    error,
  };
}
