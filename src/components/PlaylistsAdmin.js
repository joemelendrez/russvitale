"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PLAYLIST_IDEAS, playlistIdFromLink, playlistUrl } from "@/data/playlists";
import { CATALOG_RELEASES } from "@/data/releaseKey";

// A starter list's songs with their Spotify track links, from the catalog.
function starterSongs(titles) {
  return titles.map((title) => {
    const r = CATALOG_RELEASES.find((x) => x.title === title);
    return { title, url: r?.spotify?.kind === "track" ? `https://open.spotify.com/track/${r.spotify.id}` : null };
  });
}

// One mood's starter list: open it to see the songs, copy the names or the
// Spotify links into a playlist maker, or start the playlist form with it.
function StarterList({ idea, onUse }) {
  const [copied, setCopied] = useState(null);
  const songs = starterSongs(idea.songs);
  const copy = async (what) => {
    const text = what === "links" ? songs.filter((s) => s.url).map((s) => s.url).join("\n") : songs.map((s) => `${s.title} - Russ`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };
  return (
    <details className="group rounded-xl border border-white/10 px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="font-semibold">{idea.title}</span>
        <span className="text-xs text-white/50">
          {songs.length} songs <span className="inline-block transition-transform group-open:rotate-180" aria-hidden="true">&#9662;</span>
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
        <button type="button" onClick={onUse} className="rounded-full border border-white/20 px-3 py-1.5">
          Add it here once made
        </button>
      </div>
    </details>
  );
}

const input = "w-full rounded-lg [color-scheme:dark] border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30";
const primary = "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40";
const empty = { title: "", blurb: "", link: "" };

// The mood playlists on /playlists: add one by pasting its Spotify link,
// edit, move up or down, or remove it.
export default function PlaylistsAdmin() {
  const [lists, setLists] = useState(null);
  const [editing, setEditing] = useState(null); // a playlist id, or "new"
  const [form, setForm] = useState(empty);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("russ_playlists").select("*").order("position").order("created_at");
    if (error) setError("Couldn't load playlists.");
    else setLists(data);
  }, []);

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

  const open = (row, idea) => {
    setError(null);
    setEditing(row?.id ?? "new");
    setForm(row ? { title: row.title, blurb: row.blurb ?? "", link: playlistUrl(row.spotify_id) } : { ...empty, ...idea });
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

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Playlists</h2>
      <p className="text-sm text-white/70">
        Make a playlist on Spotify, then paste its link here. It shows on{" "}
        <a href="/playlists" className="underline">
          /playlists
        </a>{" "}
        with Spotify&apos;s own player, so plays count on Spotify.
      </p>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {lists === null ? (
        <p className="mt-4 text-sm text-white/60">Loading...</p>
      ) : (
        lists.length > 0 && (
          <ul className="mt-4 divide-y divide-white/10">
            {lists.map((row, i) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.title}</p>
                  {row.blurb && <p className="truncate text-xs text-white/50">{row.blurb}</p>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${row.title} up`} className="disabled:opacity-30">
                    &uarr;
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === lists.length - 1} aria-label={`Move ${row.title} down`} className="disabled:opacity-30">
                    &darr;
                  </button>
                  <button type="button" onClick={() => open(row)} className="font-semibold hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(row)} className="text-red-400 hover:underline">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {editing ? (
        <form onSubmit={save} className="mt-4 space-y-3">
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
      ) : (
        <div className="mt-4">
          <button type="button" onClick={() => open(null)} className={primary}>
            Add a playlist
          </button>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Starter song lists</p>
            <p className="mt-1 text-xs text-white/50">Copy a list into your playlist maker, make it on Spotify, then add its link here.</p>
            <div className="mt-3 space-y-2">
              {PLAYLIST_IDEAS.map((idea) => (
                <StarterList key={idea.title} idea={idea} onUse={() => open(null, { title: idea.title, blurb: idea.blurb })} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
