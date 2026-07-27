import { asQueryResult } from "@/src/aws/graphqlResult";
import { type ListArtworksQuery } from "../API";
import { listArtworks } from "../graphql/queries";
import { generateClient } from "aws-amplify/api";
import { getAuthMode } from "@/src/aws/authMode";
import { useCallback, useState, useMemo } from "react";

// Create the API client outside the hook to avoid recreating it on each render
const getClient = () => generateClient();

export interface Artwork {
  id: string;
  title: string;
  artistDisplayName: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  additionalImages: (string | null)[] | null;
  medium: string | null;
  dimensions: string | null;
  culture: string | null;
  classification: string | null;
  objectType: string | null;
  objectDate: string | null;
  department: string | null;
  tags: (string | null)[] | null;
  galleryNumber: string | null;
  objectURL: string | null;
  description: string | null;
  isCurated: boolean | null;
  isFeatured: boolean | null;
  isScannable: boolean | null;
  hasAudio: boolean | null;
  hasAR: boolean | null;
  arImage: string | null;
}

interface PaginationState {
  nextToken: string | null;
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingMore: boolean;
  error: Error | null;
}

interface UseInfiniteArtworksConfig {
  limit?: number;
  prefetchThreshold?: number;
  searchQuery?: string;
  showIsScannableOnly?: boolean;
  showAROnly?: boolean;
}

export function useInfiniteArtworks(config: UseInfiniteArtworksConfig = {}) {
  const {
    limit = 20,
    prefetchThreshold = 3,
    searchQuery = "",
    showIsScannableOnly = false,
    showAROnly = false,
  } = config;

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    nextToken: null,
    hasNextPage: true,
    isLoading: false,
    isFetchingMore: false,
    error: null,
  });
  const fetchArtworks = useCallback(
    async (nextToken: string | null = null, reset: boolean = false) => {
      if (pagination.isFetchingMore || (!reset && !pagination.hasNextPage)) {
        return;
      }

      const isFirstLoad = nextToken === null && reset;

      setPagination(prev => ({
        ...prev,
        isLoading: isFirstLoad,
        isFetchingMore: !isFirstLoad,
        error: null,
      }));

      try {
        console.log(`Fetching artworks with nextToken: ${nextToken}, limit: ${limit}`);

        const authMode = getAuthMode();
        const result = asQueryResult<ListArtworksQuery>(
          await getClient().graphql<ListArtworksQuery>({
            query: listArtworks,
            variables: {
              limit,
              nextToken,
            },
            authMode,
          })
        );

        if ("errors" in result && result.errors) {
          throw new Error(
            result.errors.map((e: { message: string }) => e.message).join(", ")
          );
        }

        if (!("data" in result) || !result.data?.listArtworks?.items) {
          console.log("No data in response");
          setPagination(prev => ({
            ...prev,
            isLoading: false,
            isFetchingMore: false,
            hasNextPage: false,
          }));
          return;
        }

        const newArtworks = result.data.listArtworks.items
          // Previously annotated `(item: NonNullable<typeof item>)`, which
          // referenced the parameter inside its own type (TS2502). The filter
          // already narrows out null, so let inference do the work.
          .filter((item) => item !== null)
          .map((item): Artwork => ({
            id: item.id,
            title: item.title,
            artistDisplayName: item.artistDisplayName ?? null,
            primaryImage: item.primaryImage ?? null,
            primaryImageSmall: item.primaryImageSmall ?? null,
            additionalImages: item.additionalImages ?? null,
            medium: item.medium ?? null,
            dimensions: item.dimensions ?? null,
            culture: item.culture ?? null,
            classification: item.classification ?? null,
            objectType: item.objectType ?? null,
            objectDate: item.objectDate ?? null,
            department: item.department ?? null,
            tags: item.tags ?? null,
            galleryNumber: item.galleryNumber ?? null,
            objectURL: item.objectURL ?? null,
            description: item.description ?? null,
            isCurated: item.isCurated ?? null,
            isFeatured: item.isFeatured ?? null,
            isScannable: item.isScannable ?? null,
            hasAudio: item.hasAudio ?? null,
            hasAR: item.hasAR ?? null,
            arImage: item.arImage ?? null,
          }));

        // Generated as `nextToken?: string | null`; normalise to null so it
        // matches PaginationState.
        const newNextToken = result.data.listArtworks.nextToken ?? null;

        console.log(`Fetched ${newArtworks.length} artworks, nextToken: ${newNextToken}`);

        setArtworks(prev => {
          if (reset) {
            return newArtworks;
          }

          // Merge with deduplication based on artwork ID
          const existingIds = new Set(prev.map(artwork => artwork.id));
          const uniqueNewArtworks = newArtworks.filter(artwork => !existingIds.has(artwork.id));

          const duplicateCount = newArtworks.length - uniqueNewArtworks.length;
          if (duplicateCount > 0) {
            console.log(`🔍 Filtered out ${duplicateCount} duplicate artworks`);
          }

          console.log(`📊 Total artworks before: ${prev.length}, adding: ${uniqueNewArtworks.length}, total after: ${prev.length + uniqueNewArtworks.length}`);

          return [...prev, ...uniqueNewArtworks];
        });
        setPagination(prev => ({
          ...prev,
          nextToken: newNextToken,
          hasNextPage: !!newNextToken,
          isLoading: false,
          isFetchingMore: false,
        }));

      } catch (err) {
        console.error("Error fetching artworks:", err);
        setPagination(prev => ({
          ...prev,
          error: err instanceof Error ? err : new Error("Unknown error occurred"),
          isLoading: false,
          isFetchingMore: false,
        }));
      }
    },
    [ limit, pagination.isFetchingMore, pagination.hasNextPage]
  );

  const fetchNextPage = useCallback(() => {
    if (pagination.hasNextPage && !pagination.isFetchingMore) {
      fetchArtworks(pagination.nextToken, false);
    }
  }, [fetchArtworks, pagination.nextToken, pagination.hasNextPage, pagination.isFetchingMore]);

  const refresh = useCallback(() => {
    fetchArtworks(null, true);
  }, [fetchArtworks]);

  const shouldPrefetch = useCallback((index: number, total: number) => {
    return index >= total - prefetchThreshold;
  }, [prefetchThreshold]);

  // Filter artworks based on search and filters
  const filteredArtworks = useMemo(() => {
    let filtered = artworks;

    // Apply isScannable filter
    if (showIsScannableOnly) {
      filtered = filtered.filter((artwork) => artwork.isScannable === true);
    }

    // Apply AR filter
    if (showAROnly) {
      filtered = filtered.filter((artwork) => artwork.hasAR === true);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((artwork) => {
        const contains = (value: string | null | undefined) =>
          value?.toLowerCase().includes(query) || false;

        return (
          contains(artwork.title) ||
          contains(artwork.artistDisplayName) ||
          contains(artwork.culture) ||
          contains(artwork.medium) ||
          contains(artwork.classification) ||
          contains(artwork.objectType) ||
          contains(artwork.description) ||
          contains(artwork.id) ||
          artwork.tags?.some((tag) => tag?.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  }, [artworks, searchQuery, showIsScannableOnly, showAROnly]);

  return {
    artworks: filteredArtworks,
    allArtworks: artworks, // Unfiltered for pagination logic
    pagination,
    fetchNextPage,
    refresh,
    shouldPrefetch,
  };
}