"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useSpring } from "framer-motion";
import { ERAS } from "@/data/eras";
import EraSection from "./EraSection";

export default function Timeline() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const active = useActiveEra();
  const inView = useInView(ref, { margin: "-40% 0px -40% 0px" });

  return (
    <div id="music" ref={ref} className="relative scroll-mt-16">
      <header className="mx-auto max-w-7xl px-4 pb-6 pt-24 sm:px-6 sm:pt-32">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs uppercase tracking-[0.35em] text-era-muted"
        >
          The music, 2011 to now
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-4xl font-display text-5xl uppercase leading-[0.95] sm:text-7xl"
        >
          Seven eras. One rule: do it yourself.
        </motion.h2>
        <p className="mt-6 max-w-xl text-era-muted">
          Hover any album or single to play it right here. The page changes color as each era takes over.
        </p>
      </header>

      {/* Progress rail with a dot per era (desktop). */}
      <div className="pointer-events-none absolute bottom-0 left-4 top-0 hidden xl:block">
        <div className="sticky top-1/2 flex -translate-y-1/2 flex-col items-center gap-0">
          <div className="relative h-[50vh] w-px bg-era-fg/15">
            <motion.div style={{ scaleY: progress }} className="absolute inset-0 origin-top bg-era-accent" />
          </div>
        </div>
      </div>
      <nav
        aria-label="Eras"
        className={`fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 transition-opacity duration-500 xl:flex ${
          inView ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {ERAS.map((era) => (
          <a key={era.id} href={`#era-${era.id}`} className="group flex items-center justify-end gap-3">
            <span
              className={`text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
                active === era.id ? "text-era-fg opacity-100" : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"
              }`}
            >
              {era.title}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                active === era.id ? "h-3 w-3 bg-era-accent" : "h-1.5 w-1.5 bg-era-fg/40 group-hover:bg-era-fg"
              }`}
            />
          </a>
        ))}
      </nav>

      {ERAS.map((era, i) => (
        <EraSection key={era.id} era={era} number={i + 1} />
      ))}
    </div>
  );
}

function useActiveEra() {
  const [active, setActive] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id.replace("era-", ""));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    ERAS.forEach((era) => {
      const el = document.getElementById(`era-${era.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}
