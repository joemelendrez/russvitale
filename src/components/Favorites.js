"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_PALETTE } from "@/data/eras";
import { Reorder, useDragControls } from "framer-motion";
import { listenLink } from "@/data/players";
import { releaseKey } from "@/data/releaseKey";
import { setFavorites, useFavorites } from "@/lib/favorites";
import { clearNowPlaying, useListenOn } from "@/lib/listenOn";
import { ReleaseRow, useAllReleases } from "./Discography";
import FavoritesAccount from "./FavoritesAccount";
import ListenToggle from "./ListenToggle";
import MostLoved from "./MostLoved";
import { applyPalette } from "./usePalette";
import AlbumSwatches from "@/components/AlbumSwatches";

// YouTube turns up to 50 video ids into a playlist anyone can open, no sign-in.
const YOUTUBE_LIMIT = 50;

// The fan's favorites in their order: drag the handle (or use the arrow keys
// on it) to reorder, then play them here or take them to YouTube.
export default function Favorites() {
  const keys = useFavorites();
  const all = useAllReleases();
  const service = useListenOn();
  const [openKey, setOpenKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => applyPalette(DEFAULT_PALETTE), []);
  useEffect(() => () => clearNowPlaying("discography"), []);

  const byKey = useMemo(() => new Map(all.map((r) => [releaseKey(r), r])), [all]);
  // A favorite whose release left the site (a deleted drop) is skipped, not lost.
  const list = keys.filter((k) => byKey.has(k));

  const move = (key, by) => {
    const i = keys.indexOf(key);
    const j = i + by;
    if (i === -1 || j < 0 || j >= keys.length) return;
    const next = [...keys];
    [next[i], next[j]] = [next[j], next[i]];
    setFavorites(next);
  };

  const youtubeIds = list.map((k) => byKey.get(k).youtube).filter((y) => y?.kind === "video").map((y) => y.id);
  const youtubeHref = youtubeIds.length ? `https://www.youtube.com/watch_videos?video_ids=${youtubeIds.slice(0, YOUTUBE_LIMIT).join(",")}` : null;

  const copyList = async () => {
    const text = list
      .map((k, i) => {
        const r = byKey.get(k);
        return `${i + 1}. ${r.title} (${r.shownYear}) ${listenLink(r, service).href}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(`My Russ favorites\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <AlbumSwatches className="mb-6" />
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan archive</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">Your favorites</h1>
      <p className="mt-6 max-w-xl text-era-muted">
        Tap the heart on any song or album to save it here, then drag the handle to put them in your order. They&apos;re saved on this device.
      </p>
      <FavoritesAccount />

      {list.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-era-fg/10 p-8 text-center text-era-muted">
          Nothing saved yet.{" "}
          <Link href="/music" className="underline">
            Find songs on the full list
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {youtubeHref && (
              <a
                href={youtubeHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-era-accent px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-era-bg"
              >
                Play on YouTube as a playlist <span aria-hidden="true">&#8599;</span>
              </a>
            )}
            <button type="button" onClick={copyList} className="rounded-full border border-era-fg/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em]">
              {copied ? "Copied" : "Copy the list"}
            </button>
            <span className="ml-auto">
              <ListenToggle />
            </span>
          </div>
          <p className="mt-3 text-xs text-era-muted">
            {youtubeHref
              ? `The YouTube playlist has the ${Math.min(youtubeIds.length, YOUTUBE_LIMIT)} of your ${list.length} songs that have a YouTube video linked so far.`
              : "None of these has a YouTube video linked yet, so there's no YouTube playlist."}{" "}
            Spotify and SoundCloud don&apos;t let fan sites make playlists, so open each song there or copy the list.
          </p>

          <Reorder.Group axis="y" values={list} onReorder={setFavorites} as="ul" className="mt-6 divide-y divide-era-fg/10">
            {list.map((key, i) => (
              <FavoriteItem
                key={key}
                id={key}
                index={i}
                release={byKey.get(key)}
                open={openKey === key}
                onToggle={() => setOpenKey((k) => (k === key ? null : key))}
                onMove={(by) => move(key, by)}
              />
            ))}
          </Reorder.Group>
        </>
      )}

      {list.length > 0 && (
        <Link href="/top10" className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-era-fg/10 p-5 hover:border-era-accent">
          <span>
            <span className="block font-display text-2xl uppercase">Make your top 10</span>
            <span className="block text-sm text-era-muted">Pick 10 from these and share the picture.</span>
          </span>
          <span aria-hidden="true" className="text-2xl text-era-accent">
            &rarr;
          </span>
        </Link>
      )}

      <MostLoved />

      <p className="mt-16 text-xs leading-relaxed text-era-muted">
        An unofficial fan site, not affiliated with Russ, Diemon or any label. Music plays through the official Spotify, YouTube and SoundCloud
        players; nothing is hosted or sold here.
      </p>
    </div>
  );
}

function FavoriteItem({ id, index, release, open, onToggle, onMove }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={id} dragListener={false} dragControls={controls} className="flex items-start gap-2 bg-era-bg">
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            onMove(e.key === "ArrowUp" ? -1 : 1);
          }
        }}
        aria-label={`Move ${release.title}, number ${index + 1}. Use the up and down arrow keys.`}
        className="mt-5 flex h-10 w-8 shrink-0 cursor-grab touch-none flex-col items-center justify-center text-era-fg/40 hover:text-era-fg active:cursor-grabbing"
      >
        <span className="text-[10px] font-semibold tabular-nums">{index + 1}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="7" r="1.5" />
          <circle cx="15" cy="7" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="17" r="1.5" />
          <circle cx="15" cy="17" r="1.5" />
        </svg>
      </button>
      <div className="min-w-0 flex-1">
        <ReleaseRow as="div" release={release} open={open} editing={false} onToggle={onToggle} />
      </div>
    </Reorder.Item>
  );
}
