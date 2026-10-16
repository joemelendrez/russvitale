"use client";
import { useEffect } from "react";
import { DEFAULT_PALETTE } from "@/data/eras";
import { THEME_KEY, themedPalette } from "@/lib/theme";

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

// The era palette the page last asked for, kept so a light/dark switch can
// repaint it in the other mode.
let lastPalette = DEFAULT_PALETTE;

export const currentMode = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

// Saves the choice ("light" | "dark", or null to follow the phone) and repaints.
export function setMode(choice) {
  try {
    if (choice) localStorage.setItem(THEME_KEY, choice);
    else localStorage.removeItem(THEME_KEY);
  } catch {}
  const mode = choice ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  applyPalette(lastPalette);
  window.dispatchEvent(new Event("russ-theme"));
}

export function applyPalette(source) {
  lastPalette = source;
  const palette = themedPalette(source, currentMode());
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
