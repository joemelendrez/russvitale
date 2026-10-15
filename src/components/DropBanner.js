"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { spotifyEmbedUrl, spotifyLink } from "@/data/eras";
import { bannerDrop, dropToRelease } from "@/data/drops";
import { useSpotifyLinks } from "./SpotifyLinks";

const DISMISSED_KEY = "russ-drop-dismissed";

function wasDismissed(id) {
  try {
    return localStorage.getItem(DISMISSED_KEY) === id;
  } catch {
    return false;
  }
}

function formatDay(day) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// "New drop" notification: slides down under the menu a moment after the page
// opens, once per drop per device. Play opens the Spotify player right in it.
export default function DropBanner() {
  const { drops } = useSpotifyLinks();
  const drop = bannerDrop(drops);
  const [shown, setShown] = useState(null);
  const [playing, setPlaying] = useState(false);
  const onAdmin = usePathname()?.startsWith("/admin");

  useEffect(() => {
    if (!drop || wasDismissed(drop.id)) return;
    const t = setTimeout(() => setShown(drop.id), 1200);
    return () => clearTimeout(t);
  }, [drop]);

  const close = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, drop.id);
    } catch {}
    setShown(null);
    setPlaying(false);
  };

  const release = drop && dropToRelease(drop);
  const visible = drop && shown === drop.id && !onAdmin;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key={drop.id}
          initial={{ y: "-130%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-130%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-x-2 top-[4.5rem] z-[60] mx-auto max-w-md rounded-2xl border border-white/10 bg-neutral-950/95 p-3 text-white shadow-2xl backdrop-blur sm:inset-x-auto sm:right-6"
          aria-label="New drop"
        >
          <div className="flex items-start gap-3">
            <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-era-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-era-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-era-accent">New drop &middot; {formatDay(drop.released_on)}</p>
              <p className="mt-1 truncate font-display text-2xl uppercase leading-none">{drop.title}</p>
              {drop.note && <p className="mt-1 text-sm text-white/70">{drop.note}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {release.spotify ? (
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="rounded-full bg-era-accent px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-era-bg"
                  >
                    {playing ? "Hide player" : "Play it"}
                  </button>
                ) : null}
                <a
                  href={spotifyLink(release)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
                >
                  Spotify &#8599;
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none hover:bg-white/20"
            >
              &times;
            </button>
          </div>
          {playing && release.spotify && (
            <iframe
              title={`${drop.title} on Spotify`}
              src={spotifyEmbedUrl(release.spotify)}
              height={release.spotify.kind === "album" ? 152 : 80}
              className="mt-3 block w-full rounded-xl border-0 bg-black/60"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
