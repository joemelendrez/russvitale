"use client";
import { useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/theme";
import { currentMode, setMode } from "./usePalette";
import AppIcon from "./AppIcon";

function savedChoice() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

// { mode, choice }: what shows now, and what was picked (null = the phone's setting).
// Also follows the phone when it switches and nothing was picked.
export function useTheme() {
  const [state, setState] = useState({ mode: "dark", choice: null });
  useEffect(() => {
    const read = () => setState({ mode: currentMode(), choice: savedChoice() });
    read();
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (!savedChoice()) setMode(null);
    };
    window.addEventListener("russ-theme", read);
    media.addEventListener("change", onSystem);
    return () => {
      window.removeEventListener("russ-theme", read);
      media.removeEventListener("change", onSystem);
    };
  }, []);
  return state;
}

// The sun/moon button in the header: switches to the other mode and remembers it.
export default function ThemeToggle({ className = "" }) {
  const { mode } = useTheme();
  const next = mode === "light" ? "dark" : "light";
  return (
    <button type="button" onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`} title={`${next === "light" ? "Light" : "Dark"} mode`} className={className}>
      <AppIcon name={mode === "light" ? "moon" : "sun"} className="h-[18px] w-[18px]" />
    </button>
  );
}

const CHOICES = [
  { key: "light", label: "Light", icon: "sun" },
  { key: "dark", label: "Dark", icon: "moon" },
  { key: null, label: "Phone", icon: "smartphone" },
];

// Light · Dark · Phone, for the phone menu.
export function ThemeChoices() {
  const { choice } = useTheme();
  return (
    <div role="radiogroup" aria-label="Colors" className="grid grid-cols-3 gap-1 rounded-2xl bg-era-fg/[0.06] p-1">
      {CHOICES.map((c) => {
        const on = choice === c.key;
        return (
          <button
            key={c.label}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setMode(c.key)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${on ? "bg-era-accent text-era-bg" : "text-era-fg/80"}`}
          >
            <AppIcon name={c.icon} className="h-4 w-4 shrink-0" /> {c.label}
          </button>
        );
      })}
    </div>
  );
}
