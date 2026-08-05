import { useRouter } from "expo-router";
import { useCallback } from "react";

import { resolveBackAction } from "@/src/utils/navigation";

/**
 * Back handler for screens that render their own back control.
 *
 * Prefer this over calling `router.back()` directly: `back()` does nothing at
 * all when there is no history, which reads to the user as a broken button.
 * See `src/utils/navigation.ts` for the decision and why it matters here.
 */
export function useGoBack() {
  const router = useRouter();

  return useCallback(() => {
    const action = resolveBackAction(router.canGoBack());

    if (action.type === "back") {
      router.back();
      return;
    }

    router.replace(action.href);
  }, [router]);
}
