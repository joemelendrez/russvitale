"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ReleaseCard from "./ReleaseCard";
import { usePalette } from "./usePalette";
import { eraForYear } from "@/data/eras";

// One year on the singles timeline, colored by the era it belongs to.
export default function YearSection({ group }) {
  const ref = useRef(null);
  const era = eraForYear(group.year);
  usePalette(ref, era.palette);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yearY = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);

  return (
    <section ref={ref} id={`year-${group.year}`} className="relative isolate py-16 sm:py-24" aria-labelledby={`year-${group.year}-title`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-36">
            <motion.h3
              id={`year-${group.year}-title`}
              style={{ y: yearY }}
              className="font-display text-7xl leading-none text-era-accent sm:text-8xl xl:text-9xl"
            >
              {group.year}
            </motion.h3>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-era-muted">{era.title} era</p>
            <p className="mt-4 max-w-xs text-era-fg/85">{group.note}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:col-span-8 lg:grid-cols-3">
          {group.singles.map((single, i) => (
            <ReleaseCard key={single.title} release={{ ...single, year: group.year }} palette={era.palette} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
