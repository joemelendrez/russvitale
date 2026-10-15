"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ALL_RELEASES, releaseKey } from "@/data/releaseKey";
import { TAB_EVENT } from "./Timeline";

// Spotify links fixed from the page itself. Everyone loads the saved links
// on top of src/data; opening the site once as /?edit=<SPOTIFY_EDIT_KEY>
// turns on edit mode on that device, where every card gets a paste box.
const EDIT_KEY_STORAGE = "russ-spotify-edit-key";
const SpotifyLinksContext = createContext({ links: {}, editKey: null });

function storage(action, value) {
  try {
    if (action === "get") return localStorage.getItem(EDIT_KEY_STORAGE);
    if (action === "set") localStorage.setItem(EDIT_KEY_STORAGE, value);
    if (action === "remove") localStorage.removeItem(EDIT_KEY_STORAGE);
  } catch {
    return null;
  }
  return null;
}

export function SpotifyLinksProvider({ children }) {
  const [links, setLinks] = useState({});
  const [editKey, setEditKey] = useState(null);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spotify-links")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => !cancelled && setLinks(data ?? {}))
      .catch(() => {});

    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("edit");
    if (fromUrl !== null) {
      url.searchParams.delete("edit");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    const key = fromUrl || storage("get");
    if (key) {
      fetch("/api/spotify-links", {
        method: "POST",
        headers: { "content-type": "application/json", "x-edit-key": key },
        body: JSON.stringify({ action: "check" }),
      })
        .then((res) => {
          if (cancelled) return;
          if (res.ok) {
            storage("set", key);
            setEditKey(key);
          } else {
            storage("remove");
            setEditError("That edit link didn't work. Check the key and try again.");
          }
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (release, link, remove = false) => {
      const res = await fetch("/api/spotify-links", {
        method: "POST",
        headers: { "content-type": "application/json", "x-edit-key": editKey },
        body: JSON.stringify({ release: releaseKey(release), link, remove }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save that link.");
      setLinks(data.links);
    },
    [editKey]
  );

  const exitEdit = useCallback(() => {
    storage("remove");
    setEditKey(null);
  }, []);

  const value = useMemo(() => ({ links, editKey, editError, save, exitEdit, setEditError }), [links, editKey, editError, save, exitEdit]);
  return (
    <SpotifyLinksContext.Provider value={value}>
      {children}
      <EditBar />
    </SpotifyLinksContext.Provider>
  );
}

export function useSpotifyLinks() {
  return useContext(SpotifyLinksContext);
}

// The release with any saved link applied.
export function useRelease(release) {
  const { links } = useSpotifyLinks();
  const saved = links[releaseKey(release)];
  return saved ? { ...release, spotify: saved, savedLink: true } : release;
}

function EditBar() {
  const { links, editKey, editError, exitEdit, setEditError } = useSpotifyLinks();
  if (editError) {
    return (
      <div className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-red-600 px-4 py-3 text-sm text-white shadow-2xl">
        {editError}
        <button type="button" onClick={() => setEditError(null)} className="font-semibold">
          OK
        </button>
      </div>
    );
  }
  if (!editKey) return null;

  const missing = ALL_RELEASES.filter((r) => !r.spotify && !links[releaseKey(r)]);
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

// Shown under a card in edit mode: find it on Spotify, paste the share link, save.
export function SpotifyLinkEditor({ release }) {
  const { save } = useSpotifyLinks();
  const [open, setOpen] = useState(!release.spotify);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const search = `https://open.spotify.com/search/${encodeURIComponent(`Russ ${release.title}`)}`;

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
      <a href={search} target="_blank" rel="noreferrer" className="block font-semibold uppercase tracking-[0.15em] text-white/80 hover:text-white">
        1. Find it on Spotify &#8599;
      </a>
      <label className="block text-white/60" htmlFor={`link-${releaseKey(release)}`}>
        2. Share › Copy link, then paste it here
      </label>
      <input
        id={`link-${releaseKey(release)}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://open.spotify.com/..."
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
        {release.spotify && (
          <button type="button" onClick={() => setOpen(false)} className="px-2 py-1.5 opacity-70">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
