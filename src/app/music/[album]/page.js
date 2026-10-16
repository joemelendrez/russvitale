import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import DefaultPalette from "@/components/DefaultPalette";
import Footer from "@/components/Footer";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import Tracklist from "@/components/Tracklist";
import { ALBUMS, albumBySlug, albumHref, playlistHref, playlistsWithAlbum, totalLength } from "@/data/albums";
import { releaseKey } from "@/data/releaseKey";
import { SITE } from "@/data/site";
import { savedLinkFor } from "@/lib/releasesServer";
import { paletteCss } from "@/lib/theme";

export const revalidate = 300;

export function generateStaticParams() {
  return ALBUMS.map((a) => ({ album: a.slug }));
}

const TYPE = { album: "Album", ep: "EP" };

function formatDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function describe(album) {
  const songs = album.tracks.length ? `${album.tracks.length} songs, ` : "";
  return `${album.title} by Russ (${album.year}), from the ${album.era.title} era: ${songs}the tracklist and the official Spotify player.`;
}

export async function generateMetadata({ params }) {
  const { album: slug } = await params;
  const album = albumBySlug(slug);
  if (!album) return { title: "Album not found" };
  const title = `${album.title} by Russ: tracklist and songs (${album.year})`;
  return {
    title: `${title} | Unofficial fan site`,
    description: describe(album),
    alternates: { canonical: albumHref(album) },
    openGraph: { title: `${album.title} (${album.year})`, description: describe(album), type: "music.album", siteName: SITE.name, url: albumHref(album) },
    twitter: { card: "summary_large_image", title: `${album.title} (${album.year})`, description: describe(album) },
  };
}

const iso = (s) => `PT${Math.floor(s / 60)}M${s % 60}S`;

function JsonLd({ item }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />;
}

export default async function AlbumPage({ params }) {
  const { album: slug } = await params;
  const album = albumBySlug(slug);
  if (!album) notFound();

  const saved = await savedLinkFor(releaseKey(album));
  const cover = saved?.cover_url ?? album.cover ?? null;
  const date = album.date ?? saved?.released_on ?? null;
  const spotify = saved?.spotify_id ? { kind: saved.kind ?? "album", id: saved.spotify_id } : album.spotify;
  const { palette } = album;
  const i = ALBUMS.indexOf(album);
  const prev = ALBUMS[i - 1];
  const next = ALBUMS[i + 1];
  const playlists = playlistsWithAlbum(album);
  const sameEra = ALBUMS.filter((a) => a.era.id === album.era.id && a.slug !== album.slug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    byArtist: { "@type": "MusicGroup", name: "Russ", sameAs: [SITE.spotifyArtist, SITE.officialSite] },
    ...(date && { datePublished: date }),
    url: `${SITE.url}${albumHref(album)}`,
    albumReleaseType: album.type === "ep" ? "https://schema.org/EPRelease" : "https://schema.org/AlbumRelease",
    ...(album.tracks.length && {
      numTracks: album.tracks.length,
      track: album.tracks.map((t) => ({ "@type": "MusicRecording", name: t.title, position: t.n, duration: iso(t.seconds), url: `https://open.spotify.com/track/${t.trackId}` })),
    }),
    ...(spotify && { sameAs: [`https://open.spotify.com/${spotify.kind}/${spotify.id}`] }),
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "All music", item: `${SITE.url}/music` },
      { "@type": "ListItem", position: 3, name: album.title, item: `${SITE.url}${albumHref(album)}` },
    ],
  };

  return (
    <>
      {/* The album's colors (light or dark) from the first paint; DefaultPalette keeps them after client navigation. */}
      <style>{paletteCss(palette)}</style>
      <DefaultPalette palette={palette} />
      <JsonLd item={schema} />
      <JsonLd item={crumbs} />
      <article className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.25em] text-era-muted">
          <Link href="/music" className="hover:text-era-fg">
            All music
          </Link>{" "}
          <span aria-hidden="true">/</span> {album.era.title} era
        </nav>

        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,320px)_1fr] md:items-end">
          <div className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl shadow-2xl" style={{ background: palette.bg, boxShadow: `0 30px 80px -30px ${palette.accent}` }}>
            {cover ? (
              <Image src={cover} alt={`${album.title} cover`} fill sizes="320px" className="object-cover" priority />
            ) : (
              <>
                <span
                  className="absolute -right-16 -top-16 h-64 w-64 rounded-full"
                  style={{ background: `radial-gradient(circle at center, ${palette.accent} 0 18%, ${palette.bg} 19% 21%, #000 22%)` }}
                />
                <span className="absolute bottom-5 left-5 right-5 font-display text-4xl uppercase leading-none" style={{ color: palette.fg }}>
                  {album.title}
                </span>
              </>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-era-accent">
              {TYPE[album.type]} &middot; {album.era.kicker}
            </p>
            <h1 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-7xl">{album.title}</h1>
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.25em] text-era-muted">Released</dt>
                <dd className="mt-1">{date ? formatDate(date) : album.year}</dd>
              </div>
              {album.tracks.length > 0 && (
                <>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.25em] text-era-muted">Songs</dt>
                    <dd className="mt-1">{album.tracks.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.25em] text-era-muted">Length</dt>
                    <dd className="mt-1">{totalLength(album.tracks)}</dd>
                  </div>
                </>
              )}
              <div>
                <dt className="text-[10px] uppercase tracking-[0.25em] text-era-muted">Era</dt>
                <dd className="mt-1">
                  {album.era.title}, {album.era.years}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_minmax(0,380px)]">
          <section aria-labelledby="songs">
            <h2 id="songs" className="font-display text-3xl uppercase">
              Tracklist
            </h2>
            {album.tracks.length ? (
              <>
                <p className="mt-2 text-sm text-era-muted">Tap a song to play it.</p>
                <div className="mt-4">
                  <Tracklist tracks={album.tracks} title={album.title} />
                </div>
              </>
            ) : (
              <p className="mt-4 text-era-muted">This one isn&apos;t on Spotify, so there&apos;s no tracklist here yet.</p>
            )}
          </section>

          <aside className="space-y-10">
            {spotify && (
              <section aria-labelledby="listen">
                <h2 id="listen" className="font-display text-3xl uppercase">
                  Play the {TYPE[album.type].toLowerCase()}
                </h2>
                <SpotifyEmbed kind={spotify.kind} id={spotify.id} title={album.title} className="mt-4" />
                <a
                  href={`https://open.spotify.com/${spotify.kind}/${spotify.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-full border border-era-fg/30 px-5 py-2 text-xs uppercase tracking-[0.2em] transition-colors hover:border-era-fg hover:bg-era-fg hover:text-era-bg"
                >
                  Open on Spotify <span aria-hidden="true">&#8599;</span>
                </a>
              </section>
            )}

            <section aria-labelledby="era">
              <h2 id="era" className="font-display text-3xl uppercase">
                The {album.era.title} era
              </h2>
              {album.era.blurb.split("\n\n").map((p) => (
                <p key={p.slice(0, 20)} className="mt-3 leading-relaxed text-era-muted">
                  {p}
                </p>
              ))}
              {sameEra.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {sameEra.map((a) => (
                    <li key={a.slug}>
                      <Link href={albumHref(a)} className="inline-block rounded-full border border-era-fg/15 px-3 py-1.5 text-xs font-semibold hover:border-era-accent">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {playlists.length > 0 && (
              <section aria-labelledby="in-playlists">
                <h2 id="in-playlists" className="font-display text-3xl uppercase">
                  In the playlists
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {playlists.map((p) => (
                    <li key={p.title}>
                      <Link href={playlistHref(p.title)} className="inline-block rounded-full bg-era-fg/10 px-3 py-1.5 text-xs font-semibold hover:bg-era-accent hover:text-era-bg">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>

        <nav aria-label="More albums" className="mt-16 grid gap-4 border-t border-era-fg/10 pt-8 sm:grid-cols-2">
          {prev ? (
            <Link href={albumHref(prev)} className="group">
              <span className="text-[10px] uppercase tracking-[0.25em] text-era-muted">&larr; Before this</span>
              <span className="mt-1 block font-display text-2xl uppercase group-hover:text-era-accent">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={albumHref(next)} className="group sm:text-right">
              <span className="text-[10px] uppercase tracking-[0.25em] text-era-muted">After this &rarr;</span>
              <span className="mt-1 block font-display text-2xl uppercase group-hover:text-era-accent">{next.title}</span>
            </Link>
          )}
        </nav>

        <p className="mt-16 text-xs leading-relaxed text-era-muted">
          An unofficial fan site, not affiliated with Russ, Diemon or any label. Songs play through Spotify&apos;s official player; nothing is hosted or
          sold here.
        </p>
      </article>
      <Footer />
    </>
  );
}
