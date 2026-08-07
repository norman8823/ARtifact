import {
  shouldOfferPurchase,
  type CachedEntitlement,
  type Entitlement,
  isQuestAccessible,
  questLockState,
  resolveEntitlement,
  type StoreResult,
} from "../premiumAccess";

const PRODUCT = "com.artquest.ARtifact.premium.lifetime";

const cache = (
  isEntitled: boolean,
  productId = PRODUCT
): CachedEntitlement => ({ isEntitled, productId, updatedAt: 1_700_000_000 });

describe("resolveEntitlement", () => {
  it("trusts a definitive entitled answer from the store", () => {
    expect(
      resolveEntitlement({ store: "entitled", cached: null, productId: PRODUCT })
    ).toBe("entitled");
  });

  it("trusts a definitive not-entitled answer even over an entitled cache (refund path)", () => {
    expect(
      resolveEntitlement({
        store: "not-entitled",
        cached: cache(true),
        productId: PRODUCT,
      })
    ).toBe("not-entitled");
  });

  it("falls back to an entitled cache when the store is unreachable (offline paying user)", () => {
    expect(
      resolveEntitlement({
        store: "indeterminate",
        cached: cache(true),
        productId: PRODUCT,
      })
    ).toBe("entitled");
  });

  it("does not invent entitlement when offline with no cache", () => {
    expect(
      resolveEntitlement({
        store: "indeterminate",
        cached: null,
        productId: PRODUCT,
      })
    ).toBe("unknown");
  });

  it("does not invent entitlement when offline with a not-entitled cache", () => {
    expect(
      resolveEntitlement({
        store: "indeterminate",
        cached: cache(false),
        productId: PRODUCT,
      })
    ).toBe("unknown");
  });

  it("ignores a cache written for a different product id", () => {
    expect(
      resolveEntitlement({
        store: "indeterminate",
        cached: cache(true, "com.example.someOtherProduct"),
        productId: PRODUCT,
      })
    ).toBe("unknown");
  });

  it("honors the entitled cache regardless of how old it is (no TTL)", () => {
    const ancient: CachedEntitlement = {
      isEntitled: true,
      productId: PRODUCT,
      updatedAt: 0,
    };
    expect(
      resolveEntitlement({
        store: "indeterminate",
        cached: ancient,
        productId: PRODUCT,
      })
    ).toBe("entitled");
  });

  it("never returns not-entitled from an indeterminate store", () => {
    const cases: (CachedEntitlement | null)[] = [
      null,
      cache(true),
      cache(false),
    ];
    for (const cached of cases) {
      expect(
        resolveEntitlement({ store: "indeterminate", cached, productId: PRODUCT })
      ).not.toBe("not-entitled");
    }
  });
});

describe("isQuestAccessible", () => {
  const entitlements: Entitlement[] = ["entitled", "not-entitled", "unknown"];
  const freeFlags: (boolean | null | undefined)[] = [false, null, undefined];

  it("allows every non-premium quest regardless of entitlement", () => {
    for (const isPremiumQuest of freeFlags) {
      for (const entitlement of entitlements) {
        expect(
          isQuestAccessible({ isPremiumQuest, entitlement, hasStarted: false })
        ).toBe(true);
      }
    }
  });

  it("treats null/undefined isPremium as FREE, not premium", () => {
    // Quest rows predating the attribute return null. Locking these would
    // lock the entire catalog.
    expect(
      isQuestAccessible({
        isPremiumQuest: null,
        entitlement: "not-entitled",
        hasStarted: false,
      })
    ).toBe(true);
    expect(
      isQuestAccessible({
        isPremiumQuest: undefined,
        entitlement: "unknown",
        hasStarted: false,
      })
    ).toBe(true);
  });

  it("allows a premium quest only when entitled", () => {
    expect(
      isQuestAccessible({
        isPremiumQuest: true,
        entitlement: "entitled",
        hasStarted: false,
      })
    ).toBe(true);
    expect(
      isQuestAccessible({
        isPremiumQuest: true,
        entitlement: "not-entitled",
        hasStarted: false,
      })
    ).toBe(false);
    expect(
      isQuestAccessible({
        isPremiumQuest: true,
        entitlement: "unknown",
        hasStarted: false,
      })
    ).toBe(false);
  });

  it("keeps an already-started premium quest playable after a refund", () => {
    for (const entitlement of entitlements) {
      expect(
        isQuestAccessible({
          isPremiumQuest: true,
          entitlement,
          hasStarted: true,
        })
      ).toBe(true);
    }
  });

  it("covers the full truth table without throwing", () => {
    const premiumFlags: (boolean | null | undefined)[] = [
      true,
      false,
      null,
      undefined,
    ];
    for (const isPremiumQuest of premiumFlags) {
      for (const entitlement of entitlements) {
        for (const hasStarted of [true, false]) {
          const result = isQuestAccessible({
            isPremiumQuest,
            entitlement,
            hasStarted,
          });
          // Only one combination is ever denied: an unstarted premium quest
          // without a confirmed entitlement.
          const expected = !(
            isPremiumQuest === true &&
            !hasStarted &&
            entitlement !== "entitled"
          );
          expect(result).toBe(expected);
        }
      }
    }
  });
});

describe("questLockState", () => {
  it("reports non-premium quests as unlocked, even before entitlement resolves", () => {
    expect(
      questLockState({
        isPremiumQuest: false,
        entitlement: "unknown",
        isEntitlementReady: false,
      })
    ).toBe("unlocked");
    expect(
      questLockState({
        isPremiumQuest: null,
        entitlement: "unknown",
        isEntitlementReady: false,
      })
    ).toBe("unlocked");
  });

  it("reports indeterminate for a premium quest until entitlement is ready", () => {
    // Prevents flashing a lock at a paying user on cold launch.
    expect(
      questLockState({
        isPremiumQuest: true,
        entitlement: "entitled",
        isEntitlementReady: false,
      })
    ).toBe("indeterminate");
  });

  it("distinguishes owned from locked once ready", () => {
    expect(
      questLockState({
        isPremiumQuest: true,
        entitlement: "entitled",
        isEntitlementReady: true,
      })
    ).toBe("owned");
    expect(
      questLockState({
        isPremiumQuest: true,
        entitlement: "not-entitled",
        isEntitlementReady: true,
      })
    ).toBe("locked");
    expect(
      questLockState({
        isPremiumQuest: true,
        entitlement: "unknown",
        isEntitlementReady: true,
      })
    ).toBe("locked");
  });
});

describe("resolve → access integration", () => {
  const scenario = (store: StoreResult, cached: CachedEntitlement | null) =>
    isQuestAccessible({
      isPremiumQuest: true,
      entitlement: resolveEntitlement({ store, cached, productId: PRODUCT }),
      hasStarted: false,
    });

  it("purchased, then offline → still has access", () => {
    expect(scenario("indeterminate", cache(true))).toBe(true);
  });

  it("never purchased, offline → gated", () => {
    expect(scenario("indeterminate", null)).toBe(false);
  });

  it("refunded → gated on next definitive answer", () => {
    expect(scenario("not-entitled", cache(true))).toBe(false);
  });

  it("fresh purchase → access", () => {
    expect(scenario("entitled", null)).toBe(true);
  });
});

describe("shouldOfferPurchase", () => {
  it("offers the purchase when the store has the product", () => {
    expect(
      shouldOfferPurchase({ availability: "available", isEntitled: false })
    ).toBe(true);
  });

  it("hides it when the store answered and had nothing to sell", () => {
    // Product not created yet, or Paid Apps agreement not Active — a buy
    // button here is dead on arrival.
    expect(
      shouldOfferPurchase({ availability: "unavailable", isEntitled: false })
    ).toBe(false);
  });

  it("still offers it when the store could not be reached", () => {
    // "unknown" is offline / StoreKit not ready. requestPurchase does not need
    // the product object, so blocking here would stop a real customer paying.
    expect(
      shouldOfferPurchase({ availability: "unknown", isEntitled: false })
    ).toBe(true);
  });

  it("never offers it to someone who already owns it", () => {
    for (const availability of ["available", "unavailable", "unknown"] as const) {
      expect(shouldOfferPurchase({ availability, isEntitled: true })).toBe(false);
    }
  });
});
