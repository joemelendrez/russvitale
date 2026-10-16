import Link from "next/link";
import { notFound } from "next/navigation";
import { ALBUM_SWATCHES, swatchAt } from "@/components/AlbumSwatches";
import DefaultPalette from "@/components/DefaultPalette";
import Footer from "@/components/Footer";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import Tracklist from "@/components/Tracklist";
import { albumBySlug, albumHref, playlistHref, playlistIdea, playlistTracks, slugify } from "@/data/albums";
import { DEFAULT_PALETTE } from "@/data/eras";
import { PLAYLIST_IDEAS, inkFor, playlistCoverUrl, playlistIcon, playlistUrl } from "@/data/playlists";
import { SITE } from "@/data/site";
import { savedPlaylists } from "@/lib/releasesServer";
import { spotifyCover } from "@/lib/spotifyCover";

export const revalidate = 60;

export function generateStaticParams() {
  return PLAYLIST_IDEAS.map((p) => ({ slug: slugify(p.title) }));
}

// The playlist saved in admin for this slug, with its place in the list
// (for its color) and the starter songs when its title matches one.
async function findPlaylist(slug) {
  const lists = await savedPlaylists();
  const i = lists.findIndex((l) => slugify(l.title) === slug);
  if (i < 0) return null;
  const list = lists[i];
  const idea = playlistIdea(slug);
  // The picture saved on Spotify and its color, when Spotify answers.
  const spotify = await spotifyCover(list.spotify_id);
  return { ...list, index: i, color: spotify.color ?? swatchAt(i), image: spotify.image, tracks: idea ? playlistTracks(idea.songs) : [], others: lists.filter((_, j) => j !== i) };
}

function describe(list) {
  return `${list.title}: a fan-made Russ playlist on Spotify.${list.blurb ? ` ${list.blurb}` : ""} Play it here or follow it on Spotify.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const list = await findPlaylist(slug);
  if (!list) return { title: "Playlist not found" };
  const title = `${list.title}: a Russ playlist`;
  return {
    title: `${title} | Unofficial fan site`,
    description: describe(list),
    alternates: { canonical: playlistHref(list.title) },
    openGraph: { title, description: describe(list), type: "music.playlist", siteName: SITE.name, url: playlistHref(list.title) },
    twitter: { card: "summary_large_image", title, description: describe(list) },
  };
}

export default async function PlaylistPage({ params }) {
  const { slug } = await params;
  const list = await findPlaylist(slug);
  if (!list) notFound();
  const albums = [...new Set(list.tracks.map((t) => t.slug))].map(albumBySlug).filter(Boolean);
  const cover = list.image ?? playlistCoverUrl({ color: list.color, icon: playlistIcon(list.title), text: list.title });

  return (
    <>
      <DefaultPalette palette={DEFAULT_PALETTE} />
      <article className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.25em] text-era-muted">
          <Link href="/playlists" className="hover:text-era-fg">
            Playlists
          </Link>{" "}
          <span aria-hidden="true">/</span> {list.title}
        </nav>

        <div className="mt-8 grid gap-8 grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={`${list.title} playlist cover`} width={280} height={280} className="aspect-square w-full max-w-[280px] rounded-2xl object-cover shadow-2xl" style={{ boxShadow: `0 30px 80px -30px ${list.color}` }} />
          <div>
            <p className="cover-ink text-xs uppercase tracking-[0.35em]" style={{ "--cover": list.color }}>
              Unofficial fan playlist
            </p>
            <h1 className="mt-4 font-display text-5xl uppercase leading-[0.9] sm:text-7xl">{list.title}</h1>
            {list.blurb && <p className="mt-5 max-w-lg text-lg text-era-muted">{list.blurb}</p>}
            <a
              href={playlistUrl(list.spotify_id)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-transform hover:scale-[1.03]"
              style={{ background: list.color, color: inkFor(list.color) }}
            >
              Follow on Spotify <span aria-hidden="true">&#8599;</span>
            </a>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <section aria-labelledby="listen">
            <h2 id="listen" className="font-display text-3xl uppercase">
              Play the playlist
            </h2>
            <SpotifyEmbed kind="playlist" id={list.spotify_id} title={list.title} height={480} className="mt-4" />
            {list.tracks.length > 0 && (
              <>
                <h2 className="mt-12 font-display text-3xl uppercase">Songs from the albums</h2>
                <p className="mt-2 text-sm text-era-muted">Tap a song to play it on its own.</p>
                <div className="mt-4">
                  <Tracklist tracks={list.tracks} title={list.title} compact />
                </div>
              </>
            )}
          </section>

          <aside className="space-y-10">
            {albums.length > 0 && (
              <section aria-labelledby="albums">
                <h2 id="albums" className="font-display text-3xl uppercase">
                  Albums in it
                </h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {albums.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={albumHref(a)}
                        className="inline-flex items-center gap-2 rounded-full border border-era-fg/15 px-3 py-1.5 text-xs font-semibold hover:border-era-accent"
                      >
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ALBUM_SWATCHES.find((sw) => sw.id === a.era.id)?.color ?? a.era.palette.accent }} aria-hidden="true" />
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {list.others.length > 0 && (
              <section aria-labelledby="more">
                <h2 id="more" className="font-display text-3xl uppercase">
                  More moods
                </h2>
                <ul className="mt-4 space-y-2">
                  {list.others.map((o) => (
                    <li key={o.spotify_id}>
                      <Link href={playlistHref(o.title)} className="group flex items-center justify-between border-b border-era-fg/10 py-2">
                        <span className="font-display text-2xl uppercase group-hover:text-era-accent">{o.title}</span>
                        <span aria-hidden="true" className="text-era-muted">
                          &rarr;
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </aside>
        </div>

        <p className="mt-16 text-xs leading-relaxed text-era-muted">
          An unofficial fan playlist, not affiliated with Russ, Diemon or any label. Music plays through Spotify&apos;s official player; nothing is
          hosted or sold here.
        </p>
      </article>
      <Footer />
    </>
  );
}
