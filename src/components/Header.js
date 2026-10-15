"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SITE, navMenu } from "@/data/site";
import { fanAccounts, supabase } from "@/lib/supabase";
import { displayName, useSession } from "@/lib/useSession";
import { TAB_EVENT } from "./Timeline";

const MENU = navMenu();

const linkStyle =
  "relative whitespace-nowrap text-xs uppercase tracking-[0.2em] text-era-fg/80 lg:text-sm transition-colors hover:text-era-fg after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-era-accent after:transition-transform hover:after:scale-x-100";

// Section links point at the home page; off it they need the leading "/".
function navHref(item, onHome) {
  return item.page || onHome ? item.href : `/${item.href}`;
}

// Albums and Singles both live in the Music section; the link picks the tab.
function openTab(e, item, onHome) {
  if (!item.tab || !onHome) return;
  e.preventDefault();
  history.replaceState(null, "", item.href);
  window.dispatchEvent(new CustomEvent(TAB_EVENT, { detail: item.tab }));
}

// A header dropdown: opens on click, closes on Escape, a click outside, or
// picking a link. `label` is the button's content.
function Dropdown({ label, ariaLabel, align = "left", buttonClass, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      ref.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.target.closest("a") && setOpen(false)}>
      <button type="button" aria-expanded={open} aria-haspopup="true" aria-label={ariaLabel} onClick={() => setOpen((v) => !v)} className={buttonClass}>
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-full z-50 mt-4 min-w-52 rounded-2xl border border-era-fg/10 bg-era-bg/95 p-2 shadow-2xl backdrop-blur-xl ${align === "right" ? "right-0" : "-left-4"}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const itemStyle = "block w-full rounded-xl px-3 py-2.5 text-left text-sm text-era-fg/80 transition-colors hover:bg-era-fg/[0.07] hover:text-era-fg";

const chevron = (
  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2.5 4.5 6 8l3.5-3.5" />
  </svg>
);

function Account({ session }) {
  const pathname = usePathname();
  if (!fanAccounts || session === undefined) return null;
  if (!session) {
    const next = pathname && pathname !== "/" && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <a href={`/login${next}`} className={linkStyle}>
        Sign in
      </a>
    );
  }
  const name = displayName(session);
  return (
    <Dropdown
      align="right"
      ariaLabel={`Your account (${session.user.email})`}
      buttonClass="grid h-9 w-9 place-items-center rounded-full border border-era-fg/20 font-display text-base uppercase text-era-fg transition-colors hover:border-era-accent"
      label={name.slice(0, 1) || "?"}
    >
      <p className="truncate px-3 pb-2 pt-1 text-xs text-era-muted">{session.user.email}</p>
      <a href="/favorites" className={itemStyle}>
        Your favorites
      </a>
      <a href="/top10" className={itemStyle}>
        Your top 10
      </a>
      <button type="button" onClick={() => supabase.auth.signOut()} className={itemStyle}>
        Sign out
      </button>
    </Dropdown>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";
  const session = useSession();

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
          <a href={onHome ? "#top" : "/"} className="group flex items-baseline gap-2" onClick={() => setOpen(false)}>
            <span className="font-display text-2xl tracking-wide">RUSS</span>
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-era-muted transition-colors group-hover:text-era-accent">
              fan archive
            </span>
          </a>

          <nav className="hidden items-center gap-5 md:flex lg:gap-8" aria-label="Main">
            {MENU.map((entry) =>
              entry.group ? (
                <Dropdown key={entry.group} label={<span className="flex items-center gap-1.5">{entry.group} {chevron}</span>} buttonClass={linkStyle}>
                  {entry.items.map((item) => (
                    <a key={item.href} href={navHref(item, onHome)} onClick={(e) => openTab(e, item, onHome)} className={itemStyle}>
                      {item.label}
                    </a>
                  ))}
                </Dropdown>
              ) : (
                <a key={entry.href} href={navHref(entry, onHome)} onClick={(e) => openTab(e, entry, onHome)} className={linkStyle}>
                  {entry.label}
                </a>
              )
            )}
            <Account session={session} />
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
            className="fixed inset-0 z-40 flex flex-col justify-between gap-8 bg-era-bg px-4 pb-10 pt-24 md:hidden"
          >
            <nav className="flex min-h-0 flex-col gap-2 overflow-y-auto" aria-label="Mobile" data-lenis-prevent>
              {MENU.map((entry, i) => {
                const link = (item, small) => (
                  <a
                    key={item.href}
                    href={navHref(item, onHome)}
                    onClick={(e) => {
                      setOpen(false);
                      openTab(e, item, onHome);
                    }}
                    className={`font-display uppercase leading-none tracking-tight ${small ? "text-4xl" : "text-6xl"}`}
                  >
                    {item.label}
                  </a>
                );
                return (
                  <motion.div
                    key={entry.group ?? entry.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.07 }}
                  >
                    {entry.group ? (
                      <div className="mb-3 border-l border-era-accent/60 pl-4">
                        <p className="mb-2 text-[11px] uppercase tracking-[0.3em] text-era-muted">{entry.group}</p>
                        <div className="flex flex-col gap-2">{entry.items.map((item) => link(item, true))}</div>
                      </div>
                    ) : (
                      link(entry)
                    )}
                  </motion.div>
                );
              })}
            </nav>
            <div className="flex flex-col gap-3 text-sm text-era-muted">
              {fanAccounts && session === null && (
                <a href="/login" onClick={() => setOpen(false)} className="text-era-fg">
                  Sign in or sign up
                </a>
              )}
              {session && (
                <button type="button" onClick={() => supabase.auth.signOut()} className="text-left">
                  Signed in as {session.user.email}. Sign out
                </button>
              )}
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
