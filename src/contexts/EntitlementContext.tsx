import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Sentry from "@sentry/react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { PREMIUM_PRODUCT_ID } from "@/src/iap/products";
import {
  buyPremium,
  fetchPremiumPrice,
  finishPremiumTransaction,
  initStore,
  purchaseErrorListener,
  purchaseUpdatedListener,
  queryEntitlement,
  restoreAndQuery,
} from "@/src/iap/storeKit";
import {
  type CachedEntitlement,
  type Entitlement,
  resolveEntitlement,
  type StoreResult,
} from "@/src/utils/premiumAccess";
import { useAuthContext } from "./AuthContext";
import { useUserData } from "@/src/hooks/useUserData";

/**
 * Deliberately its own AsyncStorage key rather than living in the react-query
 * persisted cache: that snapshot has a 24h maxAge, a buster, and is wiped by
 * queryClient.clear() on sign-out. An entitlement that evaporates after a day
 * idle — or when a user signs out and back in offline — is a support ticket.
 */
const ENTITLEMENT_KEY = "ARTIFACT_ENTITLEMENT_V1";

/** Don't hammer StoreKit on every foreground. */
const REFRESH_THROTTLE_MS = 60_000;

export type RestoreOutcome = "restored" | "nothing-to-restore" | "unavailable";

interface EntitlementContextType {
  entitlement: Entitlement;
  /** The only value UI should gate on. */
  isEntitled: boolean;
  /** False until the cached value has been read; render neutral until then. */
  isEntitlementReady: boolean;
  /** Localized price, or null if the store never answered. */
  priceLabel: string | null;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<RestoreOutcome>;
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(
  undefined
);

async function readCache(): Promise<CachedEntitlement | null> {
  try {
    const raw = await AsyncStorage.getItem(ENTITLEMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntitlement;
    if (typeof parsed?.isEntitled !== "boolean") return null;
    return parsed;
  } catch {
    // Corrupt or unreadable cache is equivalent to no cache.
    return null;
  }
}

async function writeCache(isEntitled: boolean): Promise<void> {
  try {
    const payload: CachedEntitlement = {
      isEntitled,
      productId: PREMIUM_PRODUCT_ID,
      updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(ENTITLEMENT_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[entitlement] failed to persist:", error);
  }
}

export function EntitlementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuthContext();
  const { ensureUserInDB, updateUserInDB } = useUserData();

  const [entitlement, setEntitlement] = useState<Entitlement>("unknown");
  const [isEntitlementReady, setIsEntitlementReady] = useState(false);
  const [priceLabel, setPriceLabel] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const cachedRef = useRef<CachedEntitlement | null>(null);
  const lastRefreshAt = useRef(0);
  const lastMirrored = useRef<boolean | null>(null);

  /**
   * Mirror to User.isPremium for display/analytics only. Fire-and-forget:
   * never awaited by callers, never read back for gating. A failure here must
   * not affect access.
   *
   * NOTE: User.id is NOT the Cognito sub — createUserInDB never passes an id,
   * so AppSync generates a UUID. The record must be resolved first; passing
   * user.userId would update nothing.
   */
  const mirror = useCallback(
    async (isEntitled: boolean) => {
      if (!isAuthenticated) return;
      if (lastMirrored.current === isEntitled) return;
      try {
        const record = await ensureUserInDB();
        if (record?.id) {
          await updateUserInDB(record.id, { isPremium: isEntitled });
          lastMirrored.current = isEntitled;
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: "EntitlementContext", action: "mirror_premium" },
        });
      }
    },
    [isAuthenticated, ensureUserInDB, updateUserInDB]
  );

  /** Fold a store answer into state, persist it, and mirror if it changed. */
  const applyStoreResult = useCallback(
    async (store: StoreResult) => {
      const next = resolveEntitlement({
        store,
        cached: cachedRef.current,
        productId: PREMIUM_PRODUCT_ID,
      });
      setEntitlement(next);

      // Only definitive answers update the cache; an indeterminate answer must
      // never overwrite last-known-good.
      if (store === "entitled" || store === "not-entitled") {
        const isEntitled = store === "entitled";
        cachedRef.current = {
          isEntitled,
          productId: PREMIUM_PRODUCT_ID,
          updatedAt: Date.now(),
        };
        await writeCache(isEntitled);
        void mirror(isEntitled);
      }
      return next;
    },
    [mirror]
  );

  const refresh = useCallback(async () => {
    lastRefreshAt.current = Date.now();
    await applyStoreResult(await queryEntitlement());
  }, [applyStoreResult]);

  // Boot: paint from cache first, then ask the store.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await readCache();
      if (cancelled) return;
      cachedRef.current = cached;
      setEntitlement(
        resolveEntitlement({
          store: "indeterminate",
          cached,
          productId: PREMIUM_PRODUCT_ID,
        })
      );
      // Ready as soon as last-known-good is applied — prevents a lock flashing
      // at a paying user while StoreKit is still being asked.
      setIsEntitlementReady(true);

      const ok = await initStore();
      if (cancelled || !ok) return;

      void fetchPremiumPrice().then((price) => {
        if (!cancelled && price) setPriceLabel(price);
      });
      await refresh();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // App-lifetime purchase listeners. Registered here rather than in the
  // paywall because iOS replays unfinished transactions on launch, and
  // Ask-to-Buy / SCA approvals can land minutes later with no modal open.
  useEffect(() => {
    const updated = purchaseUpdatedListener((purchase) => {
      if (purchase?.productId !== PREMIUM_PRODUCT_ID) return;
      // Idempotent by construction: this can fire more than once for the same
      // transaction, and every step tolerates repetition.
      void (async () => {
        await applyStoreResult("entitled");
        await finishPremiumTransaction(purchase);
        setIsPurchasing(false);
      })();
    });

    const failed = purchaseErrorListener((error) => {
      setIsPurchasing(false);
      Sentry.addBreadcrumb({
        category: "paywall",
        message: "purchase_error",
        data: { code: (error as { code?: string })?.code },
      });
    });

    return () => {
      updated?.remove?.();
      failed?.remove?.();
    };
  }, [applyStoreResult]);

  // Foreground refresh, throttled. This is how a refund propagates.
  useEffect(() => {
    const onChange = (status: AppStateStatus) => {
      if (status !== "active") return;
      if (Date.now() - lastRefreshAt.current < REFRESH_THROTTLE_MS) return;
      void refresh();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [refresh]);

  // Sign-out: reset in-memory state and force a fresh store query, but KEEP
  // the cached last-known-good. Clearing it would lock out a paying user who
  // signs out and back in without a network. The entitlement is per-Apple-ID
  // by construction, so there is nothing account-specific to protect here;
  // per-account data is already handled by queryClient.clear() + userId keys.
  const wasAuthenticated = useRef(isAuthenticated);
  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      lastMirrored.current = null;
      lastRefreshAt.current = 0;
      setEntitlement(
        resolveEntitlement({
          store: "indeterminate",
          cached: cachedRef.current,
          productId: PREMIUM_PRODUCT_ID,
        })
      );
      void refresh();
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, refresh]);

  const purchase = useCallback(async () => {
    setIsPurchasing(true);
    Sentry.addBreadcrumb({ category: "paywall", message: "purchase_started" });
    try {
      // Outcome arrives via purchaseUpdatedListener, not here.
      await buyPremium();
    } catch (error) {
      setIsPurchasing(false);
      Sentry.addBreadcrumb({
        category: "paywall",
        message: "purchase_request_failed",
      });
      throw error;
    }
  }, []);

  const restore = useCallback(async (): Promise<RestoreOutcome> => {
    setIsRestoring(true);
    try {
      const store = await restoreAndQuery();
      const next = await applyStoreResult(store);
      Sentry.addBreadcrumb({
        category: "paywall",
        message: "restore_result",
        data: { store },
      });
      if (store === "indeterminate") return "unavailable";
      return next === "entitled" ? "restored" : "nothing-to-restore";
    } finally {
      setIsRestoring(false);
    }
  }, [applyStoreResult]);

  // Dev-only bypass. Env-driven and __DEV__-gated so it cannot ship enabled —
  // unlike AR_TEST_MODE, which is a source constant someone must remember to
  // flip back.
  const devForced =
    __DEV__ && process.env.EXPO_PUBLIC_DEV_FORCE_PREMIUM === "1";

  const effective: Entitlement = devForced ? "entitled" : entitlement;

  const value: EntitlementContextType = {
    entitlement: effective,
    isEntitled: effective === "entitled",
    isEntitlementReady: isEntitlementReady || devForced,
    priceLabel,
    isPurchasing,
    isRestoring,
    purchase,
    restore,
    refresh,
  };

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlementContext() {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error(
      "useEntitlementContext must be used within an EntitlementProvider"
    );
  }
  return context;
}
