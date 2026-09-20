import { useEffect, useRef, useState } from "react";

/**
 * Reveals a section once it scrolls into view. Progress (0 → 1) is used by the
 * thread section to draw its connecting line as the reader descends.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setShown(true);
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shown, threshold]);

  return { ref, shown } as const;
}

/** Utility class pair for a scroll reveal. */
export function revealClass(shown: boolean, delayMs = 0) {
  return {
    className: shown ? "reveal reveal-in" : "reveal",
    style: delayMs ? { transitionDelay: `${delayMs}ms` } : undefined,
  } as const;
}
