"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { SITE, navMenu } from "@/data/site";
import { fanAccounts, getSupabase } from "@/lib/supabaseConfig";
import { displayName, useSession } from "@/lib/useSession";
import { TAB_EVENT, TAB_SHOWN_EVENT } from "./Timeline";
import AppIcon from "./AppIcon";
import ThemeToggle, { ThemeChoices } from "./ThemeToggle";

const MENU = navMenu();

// Over the home page's photo the header stays light in light mode too.
const OVER_PHOTO = { color: "#f5f5f4", "--fg": "#f5f5f4", "--muted": "#d4d4d8", "--color-era-fg": "#f5f5f4", "--color-era-muted": "#d4d4d8" };

const linkBase =
  "relative whitespace-nowrap text-xs uppercase tracking-[0.2em] lg:text-sm transition-colors duration-200 after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:rounded-full after:bg-era-accent after:transition-transform after:duration-300";
// The page (or home section) you're on keeps the accent color and underline;
// the others brighten and draw the underline on hover.
const linkStyle = (active) =>
  `${linkBase} ${active ? "text-era-accent after:scale-x-100" : "text-era-fg/75 hover:text-era-fg after:scale-x-0 hover:after:scale-x-100"}`;

const SECTIONS = ["music", "shows", "watch", "about"];

// Whether a menu link points at where the visitor is: a page by its path, a
// home section by the one under the header, Albums/Singles by the music tab.
function isActive(item, { pathname, onHome, section, tab }) {
  if (item.page) {
    if (item.href.includes("#")) return false;
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  }
  if (!onHome) return false;
  const id = item.href.slice(1);
  if (item.tab) return section === "music" && tab === item.tab;
  return section === id;
}

// The home section under the header, and the music tab picked last.
function useHomeSpot(onHome) {
  const [section, setSection] = useState(null);
  const [tab, setTab] = useState("albums");
  useEffect(() => {
    if (!onHome) return;
    const line = 120;
    const onScroll = () => {
      let hit = null;
      for (const id of SECTIONS) {
        const r = document.getElementById(id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) hit = id;
      }
      setSection(hit);
    };
    const onTab = (e) => setTab(e.detail);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(TAB_SHOWN_EVENT, onTab);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(TAB_SHOWN_EVENT, onTab);
    };
  }, [onHome]);
  return { section: onHome ? section : null, tab };
}

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
          <m.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={`absolute top-full z-50 mt-4 min-w-52 rounded-2xl border border-era-fg/10 bg-era-bg/95 p-2 shadow-2xl backdrop-blur-xl ${align === "right" ? "right-0" : "-left-4"}`}
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const itemStyle = "block w-full rounded-xl px-3 py-2.5 text-left text-sm text-era-fg/80 transition-colors hover:bg-era-fg/[0.07] hover:text-era-fg";
const menuItemStyle = (active) =>
  active
    ? "flex w-full items-center justify-between gap-3 rounded-xl bg-era-accent/15 px-3 py-2.5 text-left text-sm font-medium text-era-accent"
    : "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-era-fg/80 transition-colors hover:bg-era-fg/[0.07] hover:pl-4 hover:text-era-fg [transition-property:color,background-color,padding]";

const chevron = (
  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2.5 4.5 6 8l3.5-3.5" />
  </svg>
);

const accountButton =
  "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-era-fg/20 text-era-fg transition-colors hover:border-era-accent hover:text-era-accent";

// Whether the signed-in account can edit the site (russ_admins). Only used to
// show the Admin link; /admin and RLS check again on their own.
function useIsAdmin(session) {
  const [admin, setAdmin] = useState({ id: null, value: false });
  const id = session?.user?.id ?? null;
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getSupabase().then((supabase) => supabase.rpc("russ_is_admin")).then(({ data }) => !cancelled && setAdmin({ id, value: data === true }));
    return () => {
      cancelled = true;
    };
  }, [id]);
  return admin.id === id && admin.value;
}

// The account icon in the header, for every fan: signed out it opens /login,
// signed in it shows their initial and a menu.
function Account({ session }) {
  const pathname = usePathname();
  if (!fanAccounts || session === undefined) return <span className="h-9 w-9 shrink-0" aria-hidden="true" />;
  if (!session) {
    const next = pathname && pathname !== "/" && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <a href={`/login${next}`} aria-label="Sign in or sign up" title="Sign in" className={accountButton}>
        <AppIcon name="user" className="h-[18px] w-[18px]" />
      </a>
    );
  }
  const name = displayName(session);
  return (
    <Dropdown
      align="right"
      ariaLabel={`Your account (${session.user.email})`}
      buttonClass={`${accountButton} bg-era-fg/[0.06] font-display text-base uppercase`}
      label={name.slice(0, 1) || "?"}
    >
      <div className="flex items-center gap-3 px-3 pb-3 pt-2">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-era-accent font-display text-lg uppercase text-era-bg">{name.slice(0, 1) || "?"}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-era-fg">{name}</span>
          <span className="block truncate text-xs text-era-muted">{session.user.email}</span>
        </span>
      </div>
      <AccountLinks session={session} itemClass={`${itemStyle} flex items-center gap-3`} />
    </Dropdown>
  );
}

// Favorites, Top 10, Admin (for admins) and Sign out, shared by the header
// menu and the phone menu.
function AccountLinks({ session, itemClass, onPick }) {
  const admin = useIsAdmin(session);
  return (
    <>
      {admin && (
        <a href="/admin" onClick={onPick} className={itemClass}>
          <AppIcon name="shield" className="h-4 w-4 shrink-0 opacity-70" /> Admin
        </a>
      )}
      <a href="/favorites" onClick={onPick} className={itemClass}>
        <AppIcon name="heart" className="h-4 w-4 shrink-0 opacity-70" /> Your favorites
      </a>
      <a href="/top10" onClick={onPick} className={itemClass}>
        <AppIcon name="list-ordered" className="h-4 w-4 shrink-0 opacity-70" /> Your top 10
      </a>
      <button type="button" onClick={() => getSupabase().then((supabase) => supabase.auth.signOut())} className={itemClass}>
        <AppIcon name="log-out" className="h-4 w-4 shrink-0 opacity-70" /> Sign out
      </button>
    </>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // The phone menu link just tapped, lit while the menu closes.
  const [picked, setPicked] = useState(null);
  const pathname = usePathname();
  const onHome = pathname === "/";
  const session = useSession();
  const spot = { pathname, onHome, ...useHomeSpot(onHome) };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    // The new-drop notice sits above the header; it fades out while the menu draws in.
    document.documentElement.toggleAttribute("data-menu-open", open);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The admin page has its own simple layout; the section links point at the home page.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <header
        className={`site-header fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled && !open
            ? "border-b border-era-fg/10 bg-era-bg/95 md:bg-era-bg/70 md:backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
        style={onHome && !scrolled && !open ? OVER_PHOTO : undefined}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href={onHome ? "#top" : "/"} className="group flex items-baseline gap-2" onClick={() => setOpen(false)}>
            <span className="font-display text-2xl tracking-wide">RUSS</span>
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.3em] text-era-muted transition-colors group-hover:text-era-accent">
              fan archive
            </span>
          </a>

          <nav className="hidden items-center gap-5 md:ml-auto md:flex lg:gap-8" aria-label="Main">
            {MENU.map((entry) =>
              entry.group ? (
                <Dropdown
                  key={entry.group}
                  label={<span className="flex items-center gap-1.5">{entry.group} {chevron}</span>}
                  buttonClass={linkStyle(entry.items.some((item) => isActive(item, spot)))}
                >
                  {entry.items.map((item) => {
                    const active = isActive(item, spot);
                    return (
                      <a
                        key={item.href}
                        href={navHref(item, onHome)}
                        onClick={(e) => openTab(e, item, onHome)}
                        aria-current={active ? (item.page ? "page" : "location") : undefined}
                        className={menuItemStyle(active)}
                      >
                        {item.label}
                        {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-era-accent" aria-hidden="true" />}
                      </a>
                    );
                  })}
                </Dropdown>
              ) : (
                <a
                  key={entry.href}
                  href={navHref(entry, onHome)}
                  onClick={(e) => openTab(e, entry, onHome)}
                  aria-current={isActive(entry, spot) ? (entry.page ? "page" : "location") : undefined}
                  className={linkStyle(isActive(entry, spot))}
                >
                  {entry.label}
                </a>
              )
            )}
            <a
              href={SITE.spotifyArtist}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-era-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-era-bg transition-transform hover:scale-105"
            >
              Listen
            </a>
          </nav>

          <div className="flex items-center gap-2 md:ml-5 lg:ml-8">
            <ThemeToggle className={`${accountButton} hidden md:grid`} />
            <Account session={session} />
            <button
              type="button"
              className="relative z-50 flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1.5 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => {
                setPicked(null);
                setOpen((v) => !v);
              }}
            >
              <m.span animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }} className="h-px w-6 bg-era-fg" />
              <m.span animate={open ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }} className="h-px w-6 bg-era-fg" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <m.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-between gap-8 bg-era-bg px-4 pb-10 pt-24 md:hidden"
          >
            <MenuScroller>
              {MENU.map((entry, i) => {
                const link = (item, small) => {
                  const active = picked ? picked === item.href : isActive(item, spot);
                  return (
                    <a
                      key={item.href}
                      href={navHref(item, onHome)}
                      aria-current={active ? "page" : undefined}
                      onClick={(e) => {
                        setPicked(item.href);
                        setOpen(false);
                        openTab(e, item, onHome);
                      }}
                      className={`flex items-center gap-3 font-display uppercase leading-none tracking-tight transition-colors active:text-era-accent ${small ? "text-4xl" : "text-6xl"} ${
                        active ? "text-era-accent" : ""
                      }`}
                    >
                      {item.label}
                      {active && <span className="h-2 w-2 shrink-0 rounded-full bg-era-accent" aria-hidden="true" />}
                    </a>
                  );
                };
                return (
                  <m.div
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
                  </m.div>
                );
              })}
            </MenuScroller>
            <div className="flex flex-col gap-3 text-sm text-era-muted">
              <ThemeChoices />
              {fanAccounts && session === null && (
                <a
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-era-fg/15 p-3 text-era-fg"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-era-fg/10">
                    <AppIcon name="user" className="h-5 w-5 shrink-0" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">Sign in or sign up</span>
                    <span className="block text-xs text-era-muted">Save favorites and your top 10</span>
                  </span>
                  <AppIcon name="chevron-right" className="h-4 w-4 shrink-0 opacity-50" />
                </a>
              )}
              {session && (
                <div className="rounded-2xl border border-era-fg/15 p-2 text-era-fg">
                  <div className="flex items-center gap-3 px-2 pb-2 pt-1">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-era-accent font-display text-lg uppercase text-era-bg">
                      {displayName(session).slice(0, 1) || "?"}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{displayName(session)}</span>
                      <span className="block truncate text-xs text-era-muted">{session.user.email}</span>
                    </span>
                  </div>
                  <div className="grid grid-flow-col auto-cols-fr gap-1">
                    <AccountLinks
                      session={session}
                      onPick={() => setOpen(false)}
                      itemClass="flex flex-col items-center gap-1.5 rounded-xl bg-era-fg/[0.06] px-2 py-3 text-center text-xs"
                    />
                  </div>
                </div>
              )}
              <a href={SITE.spotifyArtist} target="_blank" rel="noreferrer" className="text-era-accent">
                Listen on Spotify
              </a>
              <a href={SITE.officialSite} target="_blank" rel="noreferrer">
                Official site: russworld.com
              </a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

// The phone menu's links in a scroll area with its own scroll bar on the
// right: an accent thumb on a thin track, a fade and a "More" arrow at the
// bottom while there's more below. Only shows when the links overflow.
function MenuScroller({ children }) {
  const ref = useRef(null);
  const [bar, setBar] = useState(null); // { top, size, atEnd } in %, or null when it all fits

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - clientHeight < 4) return setBar(null);
      const size = Math.max(12, (clientHeight / scrollHeight) * 100);
      const top = (scrollTop / (scrollHeight - clientHeight)) * (100 - size);
      setBar({ top, size, atEnd: scrollTop + clientHeight >= scrollHeight - 8 });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <nav ref={ref} className="no-scrollbar flex min-h-0 flex-col gap-2 overflow-y-auto pr-6" aria-label="Mobile" data-lenis-prevent>
        {children}
      </nav>
      {bar && (
        <>
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-1 rounded-full bg-era-fg/10" aria-hidden="true">
            <div className="absolute inset-x-0 rounded-full bg-era-accent transition-[top] duration-75" style={{ top: `${bar.top}%`, height: `${bar.size}%` }} />
          </div>
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-20 items-end justify-center bg-gradient-to-t from-era-bg to-transparent pb-1 transition-opacity duration-300 ${bar.atEnd ? "opacity-0" : "opacity-100"}`}
            aria-hidden="true"
          >
            <span className="flex animate-bounce items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-era-muted">
              More <AppIcon name="chevron-down" className="h-3.5 w-3.5 shrink-0" />
            </span>
          </div>
        </>
      )}
    </div>
  );
}
