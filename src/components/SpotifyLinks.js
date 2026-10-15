"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ALL_RELEASES, releaseKey } from "@/data/releaseKey";
import { parsePlayerLink } from "@/data/players";
import { supabase } from "@/lib/supabase";
import { TAB_EVENT } from "./Timeline";
import DropBanner from "./DropBanner";

// Song links fixed from the page itself, plus the newest drops, both kept in
// Supabase (src/lib/supabase.js). Everyone reads them on top of src/data.
// An admin signed in at /admin opens /?edit=1 to turn on edit mode on that
// device, where every card gets a paste box. RLS decides who may save.
const EDIT_MODE_STORAGE = "russ-edit-mode";
const SpotifyLinksContext = createContext({ links: {}, drops: [], editing: false, isAdmin: false });

function storage(action) {
  try {
    if (action === "get") return localStorage.getItem(EDIT_MODE_STORAGE) === "1";
    if (action === "set") localStorage.setItem(EDIT_MODE_STORAGE, "1");
    if (action === "remove") localStorage.removeItem(EDIT_MODE_STORAGE);
  } catch {
    return false;
  }
  return false;
}

// A saved row as the release fields it sets: { spotify } or { soundcloud }.
function linkFromRow(row) {
  if (row.spotify_id) return { spotify: { kind: row.kind, id: row.spotify_id } };
  if (row.soundcloud_url) return { soundcloud: row.soundcloud_url };
  return null;
}

function linksFromRows(rows) {
  return Object.fromEntries((rows ?? []).map((r) => [r.release_key, linkFromRow(r)]).filter(([, link]) => link));
}

export function SpotifyLinksProvider({ children }) {
  const [links, setLinks] = useState({});
  const [drops, setDrops] = useState([]);
  const [admin, setAdmin] = useState("unknown"); // unknown | yes | no
  // Read on the client only; nothing renders from it until the admin check
  // (async, after hydration) says yes.
  const [wantsEdit, setWantsEdit] = useState(
    () => typeof window !== "undefined" && (new URLSearchParams(window.location.search).has("edit") || storage("get"))
  );

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("russ_release_links")
      .select("release_key, kind, spotify_id, soundcloud_url")
      .then(({ data }) => !cancelled && data && setLinks(linksFromRows(data)));
    supabase
      .from("russ_drops")
      .select("id, title, kind, spotify_id, soundcloud_url, note, released_on, show_banner, created_at")
      .order("released_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => !cancelled && data && setDrops(data));

    const url = new URL(window.location.href);
    if (url.searchParams.has("edit")) {
      url.searchParams.delete("edit");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }

    // Ask the database, the same check RLS uses on every save.
    const check = async (session) => {
      if (!session) return !cancelled && setAdmin("no");
      const { data } = await supabase.rpc("russ_is_admin");
      if (!cancelled) setAdmin(data === true ? "yes" : "no");
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

  const isAdmin = admin === "yes";
  const editing = wantsEdit && isAdmin;

  useEffect(() => {
    if (editing) storage("set");
  }, [editing]);

  // Someone opened /?edit=1 without being signed in as an admin.
  const editError = wantsEdit && admin === "no" ? "Sign in at /admin first to fix song links." : null;

  const save = useCallback(async (release, link, remove = false) => {
    const key = releaseKey(release);
    if (remove) {
      const { error } = await supabase.from("russ_release_links").delete().eq("release_key", key);
      if (error) throw new Error("Couldn't remove that link. Are you still signed in?");
      setLinks((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    const parsed = parsePlayerLink(link);
    if (!parsed) throw new Error("That doesn't look like a Spotify or SoundCloud link.");
    const { error } = await supabase.from("russ_release_links").upsert({ release_key: key, ...parsed, updated_at: new Date().toISOString() });
    if (error) throw new Error("Couldn't save that link. Are you still signed in?");
    setLinks((prev) => ({ ...prev, [key]: linkFromRow(parsed) }));
  }, []);

  const exitEdit = useCallback(() => {
    storage("remove");
    setWantsEdit(false);
  }, []);

  const dismissError = useCallback(() => {
    storage("remove");
    setWantsEdit(false);
  }, []);

  const value = useMemo(
    () => ({ links, drops, editing, isAdmin, editError, save, exitEdit, dismissError }),
    [links, drops, editing, isAdmin, editError, save, exitEdit, dismissError]
  );
  return (
    <SpotifyLinksContext.Provider value={value}>
      {children}
      <DropBanner />
      <EditBar />
    </SpotifyLinksContext.Provider>
  );
}

export function useSpotifyLinks() {
  return useContext(SpotifyLinksContext);
}

// The release with any saved link applied. A saved link replaces whatever
// player the release had, Spotify or SoundCloud.
export function useRelease(release) {
  const { links } = useSpotifyLinks();
  const saved = links[releaseKey(release)];
  if (!saved) return release;
  const { spotify: _spotify, soundcloud: _soundcloud, ...rest } = release;
  return { ...rest, ...saved, savedLink: true };
}

function EditBar() {
  const { links, editing, editError, exitEdit, dismissError } = useSpotifyLinks();
  if (editError) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-red-600 px-4 py-3 text-sm text-white shadow-2xl">
        <span>
          {editError}{" "}
          <a href="/admin" className="font-semibold underline">
            Sign in
          </a>
        </span>
        <button type="button" onClick={dismissError} className="font-semibold">
          OK
        </button>
      </div>
    );
  }
  if (!editing) return null;

  const missing = ALL_RELEASES.filter((r) => !r.spotify && !r.soundcloud && !links[releaseKey(r)]);
  // The other tab's cards aren't on the page, so switch tabs when this one is done.
  const jumpToNext = () => {
    const el = document.querySelector("[data-missing-spotify]");
    if (el) return el.scrollIntoView({ behavior: "smooth", block: "center" });
    const other = document.querySelector('[role=tab][aria-selected="false"]')?.textContent?.trim().toLowerCase();
    if (!other) return;
    window.dispatchEvent(new CustomEvent(TAB_EVENT, { detail: other }));
    setTimeout(() => document.querySelector("[data-missing-spotify]")?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-white/15 bg-neutral-950/95 px-4 py-3 text-sm text-white shadow-2xl">
      <div>
        <p className="font-semibold">Edit mode</p>
        <p className="text-xs text-white/60">{missing.length ? `${missing.length} without a player` : "Every release has a player"}</p>
      </div>
      <div className="flex gap-2">
        {missing.length > 0 && (
          <button type="button" onClick={jumpToNext} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black">
            Next missing
          </button>
        )}
        <button type="button" onClick={exitEdit} className="rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold">
          Done
        </button>
      </div>
    </div>
  );
}

// Shown under a card in edit mode: find it on Spotify (or SoundCloud when
// Spotify doesn't have it), paste the share link, save.
export function SpotifyLinkEditor({ release }) {
  const { save } = useSpotifyLinks();
  const hasPlayer = Boolean(release.spotify || release.soundcloud);
  const [open, setOpen] = useState(!hasPlayer);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const query = encodeURIComponent(`Russ ${release.title}`);
  const search = `https://open.spotify.com/search/${query}`;
  const soundcloudSearch = `https://soundcloud.com/search/sounds?q=${query}`;

  const run = async (remove) => {
    setStatus("saving");
    setError(null);
    try {
      await save(release, value, remove);
      setValue("");
      setStatus("saved");
      if (!remove) setOpen(false);
    } catch (e) {
      setError(e.message);
      setStatus(null);
    }
  };

  if (!open) {
    return (
      <div className="mt-2 flex items-center gap-3 text-xs">
        {status === "saved" && <span className="text-emerald-400">Saved for everyone</span>}
        <button type="button" onClick={() => setOpen(true)} className="underline opacity-70 hover:opacity-100">
          Change link
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(false);
      }}
      className="mt-3 space-y-2 rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white"
    >
      <p className="font-semibold uppercase tracking-[0.15em] text-white/80">
        1. Find it on{" "}
        <a href={search} target="_blank" rel="noreferrer" className="underline hover:text-white">
          Spotify &#8599;
        </a>{" "}
        or{" "}
        <a href={soundcloudSearch} target="_blank" rel="noreferrer" className="underline hover:text-white">
          SoundCloud &#8599;
        </a>
      </p>
      <label className="block text-white/60" htmlFor={`link-${releaseKey(release)}`}>
        2. Share › Copy link, then paste it here
      </label>
      <input
        id={`link-${releaseKey(release)}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Spotify or SoundCloud link"
        inputMode="url"
        className="w-full rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-white/30"
      />
      {error && <p className="text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={!value || status === "saving"} className="rounded-full bg-white px-3 py-1.5 font-semibold text-black disabled:opacity-40">
          {status === "saving" ? "Saving..." : "Save"}
        </button>
        {release.savedLink && (
          <button type="button" onClick={() => run(true)} className="rounded-full border border-white/25 px-3 py-1.5">
            Remove saved link
          </button>
        )}
        {hasPlayer && (
          <button type="button" onClick={() => setOpen(false)} className="px-2 py-1.5 opacity-70">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
