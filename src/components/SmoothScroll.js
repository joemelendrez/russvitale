"use client";
import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import Lenis from "lenis";

// Inertia scrolling on pointer devices, skipped for anyone who prefers
// reduced motion. Same setup as Joseph's other sites.
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, anchors: { offset: -72 } });
    window.__lenis = lenis; // so a page change can jump to the top
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
