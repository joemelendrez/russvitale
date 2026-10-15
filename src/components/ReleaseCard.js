"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { listenLink, playerFor } from "@/data/players";
import { releaseKey } from "@/data/releaseKey";
import { CoverEditor, SpotifyLinkEditor, useRelease, useSpotifyLinks } from "./SpotifyLinks";
import { serviceOfPlayer, setNowPlaying, useListenOn } from "@/lib/listenOn";
import PlayerFrame from "./PlayerFrame";
import FavoriteButton from "./FavoriteButton";
import { PHONE_QUERY, usePhonePlayer } from "./PhonePlayer";

const TYPE_LABEL = { album: "Album", ep: "EP", single: "Single" };

// Album or single. On desktop, hover flips the cover into a player on the
// listener's service (Spotify, YouTube Music or SoundCloud);
// the iframe only loads the first time someone asks for it, so the page stays
// light with a dozen of these on screen. On phones and tablets a tap plays it
// in the full-width bar at the bottom of the screen (PhonePlayer.js).
export default function ReleaseCard({ release: baseRelease, palette, index }) {
  const release = useRelease(baseRelease);
  const { editing } = useSpotifyLinks();
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Hovering only shows the player; clicking the cover also starts it.
  const [autoplay, setAutoplay] = useState(false);
  const ref = useRef(null);
  const pointerType = useRef(null);
  const phone = usePhonePlayer();
  const playingOnPhone = phone.playing === releaseKey(release);
  const lit = active || playingOnPhone;

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(useTransform(ry, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(rx, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const service = useListenOn();
  const player = playerFor(release, service);
  const listen = listenLink(release, service);

  const open = () => {
    setActive(true);
    setMounted(true);
    // The Play on button switches to the service this card plays on.
    if (player) setNowPlaying(releaseKey(release), serviceOfPlayer(player));
  };

  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    rx.set((e.clientX - r.left) / r.width - 0.5);
    ry.set((e.clientY - r.top) / r.height - 0.5);
  };

  const onPointerEnter = (e) => {
    if (e.pointerType === "mouse") open();
  };

  const onPointerLeave = (e) => {
    if (e.pointerType !== "mouse") return;
    setActive(false);
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, delay: (index % 2) * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group [perspective:900px]"
      data-missing-spotify={editing && !player ? "" : undefined}
    >
      <motion.div
        ref={ref}
        style={{ rotateX, rotateY }}
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <button
          type="button"
          onPointerDown={(e) => (pointerType.current = e.pointerType)}
          onClick={() => {
            const touch = pointerType.current !== "mouse" && window.matchMedia(PHONE_QUERY).matches;
            if (touch) {
              pointerType.current = null;
              if (playingOnPhone) phone.stop();
              else phone.play(release, palette);
              return;
            }
            // A mouse already opened it on hover, so a click shouldn't close it.
            if (pointerType.current === "mouse" || !active) {
              open();
              setAutoplay(true);
            } else setActive(false);
            pointerType.current = null;
          }}
          aria-label={`${lit ? "Stop" : "Play"} ${release.title}`}
          aria-pressed={lit}
          className="absolute inset-0 z-10 block h-full w-full cursor-pointer"
        >
          <motion.div
            animate={{ scale: lit ? 1.06 : 1, filter: lit ? "brightness(0.55)" : "brightness(1)" }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {release.cover ? (
              <Image src={release.cover} alt={`${release.title} cover`} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
            ) : (
              <GeneratedCover release={release} palette={palette} spinning={lit} />
            )}
          </motion.div>

          <AnimatePresence>
            {lit && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                className="absolute left-1/2 top-[30%] hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full lg:flex"
                style={{ background: palette.accent, color: palette.bg }}
              >
                {playingOnPhone ? (
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Phones and tablets: a play button always in the middle of the cover. */}
          <span
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-colors lg:hidden"
            style={playingOnPhone ? { background: palette.accent, color: palette.bg } : { background: "rgba(0,0,0,0.45)", color: "#fff" }}
            aria-hidden="true"
          >
            {playingOnPhone ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </span>
        </button>

        {/* Player tray */}
        <motion.div
          initial={false}
          animate={{ y: active ? "0%" : "150%" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-2 bottom-2 z-20"
        >
          {player ? (
            mounted && <PlayerFrame player={player} title={release.title} lazy autoplay={autoplay} />
          ) : (
            <a
              href={listen.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl bg-black/75 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white backdrop-blur"
            >
              Find it on {listen.label}
              <span aria-hidden="true">&#8599;</span>
            </a>
          )}
        </motion.div>
      </motion.div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="line-clamp-2 text-base font-semibold leading-snug sm:text-lg" title={release.title}>{release.title}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: palette.muted }}>
            {TYPE_LABEL[release.type]} &middot; {release.year}
          </p>
        </div>
        <a
          href={listen.href}
          target="_blank"
          rel="noreferrer"
          className="mt-1 hidden shrink-0 text-xs uppercase tracking-[0.2em] opacity-60 sm:block transition-opacity hover:opacity-100"
          aria-label={`Open ${release.title} in ${listen.label}`}
        >
          {listen.label} &#8599;
        </a>
        <FavoriteButton release={release} className="-mr-2 -mt-1" />
      </div>
      {editing && <CoverEditor release={release} />}
      {editing && <SpotifyLinkEditor key={`${service}-${player?.key ?? "none"}`} release={release} />}
    </motion.article>
  );
}

// Stand-in artwork: a record in the era's colors with the title set big.
function GeneratedCover({ release, palette, spinning }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: palette.bg }}>
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(120% 90% at 85% 10%, ${palette.accent}55, transparent 55%), radial-gradient(90% 90% at 0% 100%, ${palette.accent}22, transparent 60%)`,
        }}
      />
      <motion.div
        animate={{ rotate: spinning ? 360 : 0 }}
        transition={spinning ? { duration: 6, repeat: Infinity, ease: "linear" } : { duration: 0.6 }}
        className="absolute -right-[22%] -top-[22%] aspect-square w-[85%] rounded-full"
        style={{
          background: `repeating-radial-gradient(circle at center, ${palette.fg}14 0 1px, transparent 1px 7px), radial-gradient(circle at center, ${palette.accent} 0 16%, ${palette.bg} 16.5% 18%, #000 18.5%)`,
        }}
      />
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5" style={{ color: palette.fg }}>
        <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: palette.accent }}>
          Russ
        </p>
        <p className="mt-1 font-display text-2xl uppercase leading-[0.95] sm:text-3xl">{release.title}</p>
      </div>
    </div>
  );
}
