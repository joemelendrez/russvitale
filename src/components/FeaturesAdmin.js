"use client";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FEATURES } from "@/data/features";
import { sameSong } from "@/data/catalog";
import { playerColumnsFromLinks, rowLink, rowYoutubeLink } from "@/data/players";

const input = "w-full rounded-lg [color-scheme:dark] border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30";
const primary = "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40";

function formatDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) return date ?? "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// Every feature as the site shows it: the built-in list with admin changes
// applied, then features added from admin. Each row knows the built-in it
// comes from (`builtin`) and the drop that changes it (`drop`).
function featureRows(drops) {
  const added = drops.filter((d) => d.release_type === "feature");
  const rows = FEATURES.map((f) => {
    const drop = added.find((d) => sameSong(d.replaces ?? d.title, f.title));
    return {
      key: `b-${f.title}`,
      builtin: f,
      drop,
      title: drop?.title ?? f.title,
      artist: drop?.artist ?? f.artist,
      date: drop?.released_on ?? f.date,
      hidden: Boolean(drop?.hidden),
      spotify: drop?.spotify_id ? true : Boolean(f.spotify),
      youtube: Boolean(drop?.youtube_id),
    };
  });
  for (const d of added) {
    if (rows.some((r) => r.drop === d)) continue;
    rows.push({ key: d.id, builtin: null, drop: d, title: d.title, artist: d.artist, date: d.released_on, hidden: false, spotify: Boolean(d.spotify_id || d.soundcloud_url), youtube: Boolean(d.youtube_id) });
  }
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

const formFor = (row) => ({
  title: row?.title ?? "",
  artist: row?.artist ?? "",
  released_on: /^\d{4}-\d{2}-\d{2}$/.test(row?.date ?? "") ? row.date : row?.date ? `${row.date}-01-01` : "",
  link: row?.drop && (row.drop.spotify_id || row.drop.soundcloud_url) ? rowLink(row.drop) : row?.builtin?.spotify ? `https://open.spotify.com/track/${row.builtin.spotify.id}` : "",
  youtube: row?.drop ? rowYoutubeLink(row.drop) : "",
});

// Songs Russ is featured on: add new ones, fix a title, artist, date or
// link, or hide one. Built-in features are changed by a drop that stands in
// for them, so "Undo changes" brings back the original.
export default function FeaturesAdmin({ drops, onSaved }) {
  const rows = useMemo(() => featureRows(drops), [drops]);
  const [editing, setEditing] = useState(null); // a row key, or "new"
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const run = async (key, action, failure) => {
    setError(null);
    setBusy(key);
    const { error } = await action();
    setBusy(null);
    if (error) return setError(failure);
    setEditing(null);
    onSaved();
  };

  const hide = (row) =>
    run(row.key, () =>
      row.drop
        ? supabase.from("russ_drops").update({ hidden: true }).eq("id", row.drop.id)
        : supabase.from("russ_drops").insert({
            title: row.title,
            artist: row.artist,
            release_type: "feature",
            replaces: row.builtin.title,
            hidden: true,
            released_on: formFor(row).released_on,
            show_banner: false,
          }),
      "Couldn't hide it."
    );

  const show = (row) => run(row.key, () => supabase.from("russ_drops").update({ hidden: false }).eq("id", row.drop.id), "Couldn't show it.");

  // Undo for a built-in (drops the stand-in), delete for one added here.
  const remove = (row) => {
    const ask = row.builtin ? `Undo your changes to "${row.builtin.title}"?` : `Delete "${row.title}"? It leaves the site for everyone.`;
    if (!window.confirm(ask)) return;
    run(row.key, () => supabase.from("russ_drops").delete().eq("id", row.drop.id), "Couldn't change it.");
  };

  const shown = rows.filter((r) => !r.hidden).length;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Features</h2>
        <button type="button" onClick={() => setEditing("new")} className={primary}>
          Add a feature
        </button>
      </div>
      <p className="mb-4 text-sm text-white/60">
        {shown} songs Russ is featured on show on /music under the Features filter. Covers are added from edit mode on /music.
      </p>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {editing === "new" && <FeatureForm onCancel={() => setEditing(null)} onSaved={() => (setEditing(null), onSaved())} />}

      <ul className="divide-y divide-white/10">
        {rows.map((row) =>
          editing === row.key ? (
            <li key={row.key} className="py-4">
              <FeatureForm row={row} onCancel={() => setEditing(null)} onSaved={() => (setEditing(null), onSaved())} />
            </li>
          ) : (
            <li key={row.key} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${row.hidden ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="truncate font-semibold">{row.title}</p>
                <p className="text-xs text-white/50">
                  {row.artist} feat. Russ · {formatDate(row.date)}
                  {row.spotify ? " · Spotify" : " · no player"}
                  {row.youtube ? " · YouTube" : ""}
                  {row.hidden ? " · hidden" : row.builtin && row.drop ? " · edited" : !row.builtin ? " · added" : ""}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {row.hidden ? (
                  <button type="button" disabled={busy === row.key} onClick={() => show(row)} className="font-semibold hover:underline">
                    Show again
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setEditing(row.key)} className="font-semibold hover:underline">
                      Edit
                    </button>
                    {row.builtin && (
                      <button type="button" disabled={busy === row.key} onClick={() => hide(row)} className="hover:underline">
                        Hide
                      </button>
                    )}
                    {row.drop && (
                      <button type="button" disabled={busy === row.key} onClick={() => remove(row)} className="text-red-400 hover:underline">
                        {row.builtin ? "Undo changes" : "Delete"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );
}

function FeatureForm({ row, onSaved, onCancel }) {
  const [form, setForm] = useState(() => formFor(row));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const id = row?.key ?? "new";
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const ready = form.title.trim() && form.artist.trim() && /^\d{4}-\d{2}-\d{2}$/.test(form.released_on);

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus("saving");
    let players;
    try {
      players = await playerColumnsFromLinks(form.link, form.youtube);
    } catch (err) {
      setStatus(null);
      return setError(err.message);
    }
    const fields = {
      title: form.title.trim(),
      artist: form.artist.trim().replace(/\s+feat\.?\s+russ$/i, ""),
      released_on: form.released_on,
      ...players,
    };
    const { error } = row?.drop
      ? await supabase.from("russ_drops").update(fields).eq("id", row.drop.id)
      : await supabase.from("russ_drops").insert({
          ...fields,
          release_type: "feature",
          replaces: row?.builtin?.title ?? null,
          show_banner: false,
        });
    setStatus(null);
    if (error) return setError("Couldn't save it. Check the fields and try again.");
    onSaved();
  };

  return (
    <form onSubmit={save} className="mb-4 space-y-4 rounded-xl border border-white/10 p-4">
      <p className="font-semibold">{row ? `Edit "${row.title}"` : "Add a song Russ is featured on"}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`f-title-${id}`} className="mb-1 block text-sm text-white/70">
            Song title (without &quot;feat. Russ&quot;)
          </label>
          <input id={`f-title-${id}`} required maxLength={120} value={form.title} onChange={set("title")} className={input} />
        </div>
        <div>
          <label htmlFor={`f-artist-${id}`} className="mb-1 block text-sm text-white/70">
            Lead artist(s)
          </label>
          <input id={`f-artist-${id}`} required maxLength={160} value={form.artist} onChange={set("artist")} placeholder="Logic" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor={`f-date-${id}`} className="mb-1 block text-sm text-white/70">
          Release date
        </label>
        <input id={`f-date-${id}`} type="date" required value={form.released_on} onChange={set("released_on")} className={input} />
      </div>
      <div>
        <label htmlFor={`f-link-${id}`} className="mb-1 block text-sm text-white/70">
          Spotify or SoundCloud link (Share › Copy link)
        </label>
        <input id={`f-link-${id}`} inputMode="url" value={form.link} onChange={set("link")} placeholder="https://open.spotify.com/track/..." className={input} />
      </div>
      <div>
        <label htmlFor={`f-yt-${id}`} className="mb-1 block text-sm text-white/70">
          YouTube Music link (optional)
        </label>
        <input id={`f-yt-${id}`} inputMode="url" value={form.youtube} onChange={set("youtube")} placeholder="https://music.youtube.com/watch?v=..." className={input} />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!ready || status === "saving"} className={primary}>
          {status === "saving" ? "Saving..." : row ? "Save changes" : "Add it"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm opacity-70 hover:opacity-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
