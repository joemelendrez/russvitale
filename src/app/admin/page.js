"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ALL_RELEASES, parseSpotifyLink } from "@/data/releaseKey";

const today = () => new Date().toLocaleDateString("en-CA");

// Sign in with an emailed link, then fix song links and post new drops.
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

function SignIn() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const send = async (e) => {
    e.preventDefault();
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
  return (
    <Card title="Sign in">
      <form onSubmit={send} className="space-y-3">
        <label htmlFor="email" className="block text-sm text-white/70">
          Email
        </label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={status === "sending"} className={primary}>
          {status === "sending" ? "Sending..." : "Email me a sign-in link"}
        </button>
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
          {linkCount === null ? "Loading..." : `${linkCount} saved from the site.`} Open the site in edit mode to paste Spotify links into releases
          without a player.
        </p>
        {/* A full page load, so the site picks up edit mode as it opens. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/?edit=1" className={`${primary} mt-4 inline-block`}>
          Fix song links on the site
        </a>
      </Card>

      <DropForm onSaved={load} />

      <Card title="Drops">
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        {drops === null ? (
          <p className="text-sm text-white/60">Loading...</p>
        ) : drops.length === 0 ? (
          <p className="text-sm text-white/60">No drops yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {drops.map((drop) =>
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
                      {drop.released_on}
                      {drop.spotify_id ? ` · Spotify ${drop.kind}` : " · no player"}
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
          Drops show in the Singles timeline under their year. A drop with the same title as a single already on the site replaces it, so you can set its exact date. The newest one with Pop-up on slides down as a &quot;New drop&quot; notice, once per visitor.
        </p>
      </Card>
    </div>
  );
}

const blankDrop = () => ({ title: "", link: "", released_on: today(), note: "", show_banner: true });

const formFromDrop = (drop) => ({
  title: drop.title,
  link: drop.spotify_id ? `https://open.spotify.com/${drop.kind}/${drop.spotify_id}` : "",
  released_on: drop.released_on,
  note: drop.note ?? "",
  show_banner: drop.show_banner,
});

// Releases already on the site, newest first, to start a drop from.
const SITE_RELEASES = [...ALL_RELEASES].reverse();

// Adds a new drop, or edits `drop` when one is passed.
function DropForm({ drop, onSaved, onCancel }) {
  const editing = Boolean(drop);
  const [form, setForm] = useState(() => (drop ? formFromDrop(drop) : blankDrop()));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const id = drop?.id ?? "new";
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const pickRelease = (e) => {
    const release = SITE_RELEASES[Number(e.target.value)];
    if (!release) return;
    setForm((f) => ({
      ...f,
      title: release.title,
      link: release.spotify ? `https://open.spotify.com/${release.spotify.kind}/${release.spotify.id}` : f.link,
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    const parsed = form.link.trim() ? parseSpotifyLink(form.link) : null;
    if (form.link.trim() && !parsed) return setError("That doesn't look like a Spotify album or song link.");
    setStatus("saving");
    const row = {
      title: form.title.trim(),
      kind: parsed?.kind ?? null,
      spotify_id: parsed?.id ?? null,
      released_on: form.released_on,
      note: form.note.trim() || null,
      show_banner: form.show_banner,
    };
    const { error } = editing ? await supabase.from("russ_drops").update(row).eq("id", drop.id) : await supabase.from("russ_drops").insert(row);
    setStatus(null);
    if (error) return setError("Couldn't save the drop. Check the fields and try again.");
    if (!editing) {
      setForm(blankDrop());
      setStatus("saved");
    }
    onSaved();
  };

  const fields = (
    <form onSubmit={save} className="space-y-4">
      {!editing && (
        <div>
          <label htmlFor="drop-from" className="mb-1 block text-sm text-white/70">
            Start from a release on the site (optional)
          </label>
          <select id="drop-from" defaultValue="" onChange={pickRelease} className={input}>
            <option value="">A new release</option>
            {SITE_RELEASES.map((r, i) => (
              <option key={`${r.type}-${r.year}-${r.title}`} value={i}>
                {r.title} ({r.year})
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={`drop-title-${id}`} className="mb-1 block text-sm text-white/70">
          Title
        </label>
        <input id={`drop-title-${id}`} required maxLength={120} value={form.title} onChange={set("title")} className={input} />
      </div>
      <div>
        <label htmlFor={`drop-link-${id}`} className="mb-1 block text-sm text-white/70">
          Spotify link (Share › Copy link)
        </label>
        <input
          id={`drop-link-${id}`}
          inputMode="url"
          placeholder="https://open.spotify.com/track/..."
          value={form.link}
          onChange={set("link")}
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
          {status === "saving" ? "Saving..." : editing ? "Save changes" : "Add drop"}
        </button>
        {editing && (
          <button type="button" onClick={onCancel} className="text-sm opacity-70 hover:opacity-100">
            Cancel
          </button>
        )}
        {status === "saved" && <span className="text-sm text-emerald-400">Added. It&apos;s live for everyone.</span>}
      </div>
    </form>
  );

  return editing ? fields : <Card title="Add a new drop">{fields}</Card>;
}
