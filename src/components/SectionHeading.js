"use client";
import { m } from "framer-motion";

export default function SectionHeading({ eyebrow, title, children }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15% 0px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">{eyebrow}</p>
      <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">{title}</h2>
      {children && <p className="mt-6 max-w-xl text-era-muted">{children}</p>}
    </m.div>
  );
}
