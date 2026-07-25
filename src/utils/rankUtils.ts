/**
 * Pure XP → rank lookup shared by useRanks.getRankByXP. Expects ranks
 * sorted by minXP ascending (getAllRanks sorts them). XP outside every
 * band falls back to the first (lowest) rank — note this includes XP above
 * the top band's maxXP (pre-existing behavior, preserved as-is; see the
 * characterization test).
 */
export function getRankForXP<T extends { minXP: number; maxXP: number }>(
  ranks: T[],
  xpPoints: number
): T | undefined {
  return (
    ranks.find((rank) => xpPoints >= rank.minXP && xpPoints <= rank.maxXP) ||
    ranks[0]
  );
}
