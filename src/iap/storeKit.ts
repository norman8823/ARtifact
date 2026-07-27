// The ONLY module that imports expo-iap.
//
// Two reasons for the indirection:
//  1. The OpenIAP surface is churning — 4.7.1 already marks `request.ios` and
//     `request.android` deprecated for removal in OpenIAP 3.0 (we use
//     `request.apple`). Keeping the SDK behind one seam means a breaking
//     upgrade touches this file only.
//  2. It keeps expo-iap out of jest's module graph, so the pure logic in
//     src/utils/premiumAccess.ts needs no native mock.
//
// Everything here is intentionally forgiving: a store that cannot be reached
// must report "indeterminate", never "not-entitled". Turning an outage into a
// negative answer would revoke access from people who paid.

import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
} from "expo-iap";
import type { StoreResult } from "../utils/premiumAccess";
import { PREMIUM_PRODUCT_ID } from "./products";

/** Minimal shape we rely on; avoids coupling to expo-iap's evolving types. */
export interface StorePurchase {
  productId: string;
}

/** Opens the StoreKit connection. Safe to call more than once. */
export async function initStore(): Promise<boolean> {
  try {
    await initConnection();
    return true;
  } catch (error) {
    console.warn("[iap] initConnection failed:", error);
    return false;
  }
}

/**
 * Localized price string for the paywall, or null if the store didn't answer.
 *
 * Returning null is NOT a reason to disable purchasing — `requestPurchase`
 * does not need the product object, and an empty product list is most often
 * an App Store Connect state (Paid Apps agreement not yet active) rather than
 * a device problem. The paywall falls back to a hardcoded price.
 */
export async function fetchPremiumPrice(): Promise<string | null> {
  try {
    const products = await fetchProducts({
      skus: [PREMIUM_PRODUCT_ID],
      type: "in-app",
    });
    const list = (products ?? []) as { id?: string; displayPrice?: string }[];
    const match = list.find((p) => p?.id === PREMIUM_PRODUCT_ID) ?? list[0];
    return match?.displayPrice ?? null;
  } catch (error) {
    console.warn("[iap] fetchProducts failed:", error);
    return null;
  }
}

/**
 * Ask StoreKit whether this Apple ID owns the premium unlock.
 *
 * A thrown error means "we don't know" — offline, store unreachable, StoreKit
 * not ready — and maps to "indeterminate" so callers fall back to the cached
 * last-known-good value.
 */
export async function queryEntitlement(): Promise<StoreResult> {
  try {
    const purchases = await getAvailablePurchases();
    const owned = (purchases ?? []).some(
      (p) => p?.productId === PREMIUM_PRODUCT_ID
    );
    return owned ? "entitled" : "not-entitled";
  } catch (error) {
    console.warn("[iap] getAvailablePurchases failed:", error);
    return "indeterminate";
  }
}

/**
 * Start a purchase. Event-based: the real outcome arrives on
 * purchaseUpdatedListener, NOT in the return value — so callers must not
 * treat resolution here as success.
 */
export async function buyPremium(): Promise<void> {
  await requestPurchase({
    request: { apple: { sku: PREMIUM_PRODUCT_ID } },
    type: "in-app",
  });
}

/**
 * Restore prior purchases. `restorePurchases()` deliberately does not return
 * the purchases, so re-query afterwards to learn the outcome.
 */
export async function restoreAndQuery(): Promise<StoreResult> {
  try {
    await restorePurchases();
  } catch (error) {
    console.warn("[iap] restorePurchases failed:", error);
    return "indeterminate";
  }
  return queryEntitlement();
}

/**
 * Acknowledge a transaction so iOS stops replaying it on every launch.
 * isConsumable is false — the premium unlock is non-consumable and must stay
 * in the entitlement list forever.
 */
export async function finishPremiumTransaction(
  purchase: StorePurchase
): Promise<void> {
  try {
    await finishTransaction({ purchase: purchase as never, isConsumable: false });
  } catch (error) {
    // Non-fatal: iOS will replay the transaction and we'll retry next launch.
    console.warn("[iap] finishTransaction failed:", error);
  }
}

export { purchaseErrorListener, purchaseUpdatedListener };
