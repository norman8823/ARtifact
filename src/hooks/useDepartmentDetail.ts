import { type GetDepartmentQuery, type ListArtworksQuery } from "@/src/API";
import { getDepartment, listArtworks } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const client = generateClient();

export interface DepartmentDetail {
  id: string;
  displayName: string;
  description: string | null;
  coverImage: string | null;
}

export interface DepartmentArtwork {
  id: string;
  title: string;
  artistDisplayName: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  period: string | null;
}

export function useDepartmentDetail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [departmentArtworks, setDepartmentArtworks] = useState<
    DepartmentArtwork[]
  >([]);

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

  const getDepartmentById = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await checkAuthState();

        console.log("Fetching department details as authenticated user...");
        const result = await client.graphql<GetDepartmentQuery>({
          query: getDepartment,
          variables: {
            id,
          },
          authMode: "userPool" as any,
        });

        console.log(
          "Raw Department API Response:",
          JSON.stringify(result, null, 2)
        );

        // Type guard for GraphQL errors
        if ("errors" in result && result.errors) {
          console.error("GraphQL Errors:", result.errors);
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        // Type guard for data
        if (!("data" in result) || !result.data?.getDepartment) {
          console.log("No department data found");
          setDepartment(null);
          return null;
        }

        const departmentData = result.data.getDepartment;
        const department: DepartmentDetail = {
          id: departmentData.id,
          displayName: departmentData.displayName,
          description: departmentData.description,
          coverImage: departmentData.coverImage,
        };

        setDepartment(department);

        // Now fetch artworks for this department
        console.log(
          "Fetching artworks for department with ID:",
          departmentData.id
        );
        const artworksResult = await client.graphql<ListArtworksQuery>({
          query: listArtworks,
          variables: {
            filter: {
              departmentId: { eq: departmentData.id },
            },
            limit: 1000,
          },
          authMode: "userPool" as any,
        });

        console.log(
          "Raw Artworks API Response:",
          JSON.stringify(artworksResult, null, 2)
        );

        // Type guard for GraphQL errors
        if ("errors" in artworksResult && artworksResult.errors) {
          console.error("GraphQL Errors:", artworksResult.errors);
          throw new Error(
            artworksResult.errors
              .map((e: { message: string }) => e.message)
              .join(", ")
          );
        }

        // Type guard for data
        if (
          !("data" in artworksResult) ||
          !artworksResult.data?.listArtworks?.items
        ) {
          console.log(
            "No artworks data found for department:",
            departmentData.id
          );
          setDepartmentArtworks([]);
          return department;
        }

        const artworks = artworksResult.data.listArtworks.items
          .filter(
            (item: any): item is NonNullable<typeof item> => item !== null
          )
          .map(
            (
              item: NonNullable<
                (typeof artworksResult.data.listArtworks.items)[number]
              >
            ) => ({
              id: item.id,
              title: item.title,
              artistDisplayName: item.artistDisplayName,
              primaryImage: item.primaryImage,
              primaryImageSmall: item.primaryImageSmall,
              period: item.objectDate,
            })
          );

        console.log(
          `Found ${artworks.length} artworks for department:`,
          departmentData.id
        );
        setDepartmentArtworks(artworks);
        return department;
      } catch (err) {
        console.error("Error fetching department details:", err);
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
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [checkAuthState]
  );

  return {
    getDepartmentById,
    department,
    departmentArtworks,
    isLoading,
    error,
  };
}
