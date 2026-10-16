"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { VIDEOS } from "@/data/videos";
import { SITE } from "@/data/site";
import PaletteSection from "./PaletteSection";
import { SECTION_PALETTES } from "@/data/eras";
import SectionHeading from "./SectionHeading";

export default function Watch() {
  return (
    <PaletteSection palette={SECTION_PALETTES.watch} id="watch" className="relative scroll-mt-16 py-24 sm:py-36" aria-label="Watch">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Watch" title="Official videos">
          Played straight from YouTube. More on the{" "}
          <a href={SITE.youtubeMusic} target="_blank" rel="noreferrer" className="underline decoration-era-accent underline-offset-4">
            official channel
          </a>
          .
        </SectionHeading>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {VIDEOS.map((video, i) => (
            <Video key={video.id} video={video} index={i} />
          ))}
        </div>
      </div>
    </PaletteSection>
  );
}

// Thumbnail first; the YouTube player only loads once someone presses play.
function Video({ video, index }) {
  const [playing, setPlaying] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.7 }}
      className="rounded-3xl border-2 border-era-fg p-3 pb-5"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
        {playing ? (
          <iframe
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Play ${video.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
            />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-era-accent text-era-bg transition-transform group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <p className="mt-4 px-1 font-semibold">{video.title}</p>
      <p className="px-1 text-xs uppercase tracking-[0.2em] text-era-muted">{video.year}</p>
    </motion.div>
  );
}
