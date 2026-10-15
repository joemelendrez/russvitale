import { NAV, SITE } from "@/data/site";

export default function Footer() {
  return (
    <footer className="border-t border-era-fg/10 py-14">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-6xl leading-none sm:text-8xl">RUSS</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-era-muted">
            An unofficial fan site. Not affiliated with, endorsed by or connected to Russ, Diemon or any label. All music plays through
            official Spotify and YouTube embeds; nothing here is sold or hosted.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-era-muted" aria-label="Footer">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-era-fg">
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
