// Pure premium-entitlement resolution and quest-access rules.
//
// StoreKit is the source of truth for entitlement; `User.isPremium` in
// DynamoDB is only a display/analytics mirror and is never consulted here.
// Premium gates QUESTS only — scan count is never gated.

/** What the store told us, including "we couldn't find out". */
export type StoreResult = "entitled" | "not-entitled" | "indeterminate";

/** What the app acts on. "unknown" means we genuinely don't know yet. */
export type Entitlement = "entitled" | "not-entitled" | "unknown";

export interface CachedEntitlement {
  isEntitled: boolean;
  /** Guards against a cache written for a different/renamed product. */
  productId: string;
  updatedAt: number;
}

/**
 * Fold a store answer plus the last-known-good cache into the value the UI
 * gates on.
 *
 * - A definitive store answer always wins and should overwrite the cache
 *   (`not-entitled` is how a refund propagates).
 * - `indeterminate` (offline, store unreachable) falls back to the cached
 *   value **with no TTL**: a paying user in a museum basement keeps access
 *   indefinitely. Failing closed here would lock out exactly the people
 *   who paid.
 */
export function resolveEntitlement({
  store,
  cached,
  productId,
}: {
  store: StoreResult;
  cached: CachedEntitlement | null;
  /** Current product id; a cache for any other product is ignored. */
  productId: string;
}): Entitlement {
  if (store === "entitled") return "entitled";
  if (store === "not-entitled") return "not-entitled";

  // Indeterminate: lean on last-known-good.
  if (cached && cached.productId === productId && cached.isEntitled) {
    return "entitled";
  }
  return "unknown";
}

/**
 * Whether a quest can be started/played.
 *
 * `isPremiumQuest` is compared `=== true` on purpose: quest rows created
 * before the attribute existed return `null`, and treating null as premium
 * would lock every quest in the catalog.
 *
 * An already-started quest stays accessible regardless of entitlement — a
 * refund or a store hiccup must not strand in-flight progress.
 */
export function isQuestAccessible({
  isPremiumQuest,
  entitlement,
  hasStarted,
}: {
  isPremiumQuest: boolean | null | undefined;
  entitlement: Entitlement;
  hasStarted: boolean;
}): boolean {
  if (hasStarted) return true;
  if (isPremiumQuest !== true) return true;
  return entitlement === "entitled";
}

/** Presentation state for the quest badge. Cosmetic only — never a gate. */
export type QuestLockState = "unlocked" | "locked" | "owned" | "indeterminate";

/**
 * `isEntitlementReady === false` yields "indeterminate" so callers can render
 * a neutral badge instead of flashing a lock at a paying user during the
 * AsyncStorage read on cold launch.
 */
export function questLockState({
  isPremiumQuest,
  entitlement,
  isEntitlementReady,
}: {
  isPremiumQuest: boolean | null | undefined;
  entitlement: Entitlement;
  isEntitlementReady: boolean;
}): QuestLockState {
  if (isPremiumQuest !== true) return "unlocked";
  if (!isEntitlementReady) return "indeterminate";
  return entitlement === "entitled" ? "owned" : "locked";
}
