/**
 * The single premium product: a one-time, non-consumable "lifetime unlock"
 * that opens every premium quest. Deliberately NOT a subscription — the
 * quest catalog is finite, so there is no recurring value to deliver
 * (see premium-tier.md).
 *
 * Must match the product id created in App Store Connect exactly — a mismatch
 * surfaces as an empty product list with no error, which is miserable to debug.
 *
 * Deliberately NOT namespaced under the bundle identifier. The bundle id
 * permanently carries a former partner's name and cannot be changed (CLAUDE.md
 * landmine #8), but this product id was created fresh in 2026-08 and is equally
 * permanent, so it was not worth minting a second immutable identifier with the
 * same problem. Apple does not verify domain ownership for product ids, and
 * matching the bundle namespace is convention rather than a requirement.
 */
export const PREMIUM_PRODUCT_ID = "com.artquest.ARtifact.premium.lifetime";

/** Shown only if the store never returns a localized price. */
export const PREMIUM_PRICE_FALLBACK = "$5.99";
