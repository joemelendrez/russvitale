import { NAV, SITE } from "@/data/site";
import NewsletterForm from "./NewsletterForm";
import AlbumSwatches from "./AlbumSwatches";
import { SECTION_PALETTES } from "@/data/eras";

// The footer keeps its own colors on the element itself (not the page-wide
// variables), so it always reads as its own block under any page.
const { bg, fg, muted, accent } = SECTION_PALETTES.footer;
// Tailwind's era-* colors are resolved on :root, so they're set here too.
const FOOTER_STYLE = {
  "--bg": bg,
  "--fg": fg,
  "--muted": muted,
  "--accent": accent,
  "--color-era-bg": bg,
  "--color-era-fg": fg,
  "--color-era-muted": muted,
  "--color-era-accent": accent,
  background: bg,
  color: fg,
};

export default function Footer({ newsletter = true }) {
  return (
    <footer className="site-footer pb-14 font-semibold" style={FOOTER_STYLE}>
      <AlbumSwatches variant="band" className="mb-14" />
      {newsletter && (
        <div className="mx-auto mb-14 max-w-7xl px-4 sm:px-6">
          <NewsletterForm />
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-6xl leading-none sm:text-8xl">RUSS</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-era-muted">
            An unofficial fan site. Not affiliated with, endorsed by or connected to Russ, Diemon or any label. All music plays through
            official Spotify, YouTube and SoundCloud embeds; nothing here is sold or hosted, and the site makes no money.
          </p>
          <p className="mt-4 text-sm text-era-muted">
            Fan site built by{" "}
            <a href={SITE.builder.url} target="_blank" rel="noopener" className="text-era-fg underline-offset-4 hover:underline">
              {SITE.builder.name}
            </a>
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-era-muted" aria-label="Footer">
          {NAV.map((item) => (
            <a key={item.href} href={item.page ? item.href : `/${item.href}`} className="hover:text-era-fg">
              {item.label}
            </a>
          ))}
          <a href="/contact" className="hover:text-era-fg">
            Contact
          </a>
          <a href={SITE.spotifyArtist} target="_blank" rel="noreferrer" className="hover:text-era-fg">
            Spotify
          </a>
          <a href={SITE.officialSite} target="_blank" rel="noreferrer" className="hover:text-era-fg">
            russworld.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
