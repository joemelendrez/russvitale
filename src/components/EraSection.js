"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ReleaseCard from "./ReleaseCard";
import { usePalette } from "./usePalette";

export default function EraSection({ era, number }) {
  const ref = useRef(null);
  usePalette(ref, era.palette);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // The giant outlined title slides sideways while you scroll through the era.
  const watermarkX = useTransform(scrollYProgress, [0, 1], ["10%", "-35%"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["-20%", "40%"]);

  return (
    <section ref={ref} id={`era-${era.id}`} className="relative isolate overflow-x-clip py-24 sm:py-36" aria-labelledby={`era-${era.id}-title`}>
      <motion.div
        aria-hidden="true"
        style={{ y: glowY, background: `radial-gradient(closest-side, ${era.palette.accent}33, transparent)` }}
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[70vh] w-[90vw] -translate-x-1/2"
      />
      <motion.p
        aria-hidden="true"
        style={{ x: watermarkX }}
        className="outline-text pointer-events-none absolute top-6 -z-10 hidden whitespace-nowrap sm:block font-display text-[28vw] uppercase leading-none sm:top-10"
      >
        {era.title}
      </motion.p>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-36">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-20% 0px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-era-accent">
                <span className="font-display text-base tracking-normal">{String(number).padStart(2, "0")}</span>
                <span className="h-px w-8 bg-era-accent" />
                {era.years}
              </p>
              <h3 id={`era-${era.id}-title`} className="mt-5 font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-7xl xl:text-8xl">
                {era.title}
              </h3>
              <p className="mt-4 text-sm uppercase tracking-[0.25em] text-era-muted">{era.kicker}</p>
              {/* Blurbs mark paragraphs with a blank line ("\n\n"). */}
              <div className="mt-6 max-w-md space-y-4 text-base leading-relaxed text-era-fg/85">
                {era.blurb.split(/\n\s*\n/).map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 items-start gap-x-5 gap-y-12 sm:gap-x-8 lg:col-span-7">
          {era.releases.map((release, i) => (
            <ReleaseCard key={release.title} release={release} palette={release.palette ?? era.palette} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
