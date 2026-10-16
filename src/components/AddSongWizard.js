"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CATALOG_RELEASES, releaseKey } from "@/data/releaseKey";
import { VERSION_RELEASES } from "@/data/versions";
import { dropToRelease } from "@/data/drops";
import { sameSong } from "@/data/catalog";
import { playerColumnsFromLinks } from "@/data/players";
import Link from "next/link";

const TYPES = [
  { key: "single", label: "Single", hint: "A song released on its own." },
  { key: "album", label: "Album", hint: "A full project." },
  { key: "ep", label: "EP", hint: "A short project." },
  { key: "version", label: "Another version", hint: "Slow, Nasty, Sped Up, a remix... of a song already out." },
];
const TYPE_LABEL = { single: "Single", album: "Album", ep: "EP", version: "Version" };
const VERSION_TAGS = ["Slow", "Nasty", "Sped Up", "Slowed", "Remix", "Acoustic", "Live", "Clean"];
const STEPS = ["What", "Song", "Date", "Links", "Check"];

const input = "w-full rounded-lg [color-scheme:dark] border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30";
const primary = "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40";
const today = () => new Date().toLocaleDateString("en-CA");
const monthAgo = () => new Date(Date.now() - 30 * 864e5).toLocaleDateString("en-CA");

function formatDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const blank = () => ({ type: null, title: "", versionOf: "", released_on: today(), link: "", youtube: "", note: "", show_banner: true });

// A new release in five short steps. It lands on /music under its date, a
// single also joins the home page's Singles timeline, and a version shows
// under the song it comes from.
export default function AddSongWizard({ drops, onSaved }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(blank);
  const [savedDates, setSavedDates] = useState({});
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  // Dates set from edit mode, so the placement below matches /music.
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("russ_release_links")
      .select("release_key, released_on")
      .not("released_on", "is", null)
      .then(({ data }) => !cancelled && data && setSavedDates(Object.fromEntries(data.map((r) => [r.release_key, r.released_on]))));
    return () => {
      cancelled = true;
    };
  }, []);

  // Everything /music lists, with the dates it shows.
  const releases = useMemo(() => {
    const list = [...CATALOG_RELEASES, ...VERSION_RELEASES, ...drops.map(dropToRelease)];
    return list.map((r) => ({ ...r, date: savedDates[releaseKey(r)] ?? r.date }));
  }, [drops, savedDates]);

  const songs = useMemo(() => [...new Set(releases.filter((r) => r.type !== "version").map((r) => r.title))].sort((a, b) => a.localeCompare(b)), [releases]);

  const title = form.title.trim();
  const year = Number(form.released_on.slice(0, 4));
  const existing = title && form.type ? releases.find((r) => r.type === form.type && sameSong(r.title, title)) : null;
  const original = form.type === "version" && form.versionOf.trim() ? releases.find((r) => r.type !== "version" && sameSong(r.title, form.versionOf)) : null;

  // The dated releases either side of the new one in its year.
  const placement = useMemo(() => {
    if (!form.released_on) return null;
    const sameYear = releases
      .filter((r) => r.date && r.date.startsWith(String(year)) && !(existing && r === existing))
      .sort((a, b) => a.date.localeCompare(b.date));
    const before = sameYear.filter((r) => r.date <= form.released_on).at(-1);
    const after = sameYear.find((r) => r.date > form.released_on);
    return { before, after, count: sameYear.length };
  }, [releases, form.released_on, year, existing]);

  const canNext = [
    Boolean(form.type),
    Boolean(title) && (form.type !== "version" || Boolean(form.versionOf.trim())),
    /^\d{4}-\d{2}-\d{2}$/.test(form.released_on),
    true,
    true,
  ][step];

  const pickTag = (tag) => setForm((f) => ({ ...f, title: `${f.versionOf.trim() || "Song"} (${tag})` }));

  const save = async () => {
    setError(null);
    setStatus("saving");
    let players;
    try {
      players = await playerColumnsFromLinks(form.link, form.youtube);
    } catch (err) {
      setStatus(null);
      setStep(3);
      return setError(err.message);
    }
    const row = {
      title,
      release_type: form.type,
      version_of: form.type === "version" ? form.versionOf.trim() : null,
      ...players,
      released_on: form.released_on,
      note: form.note.trim() || null,
      show_banner: form.show_banner,
    };
    const { error } = await supabase.from("russ_drops").insert(row);
    if (error) {
      setStatus(null);
      return setError("Couldn't add it. Check the fields and try again.");
    }
    setStatus({ done: title });
    setForm(blank());
    setStep(0);
    onSaved();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Add a song</h2>
        <ol className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
          {STEPS.map((s, i) => (
            <li key={s} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-white" : i < step ? "w-3 bg-white/60" : "w-3 bg-white/15"}`} />
          ))}
        </ol>
      </div>

      {status?.done && step === 0 && (
        <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Added &quot;{status.done}&quot;. It&apos;s live for everyone.{" "}
          <Link href="/music" className="underline">
            See it on /music
          </Link>
        </p>
      )}

      {step === 0 && (
        <div>
          <p className="mb-3 text-lg font-semibold">What are you adding?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={form.type === t.key}
                onClick={() => {
                  setForm((f) => ({ ...f, type: t.key }));
                  setStatus(null);
                  setStep(1);
                }}
                className={`rounded-xl border p-4 text-left transition-colors ${form.type === t.key ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"}`}
              >
                <span className="block font-semibold">{t.label}</span>
                <span className="mt-1 block text-sm text-white/60">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {form.type === "version" && (
            <>
              <div>
                <label htmlFor="w-of" className="mb-1 block text-sm text-white/70">
                  Which song is it a version of?
                </label>
                <input id="w-of" list="w-songs" value={form.versionOf} onChange={set("versionOf")} placeholder="Start typing, e.g. Last Night" className={input} />
                <datalist id="w-songs">
                  {songs.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                {form.versionOf.trim() && !original && (
                  <p className="mt-1 text-xs text-amber-300">That song isn&apos;t on the site, so the version won&apos;t link to it. It still shows on /music.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {VERSION_TAGS.map((tag) => (
                  <button key={tag} type="button" onClick={() => pickTag(tag)} disabled={!form.versionOf.trim()} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold hover:border-white/50 disabled:opacity-40">
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
          <div>
            <label htmlFor="w-title" className="mb-1 block text-sm text-white/70">
              {form.type === "version" ? "Title, as it shows on Spotify" : "Title"}
            </label>
            <input id="w-title" maxLength={120} value={form.title} onChange={set("title")} placeholder={form.type === "version" ? "Last Night (Slow)" : ""} className={input} />
            {existing && (
              <p className="mt-1 text-xs text-amber-300">
                {existing.title} ({existing.year}) is already on the site. Adding it again sets its date and links instead of making a copy.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label htmlFor="w-date" className="block text-lg font-semibold">
            When did it come out?
          </label>
          <input
            id="w-date"
            type="date"
            value={form.released_on}
            // Only something out in the last month gets the "New drop" pop-up by default.
            onChange={(e) => setForm((f) => ({ ...f, released_on: e.target.value, show_banner: e.target.value >= monthAgo() }))}
            className={input}
          />
          {placement && (
            <p className="text-sm text-white/70">
              It goes under {year} on /music
              {placement.before && (
                <>
                  , after <strong className="text-white">{placement.before.title}</strong> ({formatDate(placement.before.date)})
                </>
              )}
              {placement.after && (
                <>
                  {placement.before ? " and" : ","} before <strong className="text-white">{placement.after.title}</strong> ({formatDate(placement.after.date)})
                </>
              )}
              {!placement.count && ", the first one that year with an exact date"}.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-lg font-semibold">Where can people play it?</p>
          <div>
            <label htmlFor="w-link" className="mb-1 block text-sm text-white/70">
              Spotify or SoundCloud link (Share › Copy link)
            </label>
            <input id="w-link" inputMode="url" value={form.link} onChange={set("link")} placeholder="https://open.spotify.com/track/..." className={input} />
          </div>
          <div>
            <label htmlFor="w-yt" className="mb-1 block text-sm text-white/70">
              YouTube Music link (optional)
            </label>
            <input id="w-yt" inputMode="url" value={form.youtube} onChange={set("youtube")} placeholder="https://music.youtube.com/watch?v=..." className={input} />
          </div>
          <div>
            <label htmlFor="w-note" className="mb-1 block text-sm text-white/70">
              Short note (optional)
            </label>
            <input id="w-note" maxLength={200} value={form.note} onChange={set("note")} placeholder="Out now" className={input} />
          </div>
          <p className="text-xs text-white/40">No link yet? Skip it and paste one later from edit mode. Covers are added from edit mode too.</p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-lg font-semibold">Check it</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-white/50">Type</dt>
            <dd>{TYPE_LABEL[form.type]}</dd>
            <dt className="text-white/50">Title</dt>
            <dd>{title}</dd>
            {form.type === "version" && (
              <>
                <dt className="text-white/50">Version of</dt>
                <dd>{form.versionOf}</dd>
              </>
            )}
            <dt className="text-white/50">Date</dt>
            <dd>{formatDate(form.released_on)}</dd>
            <dt className="text-white/50">Plays on</dt>
            <dd>{[form.link.includes("spotify") && "Spotify", form.link.includes("soundcloud") && "SoundCloud", form.youtube.trim() && "YouTube"].filter(Boolean).join(", ") || "No player yet"}</dd>
            <dt className="text-white/50">Shows on</dt>
            <dd>{form.type === "single" ? "/music and the home page's Singles timeline" : form.type === "version" ? `/music, and under ${form.versionOf}` : "/music"}</dd>
          </dl>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.show_banner} onChange={set("show_banner")} className="h-4 w-4 shrink-0" />
            Announce it with the &quot;New drop&quot; pop-up
          </label>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {step > 0 && (
        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={() => setStep((s) => s - 1)} className="text-sm opacity-70 hover:opacity-100">
            &larr; Back
          </button>
          <span className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className={primary}>
              Next
            </button>
          ) : (
            <button type="button" disabled={status === "saving"} onClick={save} className={primary}>
              {status === "saving" ? "Adding..." : "Add it"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
