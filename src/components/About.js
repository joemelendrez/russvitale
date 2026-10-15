"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { CoverEditor, useRelease, useSpotifyLinks } from "./SpotifyLinks";
import { AMAZON_DISCLOSURE, BOOKS, SITE } from "@/data/site";
import PaletteSection from "./PaletteSection";
import { SECTION_PALETTES } from "@/data/eras";

const STATS = [
  { value: "11", label: "Free albums, 2011 to 2014" },
  { value: "87", label: "SoundCloud singles before the deal" },
  { value: "No. 4", label: "Billboard 200 peak, Zoo and Shake the Snow Globe" },
  { value: "2020", label: "The year he went independent" },
];

export default function About() {
  return (
    <PaletteSection palette={SECTION_PALETTES.about} id="about" className="relative scroll-mt-16 border-t border-era-fg/10 py-24 sm:py-36" aria-label="About">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-era-muted">About</p>
          <h2 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">Russell Vitale</h2>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-era-fg/85">
            <p>
              Born in Secaucus, New Jersey in 1992 and raised partly in Atlanta, Russ started writing raps at seven and making beats at fourteen. He built his whole catalog the slow way: free albums, a song every week, and owning the work.
            </p>
            <p>
              That approach is the thread through every era on this page, from the Diemon uploads to W!LD. He is also the author of two books, It&apos;s All In Your Head and It Was You All Along.
            </p>
          </div>
          <a
            href={SITE.officialSite}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-3 rounded-full border border-era-fg/30 px-6 py-3 text-xs uppercase tracking-[0.25em] transition-colors hover:border-era-fg hover:bg-era-fg hover:text-era-bg"
          >
            Official site <span aria-hidden="true">&#8599;</span>
          </a>

          <div className="mt-14">
            <p className="text-xs uppercase tracking-[0.35em] text-era-muted">His books</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {BOOKS.map((book) => (
                <BookCard key={book.title} book={book} />
              ))}
            </ul>
            <p className="mt-3 text-xs text-era-muted">{AMAZON_DISCLOSURE}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-2xl border border-era-fg/10 bg-era-fg/10">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={i === 0 ? "bg-white p-6 text-black sm:p-8" : "bg-era-bg p-6 sm:p-8"}
            >
              <p className="font-display text-5xl sm:text-6xl">{stat.value}</p>
              <p className={`mt-3 text-sm ${i === 0 ? "font-semibold text-black/70" : "text-era-muted"}`}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </PaletteSection>
  );
}

function BookCard({ book: raw }) {
  const book = useRelease(raw);
  const { editing } = useSpotifyLinks();
  return (
    <li className="flex flex-col">
      <a
        href={book.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="group flex flex-1 gap-4 rounded-2xl border border-era-fg/15 p-4 transition-colors hover:border-era-fg/40"
      >
        {book.cover && (
          <span className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md shadow-lg sm:w-24">
            <Image src={book.cover} alt={`${book.title} cover`} fill sizes="96px" className="object-cover" />
          </span>
        )}
        <span className="flex flex-1 flex-col">
          <span className="font-display text-2xl uppercase leading-none">{book.title}</span>
          <span className="mt-3 flex-1 text-sm leading-relaxed text-era-muted">{book.note}</span>
          <span className="mt-4 text-xs uppercase tracking-[0.2em] text-era-accent">
            Get it on Amazon <span aria-hidden="true">&#8599;</span>
          </span>
        </span>
      </a>
      {editing && <CoverEditor release={raw} />}
    </li>
  );
}
