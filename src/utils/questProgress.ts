// Pure quest-progress set math shared by useUserQuests (startQuest /
// updateQuestProgress). Quest progress is a string-set intersection over
// MET artwork IDs; a quest completes when every required artwork has been
// visited.

export interface QuestProgress {
  artworksVisited: string[];
  isCompleted: boolean;
}

/**
 * Progress seeded at quest start: retroactive credit for artworks the user
 * has already visited. A quest whose requirements are all already visited
 * is completed immediately.
 */
export function seedQuestProgress(
  requiredArtworks: string[],
  visitedArtworkIds: string[]
): QuestProgress {
  const artworksVisited = requiredArtworks.filter((artworkId) =>
    visitedArtworkIds.includes(artworkId)
  );
  return {
    artworksVisited,
    isCompleted: artworksVisited.length === requiredArtworks.length,
  };
}

/** Whether a scan of artworkId can advance this quest. */
export function questRequiresArtwork(
  quest: { requiredArtworks: string[]; isCompleted: boolean },
  artworkId: string
): boolean {
  return quest.requiredArtworks.includes(artworkId) && !quest.isCompleted;
}

/**
 * Progress after recording a visit to artworkId, or null when the artwork
 * was already counted (callers skip the write). Callers must have checked
 * questRequiresArtwork first — this does not re-validate membership.
 */
export function applyArtworkVisit(
  requiredArtworks: string[],
  artworksVisited: string[],
  artworkId: string
): QuestProgress | null {
  if (artworksVisited.includes(artworkId)) {
    return null;
  }
  const updated = [...artworksVisited, artworkId];
  return {
    artworksVisited: updated,
    isCompleted: updated.length === requiredArtworks.length,
  };
}
