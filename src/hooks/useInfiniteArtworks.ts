import { type ListArtworksQuery } from "../API";
import { listArtworks } from "../graphql/queries";
import { generateClient } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import { useCallback, useState, useMemo } from "react";

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
  period: string | null;
  dynasty: string | null;
  reign: string | null;
  portfolio: string | null;
  constituents: (string | null)[] | null;
  classification: string | null;
  objectType: string | null;
  objectDate: string | null;
  objectBeginDate: number | null;
  objectEndDate: number | null;
  accessionYear: string | null;
  isHighlight: boolean | null;
  accessionNumber: string | null;
  creditLine: string | null;
  department: string | null;
  tags: (string | null)[] | null;
  objectWikidata_URL: string | null;
  isTimelineWork: boolean | null;
  galleryNumber: string | null;
  objectURL: string | null;
  repository: string | null;
  rightsAndReproduction: string | null;
  linkResource: string | null;
  metadataDate: string | null;
  country: string | null;
  region: string | null;
  subregion: string | null;
  locale: string | null;
  locus: string | null;
  excavation: string | null;
  river: string | null;
  city: string | null;
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

        const authMode = await getAuthMode();
        const result = await getClient().graphql<ListArtworksQuery>({
          query: listArtworks,
          variables: {
            limit,
            nextToken,
          },
          authMode: authMode as any,
        });

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
          .filter((item: any): item is NonNullable<typeof item> => item !== null)
          .map((item: NonNullable<typeof item>) => ({
            id: item.id,
            title: item.title,
            artistDisplayName: item.artistDisplayName,
            primaryImage: item.primaryImage,
            primaryImageSmall: item.primaryImageSmall,
            additionalImages: item.additionalImages,
            medium: item.medium,
            dimensions: item.dimensions,
            culture: item.culture,
            period: item.period,
            dynasty: item.dynasty,
            reign: item.reign,
            portfolio: item.portfolio,
            constituents: item.constituents,
            classification: item.classification,
            objectType: item.objectType,
            objectDate: item.objectDate,
            objectBeginDate: item.objectBeginDate,
            objectEndDate: item.objectEndDate,
            accessionYear: item.accessionYear,
            isHighlight: item.isHighlight,
            accessionNumber: item.accessionNumber,
            creditLine: item.creditLine,
            department: item.department,
            tags: item.tags,
            objectWikidata_URL: item.objectWikidata_URL,
            isTimelineWork: item.isTimelineWork,
            galleryNumber: item.galleryNumber,
            objectURL: item.objectURL,
            repository: item.repository,
            rightsAndReproduction: item.rightsAndReproduction,
            linkResource: item.linkResource,
            metadataDate: item.metadataDate,
            country: item.country,
            region: item.region,
            subregion: item.subregion,
            locale: item.locale,
            locus: item.locus,
            excavation: item.excavation,
            river: item.river,
            city: item.city,
            description: item.description,
            isCurated: item.isCurated,
            isFeatured: item.isFeatured,
            isScannable: item.isScannable,
            hasAudio: item.hasAudio,
            hasAR: item.hasAR,
            arImage: item.arImage,
          }));

        const newNextToken = result.data.listArtworks.nextToken;

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