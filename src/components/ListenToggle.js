"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SERVICES } from "@/data/players";
import { setListenOn, useListenOn, useNowPlayingService } from "@/lib/listenOn";

// Simple marks in each service's color. Not the services' logos.
const COLORS = { spotify: "#1ed760", youtube: "#ff0033", soundcloud: "#ff5500" };

export function ServiceMark({ service, className = "h-5 w-5" }) {
  const color = COLORS[service];
  if (service === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="4" fill={color} />
        <path d="M10 9v6l5-3z" fill="#fff" />
      </svg>
    );
  }
  if (service === "soundcloud") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path d="M9 17h9.5a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 9 9.5z" fill={color} />
        <path d="M7 10v7M5 11.5V17M3 13v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M7 9.5c3.5-1 7-.7 10 1M7.5 12.7c2.8-.8 5.6-.5 8 .9M8 15.6c2.2-.6 4.3-.4 6.2.7" stroke="#000" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const labelOf = (key) => SERVICES.find((s) => s.key === key)?.label ?? key;

// "Play on": a round button next to the Albums/Singles tabs that opens a
// menu of services. Every player on the site uses the pick (remembered per
// device). While a song plays on another service because the pick doesn't
// carry it, the button shows that service instead.
export default function ListenToggle({ className = "" }) {
  const picked = useListenOn();
  const playing = useNowPlayingService();
  const shown = playing ?? picked;
  const elsewhere = playing && playing !== picked;
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={elsewhere ? `Playing on ${labelOf(playing)}. Play music on: ${labelOf(picked)}` : `Play music on: ${labelOf(picked)}`}
        title={elsewhere ? `Playing on ${labelOf(playing)}` : `Play on ${labelOf(picked)}`}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-era-fg/15 bg-era-bg/90 shadow-lg transition-transform active:scale-95"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={shown} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.18 }}>
            <ServiceMark service={shown} className="h-6 w-6 shrink-0" />
          </motion.span>
        </AnimatePresence>
        {elsewhere && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-era-bg bg-emerald-400" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Play music on"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-40 mt-2 w-60 origin-top-right rounded-2xl border border-white/10 bg-neutral-950/95 p-1.5 text-white shadow-2xl backdrop-blur"
          >
            <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-[0.25em] text-white/50">Play on</p>
            {SERVICES.map((s) => (
              <button
                key={s.key}
                type="button"
                role="menuitemradio"
                aria-checked={picked === s.key}
                onClick={() => {
                  setListenOn(s.key);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-white/10"
              >
                <ServiceMark service={s.key} />
                <span className="flex-1">{s.label}</span>
                {picked === s.key && <span aria-hidden="true">&#10003;</span>}
              </button>
            ))}
            {elsewhere && (
              <p className="px-3 pb-2 pt-1 text-xs text-white/50">
                This song isn&apos;t on {labelOf(picked)}, so it&apos;s playing on {labelOf(playing)}.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
