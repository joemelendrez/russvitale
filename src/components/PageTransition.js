"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Between pages: the site's icon over a blurred, faded wash of the page's
// own color, and the new page opens at the top. Only for in-app link
// clicks; back and forward keep the browser's own scroll position.
export default function PageTransition() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [showing, setShowing] = useState(false);
  const pending = useRef(false);
  const safety = useRef(null);
  const startedAt = useRef(0);

  useEffect(() => {
    const onClick = (e) => {
      // Not checking defaultPrevented: next/link prevents the default itself.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      pending.current = true;
      startedAt.current = performance.now();
      if (!reduce) setShowing(true);
      clearTimeout(safety.current);
      // If the page never changes (an error, a blocked navigation), let go.
      safety.current = setTimeout(() => {
        pending.current = false;
        setShowing(false);
      }, 4000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduce]);

  useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    clearTimeout(safety.current);
    if (!location.hash) {
      window.__lenis?.scrollTo(0, { immediate: true, force: true });
      window.scrollTo(0, 0);
    }
    // Stay up long enough to be seen, even when the page was already loaded.
    const t = setTimeout(() => setShowing(false), Math.max(250, 750 - (performance.now() - startedAt.current)));
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {showing && (
        <motion.div
          key="page-transition"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="pointer-events-none fixed inset-0 z-[80] grid place-items-center"
          style={{
            background: "color-mix(in srgb, var(--bg) 70%, transparent)",
            backdropFilter: "blur(18px) saturate(1.2)",
            WebkitBackdropFilter: "blur(18px) saturate(1.2)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.08, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative grid place-items-center"
          >
            <span
              className="absolute h-40 w-40 rounded-full blur-3xl"
              style={{ background: "color-mix(in srgb, var(--accent) 35%, transparent)" }}
            />
            <Icon />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// The site icon (src/app/icon.svg), its outlines in the page's text color.
function Icon() {
  return (
    <svg viewBox="0 0 64 64" className="relative h-32 w-32 shrink-0 animate-pulse" style={{ stroke: "var(--fg)" }}>
      <circle cx="19" cy="32" r="13" fill="#C9781E" strokeWidth="4" />
      <circle cx="45" cy="32" r="13" fill="#3A2418" strokeWidth="4" />
      <circle cx="19" cy="32" r="5" fill="#1F2328" stroke="none" />
      <circle cx="45" cy="32" r="5" fill="#0E0B09" stroke="none" />
      <circle cx="22.5" cy="28.5" r="2.4" fill="#FFFFFF" stroke="none" />
      <circle cx="48.5" cy="28.5" r="2.4" fill="#FFFFFF" stroke="none" />
    </svg>
  );
}
