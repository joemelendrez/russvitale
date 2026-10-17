"use client";
import { useEffect, useRef, useState } from "react";
import { BANDSINTOWN } from "@/data/shows";
import { useTheme } from "./ThemeToggle";

const SCRIPT_SRC = "https://widgetv3.bandsintown.com/main.min.js";

// "rgb(18, 17, 22)" as "#121116", since the widget takes hex colors.
function toHex(color) {
  const parts = color.match(/\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return null;
  return `#${parts
    .slice(0, 3)
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
    .join("")}`;
}

// Bandsintown's own tour-dates widget for Russ: real dates straight from
// them, never typed in by us. The script only loads once the section is near.
// The widget draws its text and its logo in the colors it starts with, so it
// starts with the theme's text color and is drawn again when the theme
// changes (CSS alone can't recolor the logo).
export default function BandsintownWidget() {
  const ref = useRef(null);
  const slot = useRef(null);
  const [near, setNear] = useState(false);
  const { mode } = useTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const box = slot.current;
    if (!near || !box) return;
    // The widget's own markup is built here by hand, outside React, since its
    // script rewrites it.
    const ink = toHex(getComputedStyle(ref.current).color) ?? (mode === "light" ? "#121116" : "#ffffff");
    const a = document.createElement("a");
    a.className = "bit-widget-initializer";
    a.href = BANDSINTOWN.href;
    a.textContent = "Russ on Bandsintown";
    const settings = {
      "artist-name": `id_${BANDSINTOWN.artistId}`,
      "display-local-dates": "false",
      "display-past-dates": "true",
      "auto-style": "false",
      "text-color": ink,
      "link-color": ink,
      "background-color": "rgba(0,0,0,0)",
      "display-limit": "8",
      "display-start-time": "false",
      "link-text-color": mode === "light" ? "#ffffff" : "#000000",
      "display-lineup": "false",
      "display-play-my-city": "true",
      "separator-color": mode === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
    };
    for (const [k, v] of Object.entries(settings)) a.setAttribute(`data-${k}`, v);
    box.replaceChildren(a);
    // Running the script (again) draws every initializer on the page.
    document.querySelectorAll(`script[src="${SCRIPT_SRC}"]`).forEach((s) => s.remove());
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, [near, mode]);

  return (
    <div ref={ref} className="bit-widget-host mt-14 min-h-24 rounded-2xl border border-era-fg/10 p-4 text-era-fg sm:p-6">
      <div ref={slot} />
    </div>
  );
}
