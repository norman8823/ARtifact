import { type GetDepartmentQuery, type ListArtworksQuery } from "@/src/API";
import { getDepartment, listArtworks } from "@/src/graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { useCallback, useState } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

// Helper to determine auth mode based on user session
// Note: Guest access API key expires on Dec 6, 2026 at 04:00 GMT
const GUEST_API_KEY_EXPIRY = new Date("2026-12-06T04:00:00Z");

const getAuthMode = async (): Promise<"userPool" | "apiKey"> => {
  try {
    const session = await fetchAuthSession();
    if (session.tokens?.accessToken) {
      return "userPool";
    }
    // Check if guest API key has expired
    if (new Date() > GUEST_API_KEY_EXPIRY) {
      console.error("Guest access API key has expired (Dec 6, 2026 04:00 GMT). Please generate a new API key in AWS AppSync console.");
    }
    return "apiKey";
  } catch {
    return "apiKey";
  }
};

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

  const getDepartmentById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Fetching department details as authenticated user...");
      const authMode = await getAuthMode();
      const result = await getClient().graphql<GetDepartmentQuery>({
        query: getDepartment,
        variables: {
          id,
        },
        authMode: authMode as any,
      });

      // console.log(
      //   "Raw Department API Response:",
      //   JSON.stringify(result, null, 2)
      // );

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
      // console.log(
      //   "Fetching artworks for department with ID:",
      //   departmentData.id
      // );
      const artworksAuthMode = await getAuthMode();
      const artworksResult = await getClient().graphql<ListArtworksQuery>({
        query: listArtworks,
        variables: {
          filter: {
            departmentId: { eq: departmentData.id },
          },
          limit: 1000,
        },
        authMode: artworksAuthMode as any,
      });

      // console.log(
      //   "Raw Artworks API Response:",
      //   JSON.stringify(artworksResult, null, 2)
      // );

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
        .filter((item: any): item is NonNullable<typeof item> => item !== null)
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
  }, []);

  return {
    getDepartmentById,
    department,
    departmentArtworks,
    isLoading,
    error,
  };
}
