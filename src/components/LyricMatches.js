"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { sameSong } from "@/data/catalog";
import { albumForSong, albumHref } from "@/data/albums";

// A search that reads like a line from a song (three words or more) also asks
// Genius which Russ song it's from. Only titles come back; the lyrics stay on
// Genius, linked from each match.
export const looksLikeLyric = (q) => q.trim().split(/\s+/).length >= 3 && q.trim().length >= 6;

export default function LyricMatches({ query, releases, onOpen, onMatches }) {
  const q = query.trim().replace(/\s+/g, " ");
  const active = looksLikeLyric(q);
  const [result, setResult] = useState({ q: "", songs: [], error: null });

  useEffect(() => {
    if (!active) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lyrics-search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!live) return;
        const songs = res.ok ? data.songs ?? [] : [];
        if (data.available === false) setResult({ q, songs: [], error: null, off: true });
        else setResult({ q, songs, error: res.ok ? null : data.error });
        // The list above counts and shows these songs too.
        onMatches?.(q, songs.map((song) => song.title));
      } catch {
        if (!live) return;
        setResult({ q, songs: [], error: "Couldn't check the lyrics right now." });
        onMatches?.(q, []);
      }
    }, 600);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!active || result.off) return null;
  const done = result.q === q;

  return (
    <section className="mt-6 rounded-2xl border border-era-fg/10 p-4 sm:p-5" aria-live="polite" aria-label="Songs with that line">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-era-muted">From the lyrics</p>
      {!done && <p className="mt-2 text-sm text-era-muted">Checking which song that line is from…</p>}
      {done && result.error && <p className="mt-2 text-sm text-era-muted">{result.error}</p>}
      {done && !result.error && result.songs.length === 0 && <p className="mt-2 text-sm text-era-muted">No Russ song found with that line.</p>}
      {done && result.songs.length > 0 && (
        <ul className="mt-2 divide-y divide-era-fg/10">
          {result.songs.map((song) => {
            const release = releases.find((r) => r.type !== "version" && sameSong(r.title, song.title));
            const album = release ? null : albumForSong(song.title);
            return (
              <li key={`${song.title}-${song.url}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
                <span className="w-full min-w-0 sm:w-auto sm:flex-1">
                  <span className="font-display text-xl uppercase leading-tight [overflow-wrap:anywhere]">{song.title}</span>
                  {song.artists && song.artists.toLowerCase() !== "russ" && <span className="ml-2 text-xs text-era-muted">{song.artists}</span>}
                </span>
                {release && (
                  <button type="button" onClick={() => onOpen(release)} className="text-xs font-semibold uppercase tracking-[0.15em] text-era-accent hover:underline">
                    Play it
                  </button>
                )}
                {album && (
                  <Link href={albumHref(album)} className="text-xs font-semibold uppercase tracking-[0.15em] text-era-accent hover:underline">
                    On {album.title}
                  </Link>
                )}
                {song.url && (
                  <a href={song.url} target="_blank" rel="noopener noreferrer" className="text-xs uppercase tracking-[0.15em] text-era-muted hover:text-era-fg">
                    Lyrics on Genius <span aria-hidden="true">&#8599;</span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
