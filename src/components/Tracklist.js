"use client";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { fmtLength } from "@/data/tracklists";
import PlayerFrame from "./PlayerFrame";

const trackPlayer = (id) => ({
  key: `spotify-track-${id}`,
  label: "Spotify",
  src: `https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`,
  height: 80,
  spotify: { kind: "track", id },
});

// An album's songs. Tapping one opens Spotify's own player for it under the
// row (one at a time); other artists on a song, and the album it's from
// (`from`, on playlist pages), show under its title. Songs named in
// `highlight` (the ones a search found) stand out.
export default function Tracklist({ tracks, title, compact = false, highlight }) {
  const [open, setOpen] = useState(null);
  if (!tracks.length) return null;
  return (
    <ol className="divide-y divide-era-fg/10">
      {tracks.map((t) => {
        const others = t.artists
          .split(", ")
          .filter((a) => a !== "Russ")
          .join(", ");
        const isOpen = open === t.trackId;
        const hit = highlight?.includes(t.title);
        return (
          <li key={t.trackId}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : t.trackId)}
              aria-expanded={isOpen}
              className={`flex w-full items-center gap-4 text-left transition-colors hover:text-era-accent ${compact ? "py-2.5" : "py-3"}`}
            >
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-era-muted">{t.n}</span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate ${compact ? "text-sm" : "font-semibold"} ${hit ? "font-semibold text-era-accent" : ""}`}>
                  {t.title}
                  {hit && <span className="sr-only"> (matches your search)</span>}
                </span>
                {(others || t.from) && (
                  <span className="block truncate text-xs text-era-muted">
                    {[others && `with ${others}`, t.from && `from ${t.from}`].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-era-muted">{fmtLength(t.seconds)}</span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                style={isOpen ? { background: "var(--accent)", color: "var(--bg)" } : { border: "1px solid color-mix(in srgb, var(--fg) 20%, transparent)" }}
                aria-hidden="true"
              >
                {isOpen ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </span>
              <span className="sr-only">{isOpen ? `Close ${t.title}` : `Play ${t.title}${title ? ` from ${title}` : ""}`}</span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-3 pl-10">
                    <PlayerFrame player={trackPlayer(t.trackId)} title={t.title} autoplay />
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
