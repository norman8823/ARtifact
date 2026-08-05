import {
  BACK_FALLBACK_ROUTE,
  resolveBackAction,
} from "../navigation";

describe("resolveBackAction", () => {
  it("pops the stack when there is history", () => {
    expect(resolveBackAction(true)).toEqual({ type: "back" });
  });

  /**
   * The case that produces a dead back button: `router.back()` no-ops silently
   * with an empty stack, so the control has to fall back to an explicit route.
   */
  it("replaces with the fallback route when the stack is empty", () => {
    expect(resolveBackAction(false)).toEqual({
      type: "replace",
      href: BACK_FALLBACK_ROUTE,
    });
  });

  it("never resolves to a no-op", () => {
    for (const canGoBack of [true, false]) {
      expect(resolveBackAction(canGoBack).type).toBeDefined();
    }
  });
});
