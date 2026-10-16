"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { HERO_COPY, HERO_LAYERS } from "@/data/hero";
import { HERO_PALETTE } from "@/data/eras";
import { usePalette } from "./usePalette";

// Three photo layers plus the name, stacked in 3D. Scrolling pulls the layers
// apart at different speeds (background slowest, Russ fastest, toward you),
// and the pointer tilts the whole stage a few degrees.
export default function Hero() {
  const ref = useRef(null);
  usePalette(ref, HERO_PALETTE);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  const bgY = useTransform(p, [0, 1], ["0%", "30%"]);
  const bgScale = useTransform(p, [0, 1], [1.1, 1.3]);
  const nameY = useTransform(p, [0, 1], ["0%", "60%"]);
  const nameScale = useTransform(p, [0, 1], [1, 0.85]);
  const midY = useTransform(p, [0, 1], ["0%", "18%"]);
  const subjectY = useTransform(p, [0, 1], ["0%", "-6%"]);
  const subjectScale = useTransform(p, [0, 1], [1, 1.18]);
  const copyOpacity = useTransform(p, [0, 0.35], [1, 0]);
  const copyY = useTransform(p, [0, 0.35], [0, -40]);
  const fade = useTransform(p, [0.4, 1], [0, 1]);
  // Once the copy is gone, the bottom melts into the page color before the
  // hero scrolls away, so there's no hard edge (a light page in light mode).
  const edge = useTransform(p, [0.3, 0.42], [0, 1]);

  // Pointer tilt, springy so it never feels twitchy.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const rotateY = useTransform(sx, [-1, 1], [-4, 4]);
  const rotateX = useTransform(sy, [-1, 1], [3, -3]);
  const bgX = useTransform(sx, [-1, 1], [18, -18]);
  const midX = useTransform(sx, [-1, 1], [-14, 14]);
  const subjectX = useTransform(sx, [-1, 1], [-30, 30]);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <section id="top" ref={ref} className="relative isolate h-[170svh]" aria-label="Intro">
      <div className="sticky top-0 h-svh overflow-hidden [perspective:1200px]">
        <motion.div style={{ rotateX, rotateY }} className="pointer-events-none absolute inset-0 [transform-style:preserve-3d]">
          {/* Background: venue and lights */}
          <motion.div style={{ y: bgY, x: bgX, scale: bgScale }} className="absolute -inset-[6%]">
            <Image src={HERO_LAYERS.background.src} alt={HERO_LAYERS.background.alt} fill priority sizes="100vw" className="object-cover" />
          </motion.div>

          {/* The name sits between the venue and Russ, so he stands in front of it. */}
          <motion.h1
            style={{ y: nameY, scale: nameScale }}
            className="pointer-events-none absolute inset-x-0 top-[12%] select-none text-center font-display text-[34vw] leading-none tracking-tight bg-gradient-to-b from-white/90 via-white/50 to-white/0 bg-clip-text text-transparent sm:top-[8%] sm:text-[30vw]"
          >
            {HERO_COPY.name}
          </motion.h1>

          {/* Midground: crowd and stage rig */}
          <motion.div style={{ y: midY, x: midX }} className="absolute inset-x-[-4%] bottom-[-2%] h-[34%]">
            <Image src={HERO_LAYERS.midground.src} alt={HERO_LAYERS.midground.alt} fill sizes="100vw" className="object-cover object-bottom" />
          </motion.div>

          {/* Subject: Russ */}
          <motion.div
            style={{ y: subjectY, x: subjectX, scale: subjectScale }}
            className="absolute inset-x-0 bottom-[24%] mx-auto h-[50%] w-full max-w-3xl origin-bottom sm:bottom-[4%] sm:h-[68%]"
          >
            <Image src={HERO_LAYERS.subject.src} alt={HERO_LAYERS.subject.alt} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-contain object-bottom" />
          </motion.div>
        </motion.div>

        {/* Darken the top so the menu stays readable over the crowd. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        {/* Haze at the bottom so the hero melts into the page. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-era-bg via-era-bg/70 to-transparent sm:h-1/3 sm:via-transparent" />
        {/* Darker scrim behind the copy so it stays readable over the stage lights. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        <motion.div style={{ opacity: edge }} className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-era-bg to-transparent" />
        <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-0 bg-era-bg" />

        <motion.div
          style={{ opacity: copyOpacity, y: copyY }}
          className="absolute inset-x-0 bottom-10 mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:bottom-14 sm:flex-row sm:items-end sm:justify-between sm:px-6"
        >
          <div className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] sm:text-base">
              {HERO_COPY.eyebrow}
            </p>
            <p className="mt-3 text-base leading-relaxed text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.9)] sm:text-lg">{HERO_COPY.tagline}</p>
            <a
              href={HERO_COPY.credit.href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-[11px] uppercase tracking-[0.2em] text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              {HERO_COPY.credit.label}
            </a>
          </div>
          <a href="#music" className="group inline-flex items-center gap-3 self-start text-xs uppercase tracking-[0.3em] text-white sm:self-end">
            Scroll the timeline
            <span className="relative flex h-10 w-6 justify-center rounded-full border border-white/50">
              <motion.span
                animate={{ y: [4, 18, 4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="mt-1 h-2 w-1 rounded-full bg-white"
              />
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
