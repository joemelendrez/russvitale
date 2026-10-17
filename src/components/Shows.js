"use client";
import { m } from "framer-motion";
import { SHOWS, TOUR_LINKS } from "@/data/shows";
import PaletteSection from "./PaletteSection";
import SectionHeading from "./SectionHeading";
import BandsintownWidget from "./BandsintownWidget";
import NewsletterForm from "./NewsletterForm";
import { swatchAt } from "./AlbumSwatches";

function upcoming() {
  const today = new Date().toISOString().slice(0, 10);
  return SHOWS.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  return {
    month: d.toLocaleString("en-US", { month: "short" }),
    day: d.getDate(),
    year: d.getFullYear(),
  };
}

export default function Shows() {
  const shows = upcoming();

  return (
    <PaletteSection id="shows" className="relative scroll-mt-16 border-t border-era-fg/10 py-24 sm:py-36" aria-label="Shows">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Live" title="Recent and upcoming shows">
          Dates change fast, so the official listings are always the source of truth. Track Russ on Bandsintown to get a ping when he hits your city.
        </SectionHeading>

        {shows.length > 0 && (
          <ul className="mt-14 divide-y divide-era-fg/10 border-y border-era-fg/10">
            {shows.map((show, i) => {
              const d = formatDate(show.date);
              return (
                <m.li
                  key={`${show.date}-${show.city}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex flex-wrap items-center gap-x-8 gap-y-2 py-6"
                >
                  <p className="w-24 font-display text-3xl uppercase leading-none">
                    {d.month} {d.day}
                    <span className="block text-xs font-sans tracking-[0.2em] text-era-muted">{d.year}</span>
                  </p>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-semibold">{show.city}</p>
                    <p className="text-era-muted">{show.venue}</p>
                  </div>
                  {show.tickets && (
                    <a
                      href={show.tickets}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-era-fg/30 px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors hover:border-era-accent hover:bg-era-accent hover:text-era-bg"
                    >
                      Tickets
                    </a>
                  )}
                </m.li>
              );
            })}
          </ul>
        )}

        <BandsintownWidget />

        <div className="mt-14 grid gap-6 rounded-3xl border border-era-fg/10 bg-era-fg/[0.03] p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center [&>*]:min-w-0">
          <div>
            <p className="font-display text-3xl uppercase leading-none sm:text-4xl">Russ coming to your city?</p>
            <p className="mt-3 max-w-md text-era-muted">
              Leave your city and we&apos;ll email you when there&apos;s official show news near you, along with new drops. Dates always come from the
              official listings.
            </p>
          </div>
          <NewsletterForm id="shows-city-email" withCity label="Show news near you" />
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOUR_LINKS.map((raw, i) => {
            const link = raw;
            return (
            <m.a
              key={raw.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              // A dark card in both modes, so the album colors stand out.
              style={{ borderColor: swatchAt(i + 2), background: "#141318", color: "#f5f5f4" }}
              className="group relative overflow-hidden rounded-2xl border-2 p-6 shadow-xl shadow-black/20 transition-transform hover:-translate-y-1"
            >
              <p className="cover-ink-lift text-xs uppercase tracking-[0.25em]" style={{ "--cover": swatchAt(i + 2) }}>
                {link.note}
              </p>
              <p className="mt-6 flex items-end justify-between font-display text-3xl uppercase">
                {link.label}
                <span className="text-2xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true">
                  &#8599;
                </span>
              </p>
            </m.a>
            );
          })}
        </div>

      </div>
    </PaletteSection>
  );
}
