"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DEFAULT_PALETTE, ERAS, eraForYear } from "@/data/eras";
import { singlesWithDrops } from "@/data/drops";
import { CATALOG_SINGLES_BY_YEAR } from "@/data/catalog";
import { SERVICES, listenLink, playerFor } from "@/data/players";
import { releaseKey } from "@/data/releaseKey";
import { clearNowPlaying, serviceOfPlayer, setNowPlaying, useListenOn } from "@/lib/listenOn";
import { CoverEditor, DateEditor, SpotifyLinkEditor, useSpotifyLinks, withSavedLinks } from "./SpotifyLinks";
import ListenToggle, { ServiceMark } from "./ListenToggle";
import PlayerFrame from "./PlayerFrame";
import { applyPalette } from "./usePalette";

const TYPE_LABEL = { album: "Album", ep: "EP", single: "Single" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "album", label: "Albums" },
  { key: "ep", label: "EPs" },
  { key: "single", label: "Singles" },
  { key: "drop", label: "Drops" },
  { key: "nodate", label: "No date yet", editOnly: true },
];

// "2019-03-08" → "Mar 8, 2019" (UTC, so the server and browser agree).
function formatDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// A release's year, from its date when one is set.
const yearOf = (r) => (r.date ? Number(r.date.slice(0, 4)) : r.year);

const HAS = { spotify: (r) => r.spotify, youtube: (r) => r.youtube, soundcloud: (r) => r.soundcloud };

// Every album, EP, single and drop in one searchable list, newest first,
// each with the same players as the timeline and its saved links and covers.
export default function Discography() {
  const { links, drops, editing } = useSpotifyLinks();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [newest, setNewest] = useState(true);
  const [openKey, setOpenKey] = useState(null);

  // Coming from the timeline, the page may still be in an era's colors.
  useEffect(() => applyPalette(DEFAULT_PALETTE), []);
  useEffect(() => () => clearNowPlaying("discography"), []);

  const all = useMemo(() => {
    const albums = ERAS.flatMap((era) => era.releases.map((r) => ({ ...r, era })));
    const singles = singlesWithDrops(drops, CATALOG_SINGLES_BY_YEAR).flatMap((g) => g.singles.map((s) => ({ ...s, year: s.year ?? g.year })));
    return [...albums, ...singles].map((r) => {
      const saved = withSavedLinks(r, links[releaseKey(r)]);
      const shownYear = yearOf(saved);
      return { ...saved, shownYear, era: saved.era ?? eraForYear(shownYear) };
    });
  }, [links, drops]);

  const counts = useMemo(() => {
    const c = { all: all.length, album: 0, ep: 0, single: 0, drop: 0, nodate: 0 };
    for (const r of all) {
      c[r.type] += 1;
      if (r.dropId) c.drop += 1;
      if (!r.date) c.nodate += 1;
    }
    return c;
  }, [all]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = all.filter((r) => {
      if (filter === "drop") {
        if (!r.dropId) return false;
      } else if (filter === "nodate") {
        if (r.date || !editing) return false;
      } else if (filter !== "all" && r.type !== filter) return false;
      if (!q) return true;
      return `${r.title} ${r.shownYear} ${r.date ? formatDate(r.date) : ""} ${r.era?.title ?? ""} ${TYPE_LABEL[r.type]}`.toLowerCase().includes(q);
    });
    // By date where there is one; within a year, undated releases go after
    // dated ones, albums before EPs before singles, then by title.
    const rank = { album: 0, ep: 1, single: 2 };
    const dir = newest ? -1 : 1;
    list.sort(
      (a, b) =>
        dir * (a.shownYear - b.shownYear) ||
        (a.date && b.date ? dir * a.date.localeCompare(b.date) : Boolean(b.date) - Boolean(a.date)) ||
        rank[a.type] - rank[b.type] ||
        a.title.localeCompare(b.title)
    );
    const groups = [];
    for (const r of list) {
      const last = groups[groups.length - 1];
      if (last?.year === r.shownYear) last.items.push(r);
      else groups.push({ year: r.shownYear, items: [r] });
    }
    return groups;
  }, [all, query, filter, newest, editing]);

  const total = shown.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan archive</p>
      <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">Every release</h1>
      <p className="mt-6 max-w-xl text-era-muted">
        {counts.album} albums, {counts.ep} EPs and {counts.single} singles, from the Diemon days to the newest drops. Tap any one to play it on the
        service you pick with the round button. The list follows Wikipedia&apos;s Russ discography; songs that only live on his albums are on the
        album pages of each service.
      </p>

      <div className="sticky top-16 z-30 -mx-4 mt-10 space-y-3 bg-era-bg/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Search releases</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-era-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, year or era"
              className="h-11 w-full rounded-full border border-era-fg/15 bg-era-fg/5 pl-10 pr-4 text-sm text-era-fg placeholder:text-era-muted focus:border-era-accent focus:outline-none"
            />
          </label>
          <ListenToggle />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {FILTERS.filter((f) => (f.key !== "drop" || counts.drop > 0) && (!f.editOnly || editing)).map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors ${
                filter === f.key ? "border-era-accent bg-era-accent text-era-bg" : "border-era-fg/15 text-era-fg/70 hover:text-era-fg"
              }`}
            >
              {f.label} <span className="opacity-60">{counts[f.key]}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setNewest((v) => !v)}
            className="ml-auto shrink-0 rounded-full border border-era-fg/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-era-fg/70 hover:text-era-fg"
          >
            {newest ? "Newest first" : "Oldest first"} <span aria-hidden="true">&#8645;</span>
          </button>
        </div>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.25em] text-era-muted" aria-live="polite">
        {total === all.length ? `${total} releases` : `${total} of ${all.length} releases`}
      </p>

      {shown.length === 0 && (
        <div className="mt-10 rounded-2xl border border-era-fg/10 p-8 text-center text-era-muted">
          Nothing matches &ldquo;{query}&rdquo;.{" "}
          <button type="button" className="underline" onClick={() => setQuery("")}>
            Clear the search
          </button>
        </div>
      )}

      {shown.map((group) => (
        <section key={group.year} className="mt-10" aria-labelledby={`y-${group.year}`}>
          <h2 id={`y-${group.year}`} className="flex items-baseline gap-3 border-b border-era-fg/10 pb-3">
            <span className="font-display text-3xl">{group.year}</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-era-muted">{group.items[0].era?.title} era</span>
          </h2>
          <ul className="divide-y divide-era-fg/10">
            {group.items.map((r) => {
              const key = releaseKey(r);
              return (
                <ReleaseRow
                  key={`${key}-${r.dropId ?? ""}`}
                  release={r}
                  open={openKey === key}
                  editing={editing}
                  onToggle={() => setOpenKey((k) => (k === key ? null : key))}
                />
              );
            })}
          </ul>
        </section>
      ))}

      <p className="mt-16 text-xs leading-relaxed text-era-muted">
        An unofficial fan site, not affiliated with Russ, Diemon or any label. Music plays through the official Spotify, YouTube and SoundCloud
        players; nothing is hosted or sold here.
      </p>
    </div>
  );
}

function ReleaseRow({ release, open, editing, onToggle }) {
  const service = useListenOn();
  const player = playerFor(release, service);
  const listen = listenLink(release, service);
  const palette = release.era?.palette ?? DEFAULT_PALETTE;
  const playingOn = serviceOfPlayer(player);

  // The Play on button shows the service this row plays on while it's open.
  useEffect(() => {
    if (open && playingOn) setNowPlaying("discography", playingOn);
    else if (open) clearNowPlaying("discography");
  }, [open, playingOn]);

  return (
    <li data-missing={editing && (!player || !release.date) ? "" : undefined}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-4 py-3 text-left">
        <Thumb release={release} palette={palette} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold sm:text-lg">{release.title}</span>
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.18em] text-era-muted">
            {TYPE_LABEL[release.type]}
            {release.dropId ? " · New drop" : ""} &middot; {release.date ? formatDate(release.date) : release.shownYear}
          </span>
        </span>
        <span className="hidden items-center gap-1.5 sm:flex" aria-label={`On ${SERVICES.filter((s) => HAS[s.key](release)).map((s) => s.label).join(", ") || "no service yet"}`}>
          {SERVICES.map((s) => (
            <span key={s.key} className={HAS[s.key](release) ? "" : "opacity-20 grayscale"} title={HAS[s.key](release) ? s.label : `Not linked on ${s.label} yet`}>
              <ServiceMark service={s.key} className="h-4 w-4" />
            </span>
          ))}
        </span>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors"
          style={open ? { background: palette.accent, color: palette.bg } : { border: "1px solid color-mix(in srgb, var(--fg) 20%, transparent)" }}
          aria-hidden="true"
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-5 sm:pl-[4.5rem]">
              {player ? (
                <PlayerFrame player={player} title={release.title} />
              ) : (
                <a href={listen.href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-era-fg/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em]">
                  Find it on {listen.label}
                  <span aria-hidden="true">&#8599;</span>
                </a>
              )}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-era-muted">
                {release.era && <span>{release.era.title} era</span>}
                {SERVICES.filter((s) => HAS[s.key](release)).map((s) => (
                  <a key={s.key} href={listenLink(release, s.key).href} target="_blank" rel="noreferrer" className="hover:text-era-fg">
                    Open on {s.label} &#8599;
                  </a>
                ))}
              </div>
              {editing && (
                <div className="mt-3">
                  <DateEditor release={release} />
                  <CoverEditor release={release} />
                  <SpotifyLinkEditor key={`${service}-${player?.key ?? "none"}`} release={release} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function Thumb({ release, palette }) {
  return (
    <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg shadow-lg" style={{ background: palette.bg }}>
      {release.cover ? (
        <Image src={release.cover} alt="" fill sizes="56px" className="object-cover" />
      ) : (
        <>
          <span
            className="absolute -right-3 -top-3 h-11 w-11 rounded-full"
            style={{ background: `radial-gradient(circle at center, ${palette.accent} 0 18%, ${palette.bg} 19% 21%, #000 22%)` }}
          />
          <span className="absolute bottom-1 left-1.5 right-1 truncate font-display text-[11px] uppercase leading-none" style={{ color: palette.fg }}>
            {release.title}
          </span>
        </>
      )}
    </span>
  );
}
