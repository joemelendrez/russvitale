"use client";
import { motion } from "framer-motion";
import { SHOWS, TOUR_LINKS, TICKETMASTER_DISCLOSURE, hasTicketmasterAffiliate, ticketLink } from "@/data/shows";
import PaletteSection from "./PaletteSection";
import SectionHeading from "./SectionHeading";
import BandsintownWidget from "./BandsintownWidget";
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
                <motion.li
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
                      href={ticketLink(show.tickets).href}
                      target="_blank"
                      rel={ticketLink(show.tickets).sponsored ? "sponsored noopener noreferrer" : "noreferrer"}
                      className="rounded-full border border-era-fg/30 px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors hover:border-era-accent hover:bg-era-accent hover:text-era-bg"
                    >
                      Tickets
                    </a>
                  )}
                </motion.li>
              );
            })}
          </ul>
        )}

        <BandsintownWidget />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOUR_LINKS.map((raw, i) => {
            const link = { ...raw, ...ticketLink(raw.href) };
            return (
            <motion.a
              key={raw.href}
              href={link.href}
              target="_blank"
              rel={link.sponsored ? "sponsored noopener noreferrer" : "noreferrer"}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              // A dark card in both modes, so the album colors stand out.
              style={{ borderColor: swatchAt(i + 2), background: "#141318", color: "#f5f5f4" }}
              className="group relative overflow-hidden rounded-2xl border-2 p-6 shadow-xl shadow-black/20 transition-transform hover:-translate-y-1"
            >
              <p className="cover-ink text-xs uppercase tracking-[0.25em]" style={{ "--cover": swatchAt(i + 2) }}>
                {link.note}
              </p>
              <p className="mt-6 flex items-end justify-between font-display text-3xl uppercase">
                {link.label}
                <span className="text-2xl transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true">
                  &#8599;
                </span>
              </p>
            </motion.a>
            );
          })}
        </div>

        {hasTicketmasterAffiliate && (
          <p className="mt-6 text-xs text-era-muted">{TICKETMASTER_DISCLOSURE}</p>
        )}
      </div>
    </PaletteSection>
  );
}
