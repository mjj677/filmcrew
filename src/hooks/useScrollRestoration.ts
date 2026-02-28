import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "scroll-positions";

function getStore(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Save current scroll position for the given key.
 * Call this before navigating away (e.g. on card click).
 */
export function saveScrollPosition(key: string) {
  const store = getStore();
  store[key] = window.scrollY;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Restores scroll position once data has loaded.
 *
 * @param isLoaded - pass `true` once content is rendered (e.g. `!isLoading`)
 */
export function useScrollRestoration(isLoaded: boolean) {
  const { pathname, search } = useLocation();
  const key = pathname + search;
  const restored = useRef(false);

  useEffect(() => {
    if (!isLoaded || restored.current) return;
    restored.current = true;

    const store = getStore();
    const saved = store[key];

    if (saved != null && saved > 0) {
      // Wait a tick for the DOM to settle after data render
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });

      // Clean up so it doesn't restore again on filter changes
      delete store[key];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    }
  }, [isLoaded, key]);
}