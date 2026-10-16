"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PLAYLIST_IDEAS, playlistIdFromLink, playlistUrl } from "@/data/playlists";
import { CATALOG_RELEASES } from "@/data/releaseKey";
import { swatchAt } from "./AlbumSwatches";
import AppIcon from "./AppIcon";

// A starter list's songs with their Spotify track links, from the catalog.
function starterSongs(titles) {
  return titles.map((title) => {
    const r = CATALOG_RELEASES.find((x) => x.title === title);
    return { title, url: r?.spotify?.kind === "track" ? `https://open.spotify.com/track/${r.spotify.id}` : null };
  });
}

// The songs for a mood: open it to see them, then copy the names or the
// Spotify links into a playlist maker.
function SongsToCopy({ songs }) {
  const [copied, setCopied] = useState(null);
  const copy = async (what) => {
    const text = what === "links" ? songs.filter((s) => s.url).map((s) => s.url).join("\n") : songs.map((s) => `${s.title} - Russ`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };
  return (
    <details className="group mt-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white">
        <AppIcon name="music" className="h-3.5 w-3.5" /> {songs.length} starter songs
        <span className="inline-block transition-transform group-open:rotate-180" aria-hidden="true">
          &#9662;
        </span>
      </summary>
      <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-sm text-white/80">
        {songs.map((s) => (
          <li key={s.title}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                {s.title}
              </a>
            ) : (
              s.title
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <button type="button" onClick={() => copy("names")} className="rounded-full bg-white px-3 py-1.5 text-black">
          {copied === "names" ? "Copied" : "Copy song names"}
        </button>
        <button type="button" onClick={() => copy("links")} className="rounded-full border border-white/20 px-3 py-1.5">
          {copied === "links" ? "Copied" : "Copy Spotify links"}
        </button>
      </div>
    </details>
  );
}

// One mood: its playlist link right on the card, saved with one tap. A
// starter mood without a link yet is added to the site when its link is saved.
function MoodCard({ row, idea, color, nextPosition, onSaved, onEdit, onRemove, onUp, onDown }) {
  const saved = row ? playlistUrl(row.spotify_id) : "";
  const [link, setLink] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const title = row?.title ?? idea.title;
  const blurb = row ? row.blurb : idea.blurb;
  const songs = idea ? starterSongs(idea.songs) : null;
  const changed = link.trim() !== saved;

  const save = async (e) => {
    e.preventDefault();
    const spotify_id = playlistIdFromLink(link);
    if (!spotify_id) return setError("That isn't a Spotify playlist link. On Spotify: ⋯ › Share › Copy link to playlist.");
    setBusy(true);
    setError(null);
    const { error } = row
      ? await supabase.from("russ_playlists").update({ spotify_id }).eq("id", row.id)
      : await supabase.from("russ_playlists").insert({ title: idea.title, blurb: idea.blurb || null, spotify_id, position: nextPosition });
    setBusy(false);
    if (error) return setError("Couldn't save that link. Are you still signed in?");
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    onSaved();
  };

  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-black" style={{ background: color }}>
          <AppIcon name="list-music" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{title}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                row ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-300"
              }`}
            >
              {row ? "On the site" : "Needs a link"}
            </span>
          </div>
          {blurb && <p className="truncate text-xs text-white/50">{blurb}</p>}
        </div>
        {row && (
          <div className="flex shrink-0 items-center gap-1 text-sm">
            <button type="button" onClick={onUp} disabled={!onUp} aria-label={`Move ${title} up`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 disabled:opacity-25">
              &uarr;
            </button>
            <button type="button" onClick={onDown} disabled={!onDown} aria-label={`Move ${title} down`} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10 disabled:opacity-25">
              &darr;
            </button>
          </div>
        )}
      </div>

      <form onSubmit={save} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor={`pl-${title}`}>
          Spotify playlist link for {title}
        </label>
        <input
          id={`pl-${title}`}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          inputMode="url"
          placeholder="Paste the Spotify playlist link"
          className={`${input} min-w-0 flex-1`}
        />
        <button type="submit" disabled={busy || !changed || !link.trim()} className="shrink-0 rounded-lg bg-white px-4 text-sm font-semibold text-black disabled:opacity-40">
          {busy ? "Saving..." : done ? "Saved" : row ? "Update" : "Save"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {row && (
          <>
            <a href={saved} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/60 hover:text-white">
              Open on Spotify <AppIcon name="external-link" className="h-3 w-3" />
            </a>
            <button type="button" onClick={onEdit} className="font-semibold text-white/70 hover:text-white">
              Rename
            </button>
            <button type="button" onClick={onRemove} className="text-red-400 hover:underline">
              Remove
            </button>
          </>
        )}
      </div>
      {songs && <SongsToCopy songs={songs} />}
    </li>
  );
}

const input = "w-full rounded-lg [color-scheme:dark] border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30";
const primary = "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40";
const empty = { title: "", blurb: "", link: "" };

// The mood playlists on /playlists: add one by pasting its Spotify link,
// edit, move up or down, or remove it.
export default function PlaylistsAdmin({ onChange }) {
  const [lists, setLists] = useState(null);
  const [editing, setEditing] = useState(null); // a playlist id, or "new"
  const [form, setForm] = useState(empty);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("russ_playlists").select("*").order("position").order("created_at");
    if (error) setError("Couldn't load playlists.");
    else {
      setLists(data);
      onChange?.(data.length);
    }
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const open = (row) => {
    setError(null);
    setEditing(row?.id ?? "new");
    setForm(row ? { title: row.title, blurb: row.blurb ?? "", link: playlistUrl(row.spotify_id) } : empty);
  };

  const save = async (e) => {
    e.preventDefault();
    const spotify_id = playlistIdFromLink(form.link);
    if (!spotify_id) return setError("Paste the playlist's Spotify link (Share › Copy link to playlist).");
    if (!form.title.trim()) return setError("Give it a mood name.");
    setBusy(true);
    setError(null);
    const row = { title: form.title.trim(), blurb: form.blurb.trim() || null, spotify_id };
    const position = (lists ?? []).reduce((m, l) => Math.max(m, l.position), 0) + 1;
    const { error } =
      editing === "new"
        ? await supabase.from("russ_playlists").insert({ ...row, position })
        : await supabase.from("russ_playlists").update(row).eq("id", editing);
    setBusy(false);
    if (error) return setError("Couldn't save that playlist. Are you still signed in?");
    setEditing(null);
    load();
  };

  const remove = async (row) => {
    if (!window.confirm(`Remove "${row.title}" from the site?`)) return;
    const { error } = await supabase.from("russ_playlists").delete().eq("id", row.id);
    if (error) setError("Couldn't remove that playlist.");
    load();
  };

  // Swaps a playlist with its neighbor, renumbering everything so ties can't stick.
  const move = async (i, by) => {
    const next = [...lists];
    const j = i + by;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setLists(next);
    const results = await Promise.all(next.map((l, n) => supabase.from("russ_playlists").update({ position: n }).eq("id", l.id)));
    if (results.some((r) => r.error)) setError("Couldn't save the new order.");
    load();
  };

  const editForm = (
    <form onSubmit={save} className="space-y-3 rounded-2xl border border-white/15 p-4">
      <label className="block text-sm text-white/70">
        Mood
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={60} placeholder="Gym" className={`${input} mt-1`} />
      </label>
      <label className="block text-sm text-white/70">
        One line about it (optional)
        <input value={form.blurb} onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))} maxLength={200} className={`${input} mt-1`} />
      </label>
      <label className="block text-sm text-white/70">
        Spotify playlist link
        <input
          value={form.link}
          onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
          inputMode="url"
          placeholder="https://open.spotify.com/playlist/..."
          className={`${input} mt-1`}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={primary}>
          {busy ? "Saving..." : "Save playlist"}
        </button>
        <button type="button" onClick={() => setEditing(null)} className="px-3 text-sm text-white/60">
          Cancel
        </button>
      </div>
    </form>
  );

  const ideaFor = (title) => PLAYLIST_IDEAS.find((idea) => idea.title.toLowerCase() === title.trim().toLowerCase());
  const waiting = PLAYLIST_IDEAS.filter((idea) => !(lists ?? []).some((l) => l.title.trim().toLowerCase() === idea.title.toLowerCase()));
  const nextPosition = (lists ?? []).reduce((m, l) => Math.max(m, l.position), 0) + 1;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Playlists</h2>
      <p className="text-sm text-white/70">
        Paste each mood&apos;s Spotify playlist link and tap Save. It shows on{" "}
        <a href="/playlists" className="underline">
          /playlists
        </a>{" "}
        with Spotify&apos;s own player, so plays count on Spotify.
      </p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {lists === null ? (
        <p className="mt-4 text-sm text-white/60">Loading...</p>
      ) : (
        <>
          {lists.length > 0 && (
            <>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">On the site</p>
              <ul className="mt-3 space-y-3">
                {lists.map((row, i) =>
                  editing === row.id ? (
                    <li key={row.id}>{editForm}</li>
                  ) : (
                    <MoodCard
                      key={`${row.id}-${row.spotify_id}`}
                      row={row}
                      idea={ideaFor(row.title)}
                      color={swatchAt(i)}
                      onSaved={load}
                      onEdit={() => open(row)}
                      onRemove={() => remove(row)}
                      onUp={i > 0 ? () => move(i, -1) : null}
                      onDown={i < lists.length - 1 ? () => move(i, 1) : null}
                    />
                  )
                )}
              </ul>
            </>
          )}
          {waiting.length > 0 && (
            <>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">Waiting for a link</p>
              <p className="mt-1 text-xs text-white/50">Copy the starter songs into your playlist maker, make it on Spotify, then paste its link here.</p>
              <ul className="mt-3 space-y-3">
                {waiting.map((idea, i) => (
                  <MoodCard key={idea.title} idea={idea} color={swatchAt(lists.length + i)} nextPosition={nextPosition} onSaved={load} />
                ))}
              </ul>
            </>
          )}
          <div className="mt-6">
            {editing === "new" ? (
              editForm
            ) : (
              <button type="button" onClick={() => open(null)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
                <AppIcon name="plus" className="h-4 w-4" /> Add your own mood
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
