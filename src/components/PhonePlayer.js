"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { listenLink, playerFor } from "@/data/players";
import { releaseKey } from "@/data/releaseKey";
import { useSpotifyLinks } from "./SpotifyLinks";
import { clearNowPlaying, serviceOfPlayer, setNowPlaying, useListenOn } from "@/lib/listenOn";
import PlayerFrame from "./PlayerFrame";

// On phones a card is too small to hold a player, so tapping a cover
// plays it in one full-width bar pinned to the bottom of the screen instead.
// One player at a time: tapping another cover swaps it.
const PhonePlayerContext = createContext({ playing: null, play: () => {}, stop: () => {} });

export const PHONE_QUERY = "(max-width: 1023px)";

export function usePhonePlayer() {
  return useContext(PhonePlayerContext);
}

export function PhonePlayerProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const play = useCallback((release, palette) => setCurrent({ release, palette, key: releaseKey(release) }), []);
  const stop = useCallback(() => setCurrent(null), []);
  const value = useMemo(() => ({ playing: current?.key ?? null, play, stop }), [current, play, stop]);

  return (
    <PhonePlayerContext.Provider value={value}>
      {children}
      <PhonePlayerBar current={current} onClose={stop} />
    </PhonePlayerContext.Provider>
  );
}

function PhonePlayerBar({ current, onClose }) {
  const { editing } = useSpotifyLinks();
  const release = current?.release;
  const accent = current?.palette?.accent ?? "#fff";
  const service = useListenOn();
  const player = release && playerFor(release, service);
  const listen = release && listenLink(release, service);
  const playingOn = serviceOfPlayer(player);

  // The Play on button shows the service the bar is playing on.
  useEffect(() => {
    if (playingOn) setNowPlaying("phone", playingOn);
    else clearNowPlaying("phone");
  }, [playingOn, current]);

  return (
    <AnimatePresence>
      {release && (
        <m.div
          key="phone-player"
          initial={{ y: "120%" }}
          animate={{ y: 0 }}
          exit={{ y: "120%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          // Sits above the edit bar when edit mode is on.
          className={`fixed inset-x-2 z-[75] mx-auto max-w-xl rounded-2xl border border-white/10 bg-neutral-950/95 p-2 text-white shadow-2xl backdrop-blur lg:hidden ${editing ? "bottom-20" : "bottom-2"}`}
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          role="region"
          aria-label="Now playing"
        >
          <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
            <p className="min-w-0 truncate text-xs uppercase tracking-[0.2em]">
              <span style={{ color: accent }}>Now playing</span> <span className="text-white/70">&middot; {release.title}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close player"
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg leading-none active:bg-white/20"
            >
              &times;
            </button>
          </div>
          {player ? (
            <PlayerFrame player={player} title={release.title} autoplay />
          ) : (
            <a
              href={listen.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-4 py-4 text-sm font-semibold uppercase tracking-[0.15em]"
            >
              Find it on {listen.label}
              <span aria-hidden="true">&#8599;</span>
            </a>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
