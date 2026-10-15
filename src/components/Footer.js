import { AMAZON_DISCLOSURE, NAV, SITE } from "@/data/site";
import NewsletterForm from "./NewsletterForm";

export default function Footer({ newsletter = true }) {
  return (
    <footer className="border-t border-era-fg/10 py-14">
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
            official Spotify, YouTube and SoundCloud embeds; nothing here is sold or hosted. Book links go to Amazon. {AMAZON_DISCLOSURE}
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
