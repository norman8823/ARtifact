/**
 * Pure XP → rank lookup shared by useRanks.getRankByXP and the profile
 * screen. Expects ranks sorted by minXP ascending (getAllRanks sorts them).
 *
 * The top rank is open-ended by design: XP at or above the last band's
 * minXP maps to the last rank even if it exceeds that band's maxXP
 * (live data caps the top band at 999999 as a sentinel, but the code must
 * not depend on it — XP must never wrap back to the lowest rank).
 * XP below the first band falls back to the first rank.
 */
export function getRankForXP<T extends { minXP: number; maxXP: number }>(
  ranks: T[],
  xpPoints: number
): T | undefined {
  const match = ranks.find(
    (rank) => xpPoints >= rank.minXP && xpPoints <= rank.maxXP
  );
  if (match) {
    return match;
  }
  const topRank = ranks[ranks.length - 1];
  if (topRank && xpPoints >= topRank.minXP) {
    return topRank;
  }
  return ranks[0];
}
