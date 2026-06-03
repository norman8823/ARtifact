import { useQuery } from "@tanstack/react-query";

import { useAuthContext } from "@/src/contexts/AuthContext";
import { type Artwork, useArtworks } from "./useArtworks";
import { type Department, useDepartments } from "./useDepartments";
import { type DidYouKnowFact, useDidYouKnow } from "./useDidYouKnow";
import { type FavoriteArtwork, useFavoriteArtworks } from "./useFavoriteArtworks";
import { type Quest, useQuests } from "./useQuests";
import { type Rank, useRanks } from "./useRanks";
import { type UserQuest, useUserQuests } from "./useUserQuests";
import { type UserXP, useUserXP } from "./useUserXP";
import { type Visited, useVisited } from "./useVisited";

// react-query wrappers around the existing imperative data hooks.
//
// These REUSE each hook's existing getter as the queryFn — the underlying
// fetch/auth/mapping logic is unchanged, so behavior is identical on a cache
// miss. The win is stale-while-revalidate: a cold session paints the persisted
// cache instantly, then revalidates in the background, and the same data shared
// across screens is fetched once (dedup by queryKey) instead of per screen.
//
// Per-data-type staleness is configured HERE, at each call site (not in the
// global QueryClient defaults), per the cache design:
//   - Catalog (artworks/departments/facts/quest definitions): stale after 5min
//   - User state (quests/xp/favorites/visited/ranks): always stale -> show
//     cached instantly but ALWAYS revalidate, so e.g. XP is never shown 5min old
// Both keep data on disk for 24h (gcTime) so an idle gap still has something to
// paint.
const DAY_MS = 1000 * 60 * 60 * 24;
const CATALOG = { staleTime: 1000 * 60 * 5, gcTime: DAY_MS } as const;
const USER = { staleTime: 0, gcTime: DAY_MS } as const;

// ----- Catalog (public, guest-readable) -----

export function useFeaturedArtworksQuery() {
  const { getFeaturedArtworks } = useArtworks();
  const { isAuthReady } = useAuthContext();
  return useQuery<Artwork[]>({
    queryKey: ["artworks", "featured"],
    queryFn: getFeaturedArtworks,
    enabled: isAuthReady,
    ...CATALOG,
  });
}

export function useDepartmentsQuery() {
  const { getAllDepartments } = useDepartments();
  const { isAuthReady } = useAuthContext();
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: getAllDepartments,
    enabled: isAuthReady,
    ...CATALOG,
  });
}

export function useDidYouKnowQuery() {
  const { loadFacts } = useDidYouKnow();
  const { isAuthReady } = useAuthContext();
  return useQuery<DidYouKnowFact[]>({
    queryKey: ["didYouKnow"],
    queryFn: loadFacts,
    enabled: isAuthReady,
    ...CATALOG,
  });
}

export function useAllQuestsQuery() {
  const { getAllQuests } = useQuests();
  const { isAuthReady } = useAuthContext();
  return useQuery<Quest[]>({
    queryKey: ["quests", "all"],
    queryFn: getAllQuests,
    enabled: isAuthReady,
    ...CATALOG,
  });
}

// ----- User state (signed-in only, always revalidate) -----

export function useUserQuestsQuery() {
  const { getUserQuests } = useUserQuests();
  const { user } = useAuthContext();
  return useQuery<UserQuest[]>({
    queryKey: ["userQuests", user?.userId],
    queryFn: getUserQuests,
    enabled: !!user,
    ...USER,
  });
}

export function useUserXPQuery() {
  const { getUserXP } = useUserXP();
  const { user } = useAuthContext();
  return useQuery<UserXP | null>({
    queryKey: ["userXP", user?.userId],
    queryFn: getUserXP,
    enabled: !!user,
    ...USER,
  });
}

export function useFavoriteCountQuery() {
  const { getFavoriteCount } = useFavoriteArtworks();
  const { user } = useAuthContext();
  return useQuery<number>({
    queryKey: ["favorites", "count", user?.userId],
    queryFn: getFavoriteCount,
    enabled: !!user,
    ...USER,
  });
}

export function useFavoriteArtworksQuery() {
  const { getFavoriteArtworks } = useFavoriteArtworks();
  const { user } = useAuthContext();
  return useQuery<FavoriteArtwork[]>({
    queryKey: ["favorites", "list", user?.userId],
    queryFn: getFavoriteArtworks,
    enabled: !!user,
    ...USER,
  });
}

export function useVisitedArtworksQuery() {
  const { getVisitedArtworks } = useVisited();
  const { user } = useAuthContext();
  return useQuery<Visited[]>({
    queryKey: ["visited", user?.userId],
    queryFn: getVisitedArtworks,
    enabled: !!user,
    ...USER,
  });
}

export function useAllRanksQuery() {
  const { getAllRanks } = useRanks();
  const { user } = useAuthContext();
  return useQuery<Rank[]>({
    queryKey: ["ranks"],
    queryFn: getAllRanks,
    enabled: !!user,
    ...USER,
  });
}
