"use client";
import { useEffect } from "react";

const LITE = "(max-width: 767px), (pointer: coarse)";

// On phones the variables switch instantly (animating them is too heavy), so
// a layer in the old color sits behind the page and fades out instead.
function crossfadeBackground(fromColor) {
  let layer = document.getElementById("palette-fade");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "palette-fade";
    layer.setAttribute("aria-hidden", "true");
    document.body.prepend(layer);
  }
  layer.getAnimations().forEach((a) => a.cancel());
  layer.style.background = fromColor;
  layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease-out", fill: "forwards" });
}

export function applyPalette(palette) {
  const root = document.documentElement.style;
  const current = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (current && current !== palette.bg && window.matchMedia(LITE).matches) crossfadeBackground(current);
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
