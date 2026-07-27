// Pure daily featured-quest selection, extracted from home.tsx so it can be
// tested. The hash is preserved byte-for-byte from the original inline
// implementation — changing it would shift which quest is featured today.

export interface FeaturableQuest {
  id: string;
}

/**
 * Deterministic per-day hash of a date string. Same algorithm as the original
 * inline reducer in home.tsx; kept verbatim (including the `a & a` 32-bit
 * coercion) so the featured pick does not change on refactor.
 */
export function dateSeed(dateString: string): number {
  return dateString.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}

/**
 * Pick the day's featured quest: prefer quests the user has not completed,
 * fall back to the full list once everything is completed (so the home card
 * is never empty), and choose deterministically from `dateString` so the
 * selection is stable all day and across re-renders.
 *
 * Premium quests are deliberately NOT excluded — the home card shows them
 * locked, which advertises the tier on the highest-traffic surface.
 */
export function pickFeaturedQuest<T extends FeaturableQuest>(
  allQuests: T[],
  completedQuestIds: Set<string>,
  dateString: string
): T | null {
  if (allQuests.length === 0) return null;

  const availableQuests = allQuests.filter(
    (quest) => !completedQuestIds.has(quest.id)
  );
  const questsToChooseFrom =
    availableQuests.length > 0 ? availableQuests : allQuests;
  if (questsToChooseFrom.length === 0) return null;

  const index = Math.abs(dateSeed(dateString)) % questsToChooseFrom.length;
  return questsToChooseFrom[index];
}
