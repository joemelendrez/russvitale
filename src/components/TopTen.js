"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { DEFAULT_PALETTE } from "@/data/eras";
import { featureCredit } from "@/data/features";
import { releaseKey } from "@/data/releaseKey";
import { useFavorites } from "@/lib/favorites";
import { clearNowPlaying } from "@/lib/listenOn";
import { getSupabase, supabaseConfigured } from "@/lib/supabaseConfig";
import { TOP10_MAX, setTop10, useTop10 } from "@/lib/top10";
import { ReleaseRow, TYPE_LABEL, useAllReleases } from "./Discography";
import ConfirmDialog from "./ConfirmDialog";
import FavoritesAccount from "./FavoritesAccount";
import MostLoved from "./MostLoved";
import { applyPalette } from "./usePalette";
import AlbumSwatches, { swatchAt } from "@/components/AlbumSwatches";

const pill = "rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] disabled:opacity-40";

const metaOf = (r) => (r.type === "feature" ? featureCredit(r) : `${TYPE_LABEL[r.type]} · ${r.shownYear}`);

// Waits until `value` has stopped changing for `ms`, so the preview image
// isn't rebuilt on every drag.
function useSettled(value, ms) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return settled;
}

// A short link for a list (russvitale.com/t/<code>), fetched once the list
// settles. Until it arrives, or if it can't be made, the long ?l= link works.
function useShortCode(list) {
  const [codes, setCodes] = useState({});
  useEffect(() => {
    if (!list || !supabaseConfigured || codes[list] !== undefined) return;
    let live = true;
    getSupabase()
      .then((supabase) => supabase.rpc("russ_top10_link", { p_keys: list.split(",") }))
      .then(({ data, error }) => {
        if (live) setCodes((c) => ({ ...c, [list]: error ? null : data }));
      });
    return () => {
      live = false;
    };
  }, [list, codes]);
  return list ? codes[list] : undefined;
}

// /top10: build your Russ top 10 and share it as a picture or a link.
// With ?l= it shows the list someone shared, playable, with a way to make
// your own.
export default function TopTen({ shared }) {
  useEffect(() => applyPalette(DEFAULT_PALETTE), []);
  useEffect(() => () => clearNowPlaying("discography"), []);
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      {shared ? <SharedList keys={shared} /> : <Builder />}
      <MostLoved />
      <p className="mt-16 text-xs leading-relaxed text-era-muted">
        An unofficial fan site, not affiliated with Russ, Diemon or any label. Music plays through the official Spotify, YouTube and SoundCloud
        players; nothing is hosted or sold here.
      </p>
    </div>
  );
}

function SharedList({ keys }) {
  const all = useAllReleases();
  const [openKey, setOpenKey] = useState(null);
  const byKey = useMemo(() => new Map(all.map((r) => [releaseKey(r), r])), [all]);
  const list = keys.filter((k) => byKey.has(k));
  const mine = useTop10();

  return (
    <>
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">A fan&apos;s picks</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
        Their Russ <span className="text-era-accent">top 10</span>
      </h1>
      <p className="mt-6 max-w-xl text-era-muted">Someone shared their top {list.length} with you. Tap a song to play it.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/top10" className={`${pill} bg-era-accent text-era-bg`}>
          Make your own top 10
        </Link>
        {!mine.length && (
          <button type="button" onClick={() => setTop10(list)} className={`${pill} border border-era-fg/15`}>
            Start from this list
          </button>
        )}
      </div>
      <ol className="mt-8 divide-y divide-era-fg/10">
        {list.map((key, i) => (
          <li key={key} className="flex items-start gap-3">
            <span className="cover-ink mt-5 w-8 shrink-0 text-right font-display text-2xl" style={{ "--cover": swatchAt(i) }}>
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <ReleaseRow
                as="div"
                release={byKey.get(key)}
                open={openKey === key}
                editing={false}
                onToggle={() => setOpenKey((k) => (k === key ? null : key))}
              />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Builder() {
  const keys = useTop10();
  const favorites = useFavorites();
  const all = useAllReleases();
  const [query, setQuery] = useState("");

  const byKey = useMemo(() => new Map(all.map((r) => [releaseKey(r), r])), [all]);
  const list = keys.filter((k) => byKey.has(k));
  const full = list.length >= TOP10_MAX;

  // Clear asks first, then offers Undo for a few seconds.
  const [asking, setAsking] = useState(false);
  const [undo, setUndo] = useState(null);
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);
  const clearAll = () => {
    setUndo(list);
    setTop10([]);
    setAsking(false);
  };

  const add = (key) => !full && !list.includes(key) && setTop10([...list, key]);
  const remove = (key) => setTop10(list.filter((k) => k !== key));
  const move = (key, by) => {
    const i = list.indexOf(key);
    const j = i + by;
    if (i === -1 || j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setTop10(next);
  };

  // Punctuation-blind, so "aint" finds "Ain't".
  const norm = (t) =>
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const q = norm(query);
  const results = !q
    ? []
    : all
        .filter((r) => !list.includes(releaseKey(r)) && norm(`${r.title} ${r.artist ?? ""}`).includes(q))
        .sort((a, b) => Number(!norm(a.title).startsWith(q)) - Number(!norm(b.title).startsWith(q)))
        .slice(0, 8);
  const fromFavorites = favorites.filter((k) => byKey.has(k) && !list.includes(k));

  return (
    <>
      <AlbumSwatches className="mb-6" />
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan archive</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">
        Your Russ <span className="text-era-accent">top 10</span>
      </h1>
      <p className="mt-6 max-w-xl text-era-muted">
        Pick your 10, drag them into order, then share the picture or the link. It&apos;s saved on this device.
      </p>
      <FavoritesAccount path="/top10" what="your top 10" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-3xl uppercase">
              {list.length} of {TOP10_MAX}
            </h2>
            {list.length > 0 && (
              <button
                type="button"
                onClick={() => setAsking(true)}
                className="text-sm text-era-muted underline hover:text-era-fg"
              >
                Clear
              </button>
            )}
          </div>
          <ConfirmDialog
            open={asking}
            title="Clear your top 10?"
            body={`All ${list.length} picks come off this list. Your favorites stay saved.`}
            confirmLabel="Clear it"
            cancelLabel="Keep it"
            danger
            onConfirm={clearAll}
            onCancel={() => setAsking(false)}
          />
          {undo && (
            <div role="status" className="fixed inset-x-3 bottom-4 z-[70] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-full bg-era-fg px-5 py-3 text-sm text-era-bg shadow-2xl">
              Top 10 cleared
              <button
                type="button"
                onClick={() => {
                  setTop10(undo);
                  setUndo(null);
                }}
                className="font-semibold uppercase tracking-[0.15em] underline"
              >
                Undo
              </button>
            </div>
          )}

          {list.length > 0 && (
            <Reorder.Group axis="y" values={list} onReorder={setTop10} as="ol" className="mt-4 space-y-2">
              {list.map((key, i) => (
                <PickItem key={key} id={key} index={i} release={byKey.get(key)} onMove={(by) => move(key, by)} onRemove={() => remove(key)} />
              ))}
            </Reorder.Group>
          )}

          {!full && (
            <div className="mt-6">
              <label htmlFor="top10-search" className="mb-2 block text-sm text-era-muted">
                Add a song, album or feature
              </label>
              <input
                id="top10-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Russ songs"
                autoComplete="off"
                className="w-full rounded-full border border-era-fg/15 bg-transparent px-5 py-3 text-base text-era-fg placeholder:text-era-muted/60"
              />
              {q && (
                <ul className="mt-3 divide-y divide-era-fg/10 rounded-2xl border border-era-fg/10">
                  {results.length === 0 && <li className="px-4 py-3 text-sm text-era-muted">No songs match &ldquo;{query.trim()}&rdquo;.</li>}
                  {results.map((r) => (
                    <li key={releaseKey(r)}>
                      <button
                        type="button"
                        onClick={() => {
                          add(releaseKey(r));
                          setQuery("");
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-era-fg/[0.05]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{r.title}</span>
                          <span className="block text-[11px] uppercase tracking-[0.18em] text-era-muted">{metaOf(r)}</span>
                        </span>
                        <span className="text-xl text-era-accent" aria-hidden="true">
                          +
                        </span>
                        <span className="sr-only">Add</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!q && fromFavorites.length > 0 && (
                <FavoritesPicker
                  keys={fromFavorites}
                  byKey={byKey}
                  onAdd={add}
                  onFill={() => setTop10([...list, ...fromFavorites].slice(0, TOP10_MAX))}
                />
              )}
              {!q && list.length === 0 && fromFavorites.length === 0 && (
                <p className="mt-3 text-sm text-era-muted">
                  Tip: heart songs on{" "}
                  <Link href="/music" className="underline">
                    the full list
                  </Link>{" "}
                  and they show up here to pick from.
                </p>
              )}
            </div>
          )}
        </div>

        <SharePanel list={list} />
      </div>
    </>
  );
}

// Favorites to pick from, folded into one row so a long list of hearts
// doesn't push the page down. Opens to a list with its own scroll.
function FavoritesPicker({ keys, byKey, onAdd, onFill }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-5 rounded-2xl border border-era-fg/10">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="top10-favorites"
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
        >
          <span className="text-era-accent" aria-hidden="true">
            &hearts;
          </span>
          <span className="font-semibold">From your favorites</span>
          <span className="text-era-muted">{keys.length}</span>
          <svg
            viewBox="0 0 24 24"
            className={`ml-auto h-4 w-4 shrink-0 text-era-muted transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" onClick={onFill} className="shrink-0 text-sm text-era-fg underline-offset-4 hover:underline">
          Fill
        </button>
      </div>
      {open && (
        <ul id="top10-favorites" className="max-h-72 overflow-y-auto overscroll-contain border-t border-era-fg/10 py-1" data-lenis-prevent>
          {keys.map((k) => {
            const r = byKey.get(k);
            return (
              <li key={k}>
                <button type="button" onClick={() => onAdd(k)} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-era-fg/5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.title}</span>
                    <span className="block text-[11px] uppercase tracking-[0.18em] text-era-muted">{metaOf(r)}</span>
                  </span>
                  <span className="text-xl text-era-accent" aria-hidden="true">
                    +
                  </span>
                  <span className="sr-only">Add {r.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PickItem({ id, index, release, onMove, onRemove }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      style={{ borderColor: swatchAt(index) }}
      className="flex items-center gap-3 rounded-2xl border-2 bg-era-bg px-3 py-2.5"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            onMove(e.key === "ArrowUp" ? -1 : 1);
          }
        }}
        aria-label={`Move ${release.title}, number ${index + 1}. Use the up and down arrow keys.`}
        style={{ "--cover": swatchAt(index) }}
        className="cover-ink flex w-9 shrink-0 cursor-grab touch-none items-center justify-center font-display text-2xl active:cursor-grabbing"
      >
        {index + 1}
      </button>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{release.title}</span>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-era-muted">{metaOf(release)}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-era-fg/30" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="7" r="1.5" />
        <circle cx="15" cy="7" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="17" r="1.5" />
        <circle cx="15" cy="17" r="1.5" />
      </svg>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${release.title}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-era-fg/50 hover:text-era-fg"
      >
        &times;
      </button>
    </Reorder.Item>
  );
}

function SharePanel({ list }) {
  const [format, setFormat] = useState("square");
  const [status, setStatus] = useState(null);
  const settled = useSettled(list.join(","), 600);
  const code = useShortCode(settled);
  const [loaded, setLoaded] = useState(null);

  if (!list.length) {
    return (
      <aside className="rounded-3xl border border-dashed border-era-fg/15 p-6 text-sm text-era-muted lg:sticky lg:top-24 lg:self-start">
        Your picture shows up here once you add a song.
      </aside>
    );
  }

  const params = `l=${settled}`;
  const imageUrl = `/top10/image?${params}&format=${format}`;
  const pageUrl = code ? `${window.location.origin}/t/${code}` : `${window.location.origin}/top10?${params}`;
  const fileName = `my-russ-top-10${format === "story" ? "-story" : ""}.png`;

  const flash = (s) => {
    setStatus(s);
    setTimeout(() => setStatus(null), 2500);
  };

  const download = (blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const shareImage = async () => {
    setStatus("working");
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Russ top 10",
          text: `My Russ top 10 ${pageUrl}`,
        });
        setStatus(null);
      } else {
        download(blob);
        flash("saved");
      }
    } catch (e) {
      setStatus(e?.name === "AbortError" ? null : "failed");
    }
  };

  const copyLink = async () => {
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "My Russ top 10", url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      flash("copied");
    } catch {}
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="flex gap-1 rounded-full border border-era-fg/10 p-1" role="group" aria-label="Picture size">
        {[
          ["square", "Post"],
          ["story", "Story"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={format === key}
            onClick={() => setFormat(key)}
            className={`flex-1 rounded-full py-2 text-[11px] font-semibold uppercase tracking-[0.15em] ${format === key ? "bg-era-fg text-era-bg" : "text-era-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`relative mx-auto mt-4 overflow-hidden rounded-2xl border border-era-fg/10 bg-era-fg/[0.03] ${format === "story" ? "aspect-[9/16] max-w-[16rem]" : "aspect-square"}`}
      >
        {/* A plain img: the picture is drawn on request by /top10/image. */}
        {settled && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={imageUrl}
            src={imageUrl}
            alt="Preview of your top 10 picture"
            onLoad={() => setLoaded(imageUrl)}
            className={`h-full w-full shrink-0 object-cover transition-opacity duration-300 ${loaded === imageUrl ? "opacity-100" : "opacity-0"}`}
          />
        )}
        {loaded !== imageUrl && <span className="absolute inset-0 grid place-items-center text-sm text-era-muted">Drawing...</span>}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={shareImage} disabled={status === "working"} className={`${pill} bg-era-accent text-era-bg`}>
          {status === "working" ? "Getting it ready..." : status === "saved" ? "Saved" : "Share the picture"}
        </button>
        <button type="button" onClick={copyLink} className={`${pill} border border-era-fg/15`}>
          {status === "copied" ? "Link copied" : "Share the link"}
        </button>
      </div>
      {status === "failed" && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          Couldn&apos;t get the picture. Try again.
        </p>
      )}
      <p className="mt-3 text-xs text-era-muted">The link opens your list here, and shows the picture when you paste it in a chat or post.</p>
    </aside>
  );
}
