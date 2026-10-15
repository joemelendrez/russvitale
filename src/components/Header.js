"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NAV, SITE } from "@/data/site";
import { TAB_EVENT } from "./Timeline";

// Albums and Singles both live in the Music section; the link picks the tab.
function openTab(e, item) {
  if (!item.tab) return;
  e.preventDefault();
  history.replaceState(null, "", item.href);
  window.dispatchEvent(new CustomEvent(TAB_EVENT, { detail: item.tab }));
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The admin page has its own simple layout; the section links point at the home page.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled && !open
            ? "border-b border-era-fg/10 bg-era-bg/95 md:bg-era-bg/70 md:backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="group flex items-baseline gap-2" onClick={() => setOpen(false)}>
            <span className="font-display text-2xl tracking-wide">RUSS</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-era-muted transition-colors group-hover:text-era-accent">
              fan archive
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => openTab(e, item)}
                className="relative text-sm uppercase tracking-[0.2em] text-era-fg/80 transition-colors hover:text-era-fg after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-era-accent after:transition-transform hover:after:scale-x-100"
              >
                {item.label}
              </a>
            ))}
            <a
              href={SITE.spotifyArtist}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-era-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-era-bg transition-transform hover:scale-105"
            >
              Listen
            </a>
          </nav>

          <button
            type="button"
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <motion.span animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} className="h-px w-6 bg-era-fg" />
            <motion.span animate={open ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }} className="h-px w-6 bg-era-fg" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-era-bg px-4 pb-10 pt-24 md:hidden"
          >
            <nav className="flex flex-col gap-2" aria-label="Mobile">
              {NAV.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    setOpen(false);
                    openTab(e, item);
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07 }}
                  className="font-display text-6xl uppercase leading-none tracking-tight"
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>
            <div className="flex flex-col gap-3 text-sm text-era-muted">
              <a href={SITE.spotifyArtist} target="_blank" rel="noreferrer" className="text-era-accent">
                Listen on Spotify
              </a>
              <a href={SITE.officialSite} target="_blank" rel="noreferrer">
                Official site: russworld.com
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
