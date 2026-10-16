"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { m, useInView, useScroll, useSpring } from "framer-motion";
import { ERAS } from "@/data/eras";
import { singlesWithDrops } from "@/data/drops";
import { useSpotifyLinks } from "./SpotifyLinks";
import EraSection from "./EraSection";
import YearSection from "./YearSection";
import Link from "next/link";
import ListenToggle from "./ListenToggle";

export const TAB_EVENT = "russ:music-tab";
// Sent whenever the shown tab changes, so the header can mark Albums or Singles.
export const TAB_SHOWN_EVENT = "russ:music-tab-shown";

const TABS = [
  { key: "albums", label: "Albums" },
  { key: "singles", label: "Singles" },
];

const COPY = {
  albums: {
    title: "Seven eras. One rule: do it yourself.",
    sub: "Every album and EP, era by era. Hover any cover to play it right here, on Spotify, YouTube Music or SoundCloud (pick with the round button). The page changes color as each era takes over.",
  },
  singles: {
    title: "The big singles, year by year.",
    sub: "A pick of the standouts from each year, from the 2015 SoundCloud run to the newest drops. Hover any single to play it, or open the Full discography for every release.",
  },
};

export default function Timeline() {
  const ref = useRef(null);
  const [tab, setTab] = useState("albums");
  const { drops } = useSpotifyLinks();
  const singles = useMemo(() => singlesWithDrops(drops), [drops]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const inView = useInView(ref, { margin: "-40% 0px -40% 0px" });

  const sections =
    tab === "albums"
      ? ERAS.map((era) => ({ id: `era-${era.id}`, label: era.title }))
      : singles.map((g) => ({ id: `year-${g.year}`, label: String(g.year) }));
  const active = useActiveSection(sections);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(TAB_SHOWN_EVENT, { detail: tab }));
  }, [tab]);

  // The menu's Singles link and a #singles URL both open that tab.
  useEffect(() => {
    const show = (key) => {
      setTab(key);
      requestAnimationFrame(() => document.getElementById("music")?.scrollIntoView({ behavior: "smooth" }));
    };
    if (window.location.hash === "#singles") show("singles");
    const onTab = (e) => show(e.detail);
    const onHash = () => window.location.hash === "#singles" && show("singles");
    window.addEventListener(TAB_EVENT, onTab);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener(TAB_EVENT, onTab);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const choose = (key) => {
    if (key === tab) return;
    setTab(key);
    const top = document.getElementById("music-tabs");
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView();
  };

  return (
    <div id="music" ref={ref} className="relative scroll-mt-16">
      <header className="mx-auto max-w-7xl px-4 pb-6 pt-24 sm:px-6 sm:pt-32">
        <p className="text-xs uppercase tracking-[0.35em] text-era-muted">The music, 2011 to now</p>
        <m.h2
          key={tab}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-4xl font-display text-5xl uppercase leading-[0.95] sm:text-7xl"
        >
          {COPY[tab].title}
        </m.h2>
        <p className="mt-6 max-w-xl text-era-muted">{COPY[tab].sub}</p>
      </header>

      {/* Sticky tab switch, so you can flip timelines from anywhere in the section. */}
      <div id="music-tabs" className="sticky top-16 z-30 scroll-mt-16 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="Timeline" className="inline-flex rounded-full border border-era-fg/15 bg-era-bg/90 p-1 shadow-lg">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  aria-controls="music-panel"
                  onClick={() => choose(t.key)}
                  className={`relative rounded-full px-4 py-2 text-xs sm:px-5 font-semibold uppercase tracking-[0.2em] transition-colors ${
                    tab === t.key ? "text-era-bg" : "text-era-fg/70 hover:text-era-fg"
                  }`}
                >
                  {tab === t.key && (
                    <m.span layoutId="music-tab-pill" className="absolute inset-0 rounded-full bg-era-accent" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                  )}
                  <span className="relative">{t.label}</span>
                </button>
              ))}
            </div>
            <ListenToggle />
          </div>
          <Link
            href="/music"
            className="rounded-full border border-era-fg/15 bg-era-bg/90 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-era-fg/80 shadow-lg transition-colors hover:text-era-fg"
          >
            <span className="sm:hidden">All</span>
            <span className="hidden sm:inline">Full discography</span> <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Progress rail (desktop). */}
      <div className="pointer-events-none absolute bottom-0 left-4 top-0 hidden xl:block">
        <div className="sticky top-1/2 -translate-y-1/2">
          <div className="relative h-[50vh] w-px bg-era-fg/15">
            <m.div style={{ scaleY: progress }} className="absolute inset-0 origin-top bg-era-accent" />
          </div>
        </div>
      </div>
      <nav
        aria-label={tab === "albums" ? "Eras" : "Years"}
        className={`fixed right-4 top-1/2 z-30 hidden max-h-[80vh] -translate-y-1/2 flex-col gap-3 transition-opacity duration-500 xl:flex ${
          inView ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="group flex items-center justify-end gap-3">
            <span
              className={`text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
                active === section.id ? "text-era-fg opacity-100" : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"
              }`}
            >
              {section.label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                active === section.id ? "h-3 w-3 bg-era-accent" : "h-1.5 w-1.5 bg-era-fg/40 group-hover:bg-era-fg"
              }`}
            />
          </a>
        ))}
      </nav>

      <div id="music-panel" role="tabpanel">
        {tab === "albums"
          ? ERAS.map((era, i) => <EraSection key={era.id} era={era} number={i + 1} />)
          : singles.map((group) => <YearSection key={group.year} group={group} />)}
      </div>
    </div>
  );
}

function useActiveSection(sections) {
  const [active, setActive] = useState(null);
  const ids = sections.map((s) => s.id).join(",");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    ids.split(",").forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}
