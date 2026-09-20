import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = "(max-width: 768px)";

/**
 * Reports whether the viewport is at mobile width, driven by a matchMedia
 * listener rather than a resize-and-measure loop. Layout components use
 * this to swap navigation patterns (sidebar+topnav vs header+bottom nav)
 * rather than just shrinking the desktop layout.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
