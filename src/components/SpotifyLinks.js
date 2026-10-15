"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ALL_RELEASES, CATALOG_RELEASES, releaseKey } from "@/data/releaseKey";
import { expandSoundcloud, parsePlayerLink, playerFor, releaseFieldsFromRow, searchLinks } from "@/data/players";
import { useListenOn } from "@/lib/listenOn";
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

const COVER_BUCKET = "russ-covers";
const LINK_COLUMNS = ["kind", "spotify_id", "soundcloud_url", "youtube_kind", "youtube_id"];
const ROW_COLUMNS = [...LINK_COLUMNS, "cover_url", "released_on"];

// "…/object/public/russ-covers/<path>" → "<path>", for deleting an old upload.
function coverPath(url) {
  const marker = `/object/public/${COVER_BUCKET}/`;
  return url?.includes(marker) ? url.split(marker)[1] : null;
}

// A picked photo as a square-ish image at most 1000px across: WebP where the
// browser can make one, JPEG otherwise.
async function shrinkImage(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Pick an image file.");
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("Couldn't read that image. Try a JPEG or PNG.");
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const encode = (type) => new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
  const webp = await encode("image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg");
  if (!jpeg) throw new Error("Couldn't read that image. Try a JPEG or PNG.");
  return jpeg;
}

// Saved rows by release key, as stored (Spotify or SoundCloud, plus YouTube).
function linksFromRows(rows) {
  return Object.fromEntries((rows ?? []).map((r) => [r.release_key, r]));
}

// A release with its saved row applied: a saved Spotify or SoundCloud link
// replaces whichever of those the release had, a saved YouTube link its YouTube.
export function withSavedLinks(release, row) {
  if (!row) return release;
  const saved = releaseFieldsFromRow(row);
  const hasLinks = Boolean(row.spotify_id || row.soundcloud_url || row.youtube_id);
  const next = hasLinks ? { ...release, savedLink: true } : { ...release };
  if (row.spotify_id || row.soundcloud_url) {
    delete next.spotify;
    delete next.soundcloud;
  }
  return { ...next, ...saved };
}

export function SpotifyLinksProvider({ children }) {
  const [links, setLinks] = useState({});
  const linksRef = useRef(links);
  useEffect(() => {
    linksRef.current = links;
  }, [links]);
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
      .select("release_key, kind, spotify_id, soundcloud_url, youtube_kind, youtube_id, cover_url, released_on")
      .then(({ data }) => !cancelled && data && setLinks(linksFromRows(data)));
    supabase
      .from("russ_drops")
      .select("id, title, kind, spotify_id, soundcloud_url, youtube_kind, youtube_id, note, released_on, show_banner, created_at, release_type, version_of")
      .order("released_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500)
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

  // Clears some columns of a saved row, or deletes the row when nothing is left.
  const clearRow = useCallback(async (key, columns, message) => {
    const row = linksRef.current[key];
    if (!row) return;
    const left = ROW_COLUMNS.some((c) => !columns.includes(c) && row[c]);
    const query = supabase.from("russ_release_links");
    const { error } = left
      ? await query.update({ ...Object.fromEntries(columns.map((c) => [c, null])), updated_at: new Date().toISOString() }).eq("release_key", key)
      : await query.delete().eq("release_key", key);
    if (error) throw new Error(message);
    setLinks((prev) => {
      const next = { ...prev };
      if (left) next[key] = { ...prev[key], ...Object.fromEntries(columns.map((c) => [c, null])) };
      else delete next[key];
      return next;
    });
  }, []);

  const save = useCallback(async (release, link, remove = false) => {
    const key = releaseKey(release);
    if (remove) {
      await clearRow(key, LINK_COLUMNS, "Couldn't remove that link. Are you still signed in?");
      return;
    }
    const found = parsePlayerLink(link);
    if (!found) throw new Error("That doesn't look like a Spotify, YouTube Music or SoundCloud link.");
    const parsed = await expandSoundcloud(found);
    // Upsert only touches the pasted service's columns, so a YouTube link
    // keeps the release's saved Spotify link and the other way round.
    const { error } = await supabase.from("russ_release_links").upsert({ release_key: key, ...parsed, updated_at: new Date().toISOString() });
    if (error) throw new Error("Couldn't save that link. Are you still signed in?");
    setLinks((prev) => ({ ...prev, [key]: { ...prev[key], release_key: key, ...parsed } }));
  }, [clearRow]);

  // Uploads a new cover (shrunk on the device first) and points the release at it.
  const saveCover = useCallback(async (release, file) => {
    const key = releaseKey(release);
    const blob = await shrinkImage(file);
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${key}-${Date.now()}.${ext}`;
    const bucket = supabase.storage.from(COVER_BUCKET);
    const { error: upErr } = await bucket.upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
    if (upErr) throw new Error("Couldn't upload that image. Are you still signed in?");
    const cover_url = bucket.getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("russ_release_links").upsert({ release_key: key, cover_url, updated_at: new Date().toISOString() });
    if (error) {
      await bucket.remove([path]);
      throw new Error("Couldn't save that cover. Are you still signed in?");
    }
    const old = coverPath(linksRef.current[key]?.cover_url);
    setLinks((prev) => ({ ...prev, [key]: { ...prev[key], release_key: key, cover_url } }));
    if (old) bucket.remove([old]);
  }, []);

  // Sets the day a release came out ("YYYY-MM-DD"), or clears it with "".
  const saveDate = useCallback(
    async (release, date) => {
      const key = releaseKey(release);
      if (!date) return clearRow(key, ["released_on"], "Couldn't clear that date. Are you still signed in?");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Pick a full date.");
      const { error } = await supabase.from("russ_release_links").upsert({ release_key: key, released_on: date, updated_at: new Date().toISOString() });
      if (error) throw new Error("Couldn't save that date. Are you still signed in?");
      setLinks((prev) => ({ ...prev, [key]: { ...prev[key], release_key: key, released_on: date } }));
    },
    [clearRow]
  );

  const removeCover = useCallback(async (release) => {
    const key = releaseKey(release);
    const old = coverPath(linksRef.current[key]?.cover_url);
    await clearRow(key, ["cover_url"], "Couldn't remove that cover. Are you still signed in?");
    if (old) supabase.storage.from(COVER_BUCKET).remove([old]);
  }, [clearRow]);

  const exitEdit = useCallback(() => {
    storage("remove");
    setWantsEdit(false);
  }, []);

  const dismissError = useCallback(() => {
    storage("remove");
    setWantsEdit(false);
  }, []);

  const value = useMemo(
    () => ({ links, drops, editing, isAdmin, editError, save, saveCover, removeCover, saveDate, exitEdit, dismissError }),
    [links, drops, editing, isAdmin, editError, save, saveCover, removeCover, saveDate, exitEdit, dismissError]
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

// The release with any saved links applied (see withSavedLinks).
export function useRelease(release) {
  const { links } = useSpotifyLinks();
  return withSavedLinks(release, links[releaseKey(release)]);
}

function EditBar() {
  const { links, editing, editError, exitEdit, dismissError } = useSpotifyLinks();
  const service = useListenOn();
  const onCatalog = usePathname() === "/music";
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

  // Counted for the service picked above the timeline, so switching to
  // YouTube Music shows what's left to fill in there. /music also counts
  // releases without a full date.
  const releases = (onCatalog ? CATALOG_RELEASES : ALL_RELEASES).map((r) => withSavedLinks(r, links[releaseKey(r)]));
  const noPlayer = releases.filter((r) => !playerFor(r, service)).length;
  const noDate = onCatalog ? releases.filter((r) => !r.date).length : 0;
  const summary = [noPlayer && `${noPlayer} without a player`, noDate && `${noDate} without a date`].filter(Boolean).join(" · ");
  // The other tab's cards aren't on the page, so switch tabs when this one is done.
  const jumpToNext = () => {
    if (onCatalog) {
      const row = document.querySelector("[data-missing] > button");
      if (row?.getAttribute("aria-expanded") === "false") row.click();
      return row?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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
        <p className="text-xs text-white/60">{summary || (onCatalog ? "Every release has a player and a date" : "Every release has a player")}</p>
      </div>
      <div className="flex gap-2">
        {noPlayer + noDate > 0 && (
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

// Shown under a card in edit mode: find it on Spotify, YouTube Music or
// SoundCloud, paste the share link, save. Opens by itself when the release has
// no player on the service picked above the timeline.
export function SpotifyLinkEditor({ release }) {
  const { save } = useSpotifyLinks();
  const service = useListenOn();
  const hasPlayer = Boolean(playerFor(release, service));
  const [open, setOpen] = useState(!hasPlayer);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const search = searchLinks(release);

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
        <a href={search.spotify} target="_blank" rel="noreferrer" className="underline hover:text-white">
          Spotify
        </a>
        ,{" "}
        <a href={search.youtube} target="_blank" rel="noreferrer" className="underline hover:text-white">
          YouTube Music
        </a>{" "}
        or{" "}
        <a href={search.soundcloud} target="_blank" rel="noreferrer" className="underline hover:text-white">
          SoundCloud
        </a>
      </p>
      <label className="block text-white/60" htmlFor={`link-${releaseKey(release)}`}>
        2. Share › Copy link, then paste it here
      </label>
      <input
        id={`link-${releaseKey(release)}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Spotify, YouTube Music or SoundCloud link"
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
            Remove saved links
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

// Edit mode: upload or replace a release's cover (and take it off again).
// The image is shrunk on the device, then stored in Supabase for everyone.
export function CoverEditor({ release }) {
  const { links, saveCover, removeCover } = useSpotifyLinks();
  const saved = links[releaseKey(release)]?.cover_url;
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const input = useRef(null);

  const run = async (task, done) => {
    setStatus("saving");
    setError(null);
    try {
      await task();
      setStatus(done);
    } catch (e) {
      setError(e.message);
      setStatus(null);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={`Cover image for ${release.title}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) run(() => saveCover(release, file), "Cover saved");
        }}
      />
      <button type="button" disabled={status === "saving"} onClick={() => input.current?.click()} className="underline opacity-70 hover:opacity-100 disabled:opacity-40">
        {status === "saving" ? "Uploading..." : saved ? "Change cover" : "Upload cover"}
      </button>
      {saved && status !== "saving" && (
        <button type="button" onClick={() => run(() => removeCover(release), "Cover removed")} className="underline opacity-70 hover:opacity-100">
          Remove cover
        </button>
      )}
      {status && status !== "saving" && <span className="text-emerald-400">{status}</span>}
      {error && <span className="text-red-400">{error}</span>}
    </div>
  );
}

// Edit mode: the day a release came out. Albums come with theirs; most
// singles only have a year until one is set here.
export function DateEditor({ release }) {
  const { links, saveDate } = useSpotifyLinks();
  const savedDate = links[releaseKey(release)]?.released_on;
  const [value, setValue] = useState(release.date ?? "");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const id = `date-${releaseKey(release)}`;

  const run = async (date) => {
    setStatus("saving");
    setError(null);
    try {
      await saveDate(release, date);
      setValue(date);
      setStatus(date ? "Date saved" : "Date cleared");
    } catch (e) {
      setError(e.message);
      setStatus(null);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(value);
      }}
      className="mt-2 flex flex-wrap items-center gap-2 text-xs"
    >
      <label htmlFor={id} className="opacity-70">
        Released
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min="2010-01-01"
        onChange={(e) => {
          setValue(e.target.value);
          setStatus(null);
        }}
        className="rounded-lg border border-white/20 bg-black/60 px-2 py-1 text-white [color-scheme:dark]"
      />
      <button type="submit" disabled={!value || value === release.date || status === "saving"} className="rounded-full bg-white px-3 py-1 font-semibold text-black disabled:opacity-40">
        {status === "saving" ? "Saving..." : "Save"}
      </button>
      {savedDate && status !== "saving" && (
        <button type="button" onClick={() => run("")} className="underline opacity-70 hover:opacity-100">
          Clear
        </button>
      )}
      {status && status !== "saving" && <span className="text-emerald-400">{status}</span>}
      {error && <span className="text-red-400">{error}</span>}
    </form>
  );
}
