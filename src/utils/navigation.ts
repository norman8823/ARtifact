/**
 * Back-navigation needs somewhere to go.
 *
 * `router.back()` is a **silent no-op** when the current screen is the first
 * entry in the stack — the button appears dead rather than erroring. That is
 * not a hypothetical: the app registers the `artifact://` scheme, so any screen
 * can be opened cold as the only entry, and `router.replace()` (used on the
 * auth paths) discards history too.
 *
 * Keeping the decision here, as a pure function, so it can be tested without a
 * navigator; the runtime wiring lives in `src/hooks/useGoBack.ts`.
 */

/** Where to land when there is no history to pop — the dashboard's home tab. */
export const BACK_FALLBACK_ROUTE = "/home" as const;

export type BackAction =
  | { type: "back" }
  | { type: "replace"; href: typeof BACK_FALLBACK_ROUTE };

/**
 * Pop the stack when possible, otherwise replace with the fallback route so the
 * control always does something visible.
 */
export function resolveBackAction(canGoBack: boolean): BackAction {
  return canGoBack
    ? { type: "back" }
    : { type: "replace", href: BACK_FALLBACK_ROUTE };
}
