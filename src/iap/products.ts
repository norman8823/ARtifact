/**
 * The single premium product: a one-time, non-consumable "lifetime unlock"
 * that opens every premium quest. Deliberately NOT a subscription — the
 * quest catalog is finite, so there is no recurring value to deliver
 * (see premium-tier.md).
 *
 * Must match the product id created in App Store Connect exactly.
 */
export const PREMIUM_PRODUCT_ID = "com.rauljiminian.ARtifact.premium.lifetime";

/** Shown only if the store never returns a localized price. */
export const PREMIUM_PRICE_FALLBACK = "$5.99";
