"use client";
import { useEffect, useRef, useState } from "react";

// "In this post". variant="sidebar": sticky beside the post on wide screens,
// lighting up the section you're reading, with how far along you are.
// variant="mobile": a tap-to-open list at the top of the post below lg.
// Links are plain #anchors, which Lenis scrolls smoothly under the header.
export default function BlogToc({ headings, variant = "sidebar" }) {
  const live = variant === "sidebar";
  const [active, setActive] = useState(headings[0]?.id ?? "");
  const listRef = useRef(null);

  // The section you're in is the last heading that has passed under the header.
  useEffect(() => {
    if (!live) return;
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!els.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = els.filter((el) => el.getBoundingClientRect().top < 140);
      setActive((passed.at(-1) || els[0]).id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headings, live]);

  // A long list scrolls inside the card; keep the current section in view.
  useEffect(() => {
    const list = listRef.current;
    if (!live || !list || list.scrollHeight <= list.clientHeight) return;
    const link = list.querySelector('[aria-current="location"]');
    if (!link) return;
    const top = link.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3), behavior: "smooth" });
  }, [active, live]);

  if (headings.length < 2) return null;

  const mains = headings.filter((h) => h.level === 2);
  const numbered = mains.filter((h) => !h.kind).length;
  const current = headings.find((h) => h.id === active);
  const currentSection = live ? (current?.section ?? null) : null;
  const order = headings.findIndex((h) => h.id === active);

  const links = (onPick) =>
    headings.map((h) => {
      if (h.level === 3) {
        // In the sidebar a section's subheadings show only while you're in it.
        if (live && h.section !== currentSection) return null;
        const on = live && active === h.id;
        return (
          <li key={h.id} className="ml-[1.15rem] border-l border-era-fg/15 pl-4">
            <a href={`#${h.id}`} onClick={onPick} className={`block py-1 text-[0.85rem] leading-snug transition-colors ${on ? "text-era-accent" : "text-era-muted hover:text-era-fg"}`}>
              {h.text}
            </a>
          </li>
        );
      }
      const on = currentSection === h.id;
      return (
        <li key={h.id}>
          <a
            href={`#${h.id}`}
            onClick={onPick}
            aria-current={on ? "location" : undefined}
            className={`group flex items-baseline gap-3 rounded-xl px-2 py-2 leading-snug transition-colors ${on ? "bg-era-fg/[0.07] text-era-fg" : "text-era-fg/70 hover:text-era-fg"}`}
          >
            <span className={`w-5 shrink-0 text-right font-display text-lg leading-none ${on ? "text-era-accent" : "text-era-muted"}`} aria-hidden="true">
              {h.kind === "faq" ? "?" : String(h.number).padStart(2, "0")}
            </span>
            <span className="min-w-0 text-sm font-semibold">{h.kind === "faq" ? "Questions fans ask" : h.text}</span>
          </a>
        </li>
      );
    });

  if (!live) {
    const close = (e) => e.currentTarget.closest("details")?.removeAttribute("open");
    return (
      <details className="group mb-10 rounded-2xl border border-era-fg/15 bg-era-fg/[0.03] lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">In this post</span>
            <span className="rounded-full bg-era-fg/10 px-2 py-0.5 text-[11px] text-era-muted">{numbered} sections</span>
          </span>
          <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-era-fg/20 text-lg leading-none transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <ul className="space-y-0.5 border-t border-era-fg/10 px-2 pb-3 pt-2">{links(close)}</ul>
      </details>
    );
  }

  const section = mains.find((h) => h.id === currentSection);
  const where = section?.kind === "faq" ? "FAQ" : `${section?.number || 1} of ${numbered}`;
  return (
    <nav aria-label="In this post" className="sticky top-24 hidden lg:block">
      <div className="rounded-2xl border border-era-fg/10 bg-era-fg/[0.03] p-4">
        <div className="flex items-center justify-between gap-2 px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em]">In this post</p>
          <span className="rounded-full bg-era-accent px-2 py-0.5 text-[11px] font-semibold tabular-nums text-era-bg">{where}</span>
        </div>
        <div className="mx-2 mb-3 mt-3 h-1 overflow-hidden rounded-full bg-era-fg/10" aria-hidden="true">
          <div className="h-full bg-era-accent transition-[width] duration-300" style={{ width: `${((order + 1) / headings.length) * 100}%` }} />
        </div>
        <ul ref={listRef} data-lenis-prevent className="max-h-[calc(100vh-14rem)] space-y-0.5 overflow-y-auto pr-1">
          {links()}
        </ul>
      </div>
    </nav>
  );
}
