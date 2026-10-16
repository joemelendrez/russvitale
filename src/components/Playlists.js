"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { applyPalette } from "./usePalette";
import { DEFAULT_PALETTE } from "@/data/eras";
import { playlistUrl } from "@/data/playlists";
import { playlistHref } from "@/data/albums";
import AlbumSwatches, { swatchAt } from "./AlbumSwatches";
import NewsletterForm from "./NewsletterForm";
import SpotifyEmbed from "./SpotifyEmbed";

// /playlists: fan-made Spotify playlists by mood. Each card loads Spotify's
// own player, so every play counts on Spotify.
export default function Playlists() {
  const [lists, setLists] = useState(() => (supabase ? null : []));
  // Each playlist's main color from its picture on Spotify, so the card
  // matches the cover people see there.
  const [covers, setCovers] = useState({});
  useEffect(() => applyPalette(DEFAULT_PALETTE), []);
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    supabase
      .from("russ_playlists")
      .select("id, title, blurb, spotify_id")
      .order("position")
      .order("created_at")
      .then(({ data }) => live && setLists(data ?? []));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const ids = (lists ?? []).map((l) => l.spotify_id).filter(Boolean);
    if (!ids.length) return;
    let live = true;
    fetch(`/playlists/covers.json?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d?.covers && setCovers(d.covers))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lists]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <AlbumSwatches className="mb-6" />
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan playlists</p>
      <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
        Russ for every <span className="text-era-accent">mood</span>
      </h1>
      <p className="mt-6 max-w-xl text-era-muted">
        Playlists a fan put together on Spotify, one for each mood. Press play here or follow them on Spotify.
      </p>

      {lists === null ? (
        <p className="mt-14 text-era-muted">Loading...</p>
      ) : lists.length === 0 ? (
        <div className="mt-14 rounded-3xl border border-era-fg/10 p-6 sm:p-10">
          <p className="font-display text-4xl uppercase leading-none sm:text-5xl">Playlists are on the way</p>
          <p className="mt-4 max-w-lg text-era-muted">Get them by email the day they go up, along with tour dates and new drops.</p>
          <div className="mt-8 max-w-xl">
            <NewsletterForm id="playlists-newsletter-email" />
          </div>
        </div>
      ) : (
        <ul className="mt-14 grid gap-6 md:grid-cols-2">
          {lists.map((list, i) => {
            const color = covers[list.spotify_id]?.color ?? swatchAt(i);
            return (
            <li key={list.id} className="cover-edge flex flex-col rounded-3xl border-2 p-5 transition-colors duration-500 sm:p-6" style={{ "--cover": color }}>
              <Link
                href={playlistHref(list.title)}
                className="cover-ink font-display text-4xl uppercase leading-none hover:underline"
                style={{ "--cover": color }}
              >
                {list.title}
              </Link>
              {list.blurb && <p className="mt-3 text-era-muted">{list.blurb}</p>}
              <SpotifyEmbed id={list.spotify_id} title={list.title} className="mt-5" />
              <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={playlistHref(list.title)}
                className="rounded-full border border-era-fg/30 px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors hover:border-era-fg hover:bg-era-fg hover:text-era-bg"
              >
                See the songs <span aria-hidden="true">&rarr;</span>
              </Link>
              <a
                href={playlistUrl(list.spotify_id)}
                target="_blank"
                rel="noreferrer"
                className=" rounded-full border border-era-fg/30 px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors hover:border-era-fg hover:bg-era-fg hover:text-era-bg"
              >
                Follow on Spotify <span aria-hidden="true">&#8599;</span>
              </a>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <p className="mt-16 text-xs leading-relaxed text-era-muted">
        Unofficial fan playlists, not affiliated with Russ, Diemon or any label. Music plays through Spotify&apos;s official player; nothing is hosted
        or sold here.
      </p>
    </div>
  );
}
