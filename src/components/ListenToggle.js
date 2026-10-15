"use client";
import { motion } from "framer-motion";
import { SERVICES } from "@/data/players";
import { setListenOn, useListenOn } from "@/lib/listenOn";

// "Play on" switch: every player on the site uses the picked service.
// Remembered per device.
export default function ListenToggle({ className = "" }) {
  const service = useListenOn();
  return (
    <div role="radiogroup" aria-label="Play music on" className={`inline-flex items-center rounded-full border border-era-fg/15 bg-era-bg/90 p-1 shadow-lg ${className}`}>
      <span className="hidden px-3 text-[10px] uppercase tracking-[0.25em] text-era-muted sm:inline">Play on</span>
      {SERVICES.map((s) => {
        const on = service === s.key;
        return (
          <button
            key={s.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setListenOn(s.key)}
            className={`relative rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors sm:px-4 sm:text-xs ${
              on ? "text-era-bg" : "text-era-fg/70 hover:text-era-fg"
            }`}
          >
            {on && <motion.span layoutId="listen-on-pill" className="absolute inset-0 rounded-full bg-era-fg" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
            <span className="relative">
              <span className="sm:hidden">{s.short ?? s.label}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
