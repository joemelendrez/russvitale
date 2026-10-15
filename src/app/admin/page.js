"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AddSongWizard from "@/components/AddSongWizard";
import NewsletterAdmin from "@/components/NewsletterAdmin";
import FeaturesAdmin from "@/components/FeaturesAdmin";
import CoverMaker from "@/components/CoverMaker";
import { playerColumnsFromLinks, releaseYoutubeLink, rowLink, rowYoutubeLink } from "@/data/players";

const TYPE_LABEL = { single: "Single", album: "Album", ep: "EP", version: "Version" };
const today = () => new Date().toLocaleDateString("en-CA");

// Sign in with email and password, then fix song links and post new drops.
// The page itself trusts nothing: RLS in supabase/migrations decides who saves.
export default function AdminPage() {
  const [session, setSession] = useState(undefined);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    const check = async (next) => {
      if (cancelled) return;
      setSession(next);
      if (!next) return setAdmin(null);
      const { data } = await supabase.rpc("russ_is_admin");
      if (!cancelled) setAdmin(data === true);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event !== "INITIAL_SESSION") setTimeout(() => check(next), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-svh bg-neutral-950 px-4 pb-24 pt-24 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Russ fan archive</p>
        <h1 className="mt-3 font-display text-5xl uppercase leading-none">Admin</h1>
        <div className="mt-10">
          {!supabase ? (
            <Card>The database isn&apos;t connected yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Netlify.</Card>
          ) : session === undefined ? (
            <Card>Loading...</Card>
          ) : !session ? (
            <SignIn />
          ) : admin === null ? (
            <Card>Checking your account...</Card>
          ) : !admin ? (
            <Card>
              {session.user.email} can&apos;t edit this site. <SignOut />
            </Card>
          ) : (
            <Dashboard email={session.user.email} />
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ children, title }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">{title}</h2>}
      {children}
    </section>
  );
}

const input = "w-full rounded-lg [color-scheme:dark] border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30";
const primary = "rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40";

// Google (how the Handoff Hero accounts sign in; same Supabase project) or
// email and password. The emailed link stays as a fallback.
function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const signIn = async (e) => {
    e.preventDefault();
    setStatus("signing-in");
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
      setStatus(null);
    }
  };

  const google = async () => {
    setStatus("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
    if (error) {
      setError(error.message);
      setStatus(null);
    }
  };

  const sendLink = async () => {
    if (!email.trim()) return setError("Enter your email first.");
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (error) {
      setError(error.message);
      setStatus(null);
    } else setStatus("sent");
  };

  if (status === "sent") {
    return <Card>Check {email} for a sign-in link. Open it in this same browser.</Card>;
  }
  const busy = status !== null;
  return (
    <Card title="Sign in">
      <button
        type="button"
        onClick={google}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        {status === "google" ? "Opening Google..." : "Continue with Google"}
      </button>
      <p className="my-5 text-center text-xs uppercase tracking-[0.25em] text-white/30">or</p>
      <form onSubmit={signIn} className="space-y-3">
        <label htmlFor="email" className="block text-sm text-white/70">
          Email
        </label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        <label htmlFor="password" className="block text-sm text-white/70">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <button type="submit" disabled={busy} className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
            {status === "signing-in" ? "Signing in..." : "Sign in"}
          </button>
          <button type="button" onClick={sendLink} disabled={busy} className="text-sm text-white/60 underline hover:text-white disabled:opacity-40">
            {status === "sending" ? "Sending..." : "Forgot it? Email me a link"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function SignOut() {
  return (
    <button type="button" onClick={() => supabase.auth.signOut()} className="ml-1 underline opacity-70 hover:opacity-100">
      Sign out
    </button>
  );
}

function Dashboard({ email }) {
  const [drops, setDrops] = useState(null);
  const [linkCount, setLinkCount] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    const [d, l] = await Promise.all([
      supabase.from("russ_drops").select("*").order("released_on", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("russ_release_links").select("release_key", { count: "exact", head: true }),
    ]);
    if (d.error) setError("Couldn't load drops.");
    else setDrops(d.data);
    setLinkCount(l.count ?? 0);
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

  const update = async (id, patch) => {
    setError(null);
    const { error } = await supabase.from("russ_drops").update(patch).eq("id", id);
    if (error) setError("Couldn't save that change.");
    load();
  };

  // Features have their own card.
  const songs = (drops ?? []).filter((d) => d.release_type !== "feature");

  const remove = async (drop) => {
    if (!window.confirm(`Delete "${drop.title}"? It leaves the site for everyone.`)) return;
    setError(null);
    const { error } = await supabase.from("russ_drops").delete().eq("id", drop.id);
    if (error) setError("Couldn't delete that drop.");
    load();
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/60">
        Signed in as {email}. <SignOut />
      </p>

      <Card title="Song links">
        <p className="text-sm text-white/70">
          {linkCount === null ? "Loading..." : `${linkCount} saved from the site.`} Open the site in edit mode to paste Spotify, YouTube Music or SoundCloud links into releases
          without a player.
        </p>
        {/* A full page load, so the site picks up edit mode as it opens. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/?edit=1" className={`${primary} mt-4 inline-block`}>
          Fix song links on the site
        </a>
      </Card>

      <AddSongWizard drops={drops ?? []} onSaved={load} />

      <FeaturesAdmin drops={drops ?? []} onSaved={load} />

      <CoverMaker />

      <NewsletterAdmin />

      <Card title="Added songs">
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {drops === null ? (
          <p className="text-sm text-white/60">Loading...</p>
        ) : songs.length === 0 ? (
          <p className="text-sm text-white/60">Nothing added yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {songs.map((drop) =>
              editingId === drop.id ? (
                <li key={drop.id} className="py-4">
                  <DropForm
                    drop={drop}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      load();
                    }}
                  />
                </li>
              ) : (
                <li key={drop.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{drop.title}</p>
                    <p className="text-xs text-white/50">
                      {TYPE_LABEL[drop.release_type] ?? "Single"}
                      {drop.version_of ? ` of ${drop.version_of}` : ""} · {drop.released_on}
                      {drop.spotify_id ? ` · Spotify ${drop.kind}` : drop.soundcloud_url ? " · SoundCloud" : ""}
                      {drop.youtube_id ? " · YouTube" : ""}
                      {!drop.spotify_id && !drop.soundcloud_url && !drop.youtube_id ? " · no player" : ""}
                      {drop.note ? ` · ${drop.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={drop.show_banner} onChange={(e) => update(drop.id, { show_banner: e.target.checked })} className="h-4 w-4" />
                      Pop-up
                    </label>
                    <button type="button" onClick={() => setEditingId(drop.id)} className="font-semibold hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(drop)} className="text-red-400 hover:underline">
                      Delete
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
        <p className="mt-4 text-xs text-white/40">
          Everything here shows on /music under its date. Singles also join the home page&apos;s Singles timeline, and versions show under the song they come from. One with the same title as a release already on the site replaces it, so you can set its exact date. The newest one with Pop-up on slides down as a &quot;New drop&quot; notice, once per visitor.
        </p>
      </Card>
    </div>
  );
}

const formFromDrop = (drop) => ({
  title: drop.title,
  link: rowLink(drop),
  youtube: rowYoutubeLink(drop),
  released_on: drop.released_on,
  note: drop.note ?? "",
  show_banner: drop.show_banner,
});

// Edits a song added from admin (new ones go through AddSongWizard).
function DropForm({ drop, onSaved, onCancel }) {
  const [form, setForm] = useState(() => formFromDrop(drop));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const id = drop.id;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

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
    const row = {
      title: form.title.trim(),
      ...players,
      released_on: form.released_on,
      note: form.note.trim() || null,
      show_banner: form.show_banner,
    };
    const { error } = await supabase.from("russ_drops").update(row).eq("id", drop.id);
    setStatus(null);
    if (error) return setError("Couldn't save the drop. Check the fields and try again.");
    onSaved();
  };

  const fields = (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label htmlFor={`drop-title-${id}`} className="mb-1 block text-sm text-white/70">
          Title
        </label>
        <input id={`drop-title-${id}`} required maxLength={120} value={form.title} onChange={set("title")} className={input} />
      </div>
      <div>
        <label htmlFor={`drop-link-${id}`} className="mb-1 block text-sm text-white/70">
          Spotify or SoundCloud link (Share › Copy link)
        </label>
        <input
          id={`drop-link-${id}`}
          inputMode="url"
          placeholder="https://open.spotify.com/track/... or soundcloud.com/..."
          value={form.link}
          onChange={set("link")}
          className={input}
        />
      </div>
      <div>
        <label htmlFor={`drop-youtube-${id}`} className="mb-1 block text-sm text-white/70">
          YouTube Music link (optional, for listeners who pick YouTube Music)
        </label>
        <input
          id={`drop-youtube-${id}`}
          inputMode="url"
          placeholder="https://music.youtube.com/watch?v=..."
          value={form.youtube}
          onChange={set("youtube")}
          className={input}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`drop-date-${id}`} className="mb-1 block text-sm text-white/70">
            Release date
          </label>
          <input id={`drop-date-${id}`} type="date" required value={form.released_on} onChange={set("released_on")} className={input} />
        </div>
        <div>
          <label htmlFor={`drop-note-${id}`} className="mb-1 block text-sm text-white/70">
            Short note (optional)
          </label>
          <input id={`drop-note-${id}`} maxLength={200} placeholder="Out now" value={form.note} onChange={set("note")} className={input} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.show_banner} onChange={set("show_banner")} className="h-4 w-4" />
        Show it as the &quot;New drop&quot; pop-up
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!form.title.trim() || status === "saving"} className={primary}>
          {status === "saving" ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="text-sm opacity-70 hover:opacity-100">
          Cancel
        </button>
      </div>
    </form>
  );

  return fields;
}
