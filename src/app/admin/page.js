"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { refreshSite } from "@/lib/refreshSite";
import AddSongWizard from "@/components/AddSongWizard";
import NewsletterAdmin from "@/components/NewsletterAdmin";
import FeaturesAdmin from "@/components/FeaturesAdmin";
import CoverMaker from "@/components/CoverMaker";
import PlaylistsAdmin from "@/components/PlaylistsAdmin";
import Link from "next/link";
import AppIcon from "@/components/AppIcon";
import { swatchAt } from "@/components/AlbumSwatches";
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

  if (supabase && session && admin) return <Dashboard email={session.user.email} />;

  return (
    <div className="min-h-svh bg-neutral-950 px-4 pb-24 pt-16 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <TopBar />
        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/50">Russ fan archive</p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-none">Admin</h1>
        <div className="mt-8">
          {!supabase ? (
            <Card>The database isn&apos;t connected yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on Netlify.</Card>
          ) : session === undefined ? (
            <Card>Loading...</Card>
          ) : !session ? (
            <SignIn />
          ) : admin === null ? (
            <Card>Checking your account...</Card>
          ) : (
            <Card>
              {session.user.email} can&apos;t edit this site. <SignOut />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// The bar across the top: back to the site (or to the admin list inside a
// section), and the open section's name once its big title scrolls away.
function TopBar({ section, onBack }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const back = "flex items-center gap-0.5 text-sm font-semibold text-white/80 hover:text-white";
  return (
    <div
      className={`fixed inset-x-0 top-0 z-40 transition-colors ${scrolled ? "border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl" : "border-b border-transparent"}`}
    >
      <div className="relative mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
        {section ? (
          <button type="button" onClick={onBack} className={back}>
            <AppIcon name="chevron-left" className="h-5 w-5 shrink-0" /> Admin
          </button>
        ) : (
          <Link href="/" className={back}>
            <AppIcon name="chevron-left" className="h-5 w-5 shrink-0" /> Site
          </Link>
        )}
        <p
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold transition-opacity ${scrolled ? "opacity-100" : "opacity-0"}`}
        >
          {section?.title ?? "Admin"}
        </p>
        <span className="font-display text-lg tracking-wide text-white/40">RUSS</span>
      </div>
    </div>
  );
}

const SECTION_KEYS = ["add", "songs", "features", "playlists", "newsletter", "covers"];

// The open section, from the URL's #hash, so a reload or the back button lands right.
function useHashSection() {
  const [hash, setHash] = useState(null);
  useEffect(() => {
    const read = () => {
      const key = window.location.hash.slice(1);
      setHash(SECTION_KEYS.includes(key) ? key : null);
    };
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, []);
  return hash;
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
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
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

  // After any change to drops: reload them here and refresh the site's cached pages.
  const saved = useCallback(() => {
    refreshSite("drops");
    load();
  }, [load]);

  // One save per drop at a time, so a double tap on a switch can't send two.
  const saving = useRef(new Set());
  const update = async (id, patch) => {
    if (saving.current.has(id)) return;
    saving.current.add(id);
    setError(null);
    const { error } = await supabase.from("russ_drops").update(patch).eq("id", id);
    saving.current.delete(id);
    if (error) setError("Couldn't save that change.");
    saved();
  };

  // Features have their own card.
  const songs = (drops ?? []).filter((d) => d.release_type !== "feature");

  const remove = async (drop) => {
    if (!window.confirm(`Delete "${drop.title}"? It leaves the site for everyone.`)) return;
    setError(null);
    const { error } = await supabase.from("russ_drops").delete().eq("id", drop.id);
    if (error) setError("Couldn't delete that drop.");
    saved();
  };

  const [playlistCount, setPlaylistCount] = useState(null);
  const [blogRefresh, setBlogRefresh] = useState(null); // working | done | failed
  const refreshBlog = async () => {
    if (blogRefresh === "working") return;
    setBlogRefresh("working");
    setBlogRefresh((await refreshSite("blog")) ? "done" : "failed");
  };
  const active = useHashSection();
  // Opening a section adds a history entry, so the phone's back button returns to the list.
  const go = (key) => {
    history.pushState({ adminFromList: true }, "", `#${key}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
  };
  const back = () => {
    if (history.state?.adminFromList) return history.back();
    history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo(0, 0);
  };

  const addedSongs = (
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
                    saved();
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
                    <input type="checkbox" checked={drop.show_banner} onChange={(e) => update(drop.id, { show_banner: e.target.checked })} className="h-4 w-4 shrink-0" />
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
        Everything here shows on /music under its date. Singles also join the home page&apos;s Singles timeline, and versions show under the song they come from. One with the
        same title as a release already on the site replaces it, so you can set its exact date. The newest one with Pop-up on slides down as a &quot;New drop&quot; notice, once
        per visitor.
      </p>
    </Card>
  );

  const sections = [
    { key: "add", group: "Music", icon: "plus", title: "Add a song", sub: "Singles, albums, EPs and versions" },
    { key: "songs", group: "Music", icon: "disc-3", title: "Added songs", sub: drops === null ? "Loading..." : `${songs.length} on the site` },
    { key: "features", group: "Music", icon: "mic-vocal", title: "Features", sub: "Songs Russ is featured on" },
    { key: "playlists", group: "Fans", icon: "list-music", title: "Playlists", sub: playlistCount === null ? "Mood playlists" : `${playlistCount} on /playlists` },
    { key: "newsletter", group: "Fans", icon: "mail", title: "Newsletter", sub: "Subscribers and sending" },
    { key: "covers", group: "Blog", icon: "image", title: "Blog covers", sub: "Make a cover image" },
  ];
  const open = sections.find((x) => x.key === active) ?? null;
  const groups = [...new Set(sections.map((x) => x.group))];

  return (
    <div className="min-h-svh bg-neutral-950 px-4 pb-24 pt-16 text-white sm:px-6">
      <style>{PANE_CSS}</style>
      <TopBar section={open} onBack={back} />
      <div className="mx-auto max-w-2xl">
        {!open && (
          <div className="admin-fade">
            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/50">Russ fan archive</p>
            <h1 className="mt-2 font-display text-5xl uppercase leading-none">Admin</h1>

            <div className="mt-8 grid grid-cols-3 gap-2">
              <Stat label="Songs added" value={drops === null ? "…" : songs.length} />
              <Stat label="Links saved" value={linkCount ?? "…"} />
              <Stat label="Playlists" value={playlistCount ?? "…"} />
            </div>

            <ListGroup label="Quick fix">
              {/* A full page load, so the site picks up edit mode as it opens. */}
              <ListRow href="/?edit=1" icon="link" color={swatchAt(0)} title="Fix song links on the site" sub="Paste players into releases without one" external />
              {/* WordPress can't tell the site a post went live, so this asks for the new posts now. */}
              <ListRow
                icon="refresh-cw"
                color={swatchAt(6)}
                title="Show new blog posts now"
                sub={blogRefresh === "working" ? "Refreshing..." : blogRefresh === "done" ? "Done. New posts show on the next visit." : blogRefresh === "failed" ? "Couldn't refresh. Try again." : "Otherwise they show within 5 minutes"}
                onClick={refreshBlog}
              />
            </ListGroup>

            {groups.map((group) => (
              <ListGroup key={group} label={group}>
                {sections
                  .filter((x) => x.group === group)
                  .map((x) => (
                    <ListRow key={x.key} icon={x.icon} color={swatchAt(sections.indexOf(x) + 1)} title={x.title} sub={x.sub} onClick={() => go(x.key)} />
                  ))}
              </ListGroup>
            ))}

            <ListGroup label="Account">
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <AppIcon name="shield" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Signed in</span>
                  <span className="block truncate text-xs text-white/50">{email}</span>
                </span>
              </div>
              <button type="button" onClick={() => supabase.auth.signOut()} className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-white/[0.04]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/15">
                  <AppIcon name="log-out" className="h-[18px] w-[18px]" />
                </span>
                <span className="text-sm font-semibold">Sign out</span>
              </button>
            </ListGroup>
          </div>
        )}

        {open && (
          <div key={open.key} className="admin-fade">
            <div className="mt-8 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-black" style={{ background: swatchAt(sections.indexOf(open) + 1) }}>
                <AppIcon name={open.icon} className="h-6 w-6 shrink-0" />
              </span>
              <h1 className="font-display text-4xl uppercase leading-none sm:text-5xl">{open.title}</h1>
            </div>
          </div>
        )}

        {/* Every section stays mounted so a half-filled form survives a trip back to the list. */}
        <div className="admin-pane mt-6" hidden={active !== "add"}>
          <AddSongWizard drops={drops ?? []} onSaved={saved} />
        </div>
        <div className="admin-pane mt-6" hidden={active !== "songs"}>
          {addedSongs}
        </div>
        <div className="admin-pane mt-6" hidden={active !== "features"}>
          <FeaturesAdmin drops={drops ?? []} onSaved={saved} />
        </div>
        <div className="admin-pane mt-6" hidden={active !== "playlists"}>
          <PlaylistsAdmin onChange={setPlaylistCount} />
        </div>
        <div className="admin-pane mt-6" hidden={active !== "newsletter"}>
          <NewsletterAdmin />
        </div>
        <div className="admin-pane mt-6" hidden={active !== "covers"}>
          <CoverMaker />
        </div>
      </div>
    </div>
  );
}

// Inside a section the page is the card: the section's own frame and small
// heading (the big title above says the same) are hidden.
const PANE_CSS = `
.admin-pane > section > h2:first-child, .admin-pane > section > div:first-child > h2 { display: none; }
.admin-pane > section > div:first-child:has(> h2) { justify-content: flex-end; }
.admin-pane > section { border: 0; background: none; padding: 0; }
@keyframes admin-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.admin-fade { animation: admin-fade .25s ease-out; }
@media (prefers-reduced-motion: reduce) { .admin-fade { animation: none; } }
`;

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
      <p className="font-display text-3xl leading-none">{value}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-white/50">{label}</p>
    </div>
  );
}

function ListGroup({ label, children }) {
  return (
    <div className="mt-8">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">{label}</p>
      <div className="divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">{children}</div>
    </div>
  );
}

function ListRow({ icon, color, title, sub, onClick, href, external }) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-black" style={{ background: color }}>
        <AppIcon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        {sub && <span className="block truncate text-xs text-white/50">{sub}</span>}
      </span>
      <AppIcon name={external ? "external-link" : "chevron-right"} className="h-4 w-4 shrink-0 text-white/30" />
    </>
  );
  const style = "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.08]";
  return href ? (
    <a href={href} className={style}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={style}>
      {body}
    </button>
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
    if (status === "saving") return;
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
        <input type="checkbox" checked={form.show_banner} onChange={set("show_banner")} className="h-4 w-4 shrink-0" />
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
