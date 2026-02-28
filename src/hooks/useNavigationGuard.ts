import { useEffect } from "react";

/**
 * Shows the browser's native "Leave site?" prompt when the user
 * tries to close the tab or refresh while `shouldBlock` is true.
 *
 * Does not intercept in-app navigation (that requires a data router).
 */
export function useNavigationGuard(shouldBlock: boolean) {
  useEffect(() => {
    if (!shouldBlock) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);
}