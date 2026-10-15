"use client";
import { useEffect } from "react";

export function applyPalette(palette) {
  const root = document.documentElement.style;
  root.setProperty("--bg", palette.bg);
  root.setProperty("--fg", palette.fg);
  root.setProperty("--muted", palette.muted);
  root.setProperty("--accent", palette.accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", palette.bg);
}

// Repaints the page with `palette` while the element sits across the middle
// of the viewport, so each era takes over as it scrolls into the center.
export function usePalette(ref, palette) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) applyPalette(palette);
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, palette]);
}
