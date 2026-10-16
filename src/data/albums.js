import { ERAS } from "./eras";
import { sameSong } from "./catalog";
import { PLAYLIST_IDEAS } from "./playlists";
import { tracklistFor } from "./tracklists";

// A page-friendly slug: "W!LD" is "wild", "&" is "and", the rest dashes.
export function slugify(title) {
  return String(title ?? "")
    .toLowerCase()
    .replace(/!/g, "i")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Every album and EP from the timeline, oldest first, each with its era,
// its page's slug, its own colors (or its era's) and its songs (/music/<slug>).
export const ALBUMS = ERAS.flatMap((era) => era.releases.map((r) => ({ ...r, era, palette: r.palette ?? era.palette, slug: slugify(r.title), tracks: tracklistFor(r) })));

export const albumBySlug = (slug) => ALBUMS.find((a) => a.slug === slug) ?? null;

export const albumHref = (album) => `/music/${album.slug}`;

// The album a song first came out on, for linking a song to its album page.
export function albumForSong(title) {
  return ALBUMS.find((a) => a.tracks.some((t) => sameSong(t.title, title))) ?? null;
}

// The playlists on the site ({ title, songs }) that use any of this album's songs.
export function playlistsWithAlbum(album, lists) {
  return lists.filter((p) => p.songs.some((s) => album.tracks.some((t) => sameSong(t.title, s))));
}

export const playlistHref = (title) => `/playlists/${slugify(title)}`;

export function totalLength(tracks) {
  const s = tracks.reduce((n, t) => n + t.seconds, 0);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h} hr ${m} min` : `${m} min`;
}

// A starter playlist's songs as tracks: songs found on an album get its
// Spotify track and `from`; singles that aren't on one are left out.
export function playlistTracks(songs) {
  const out = [];
  for (const song of songs) {
    for (const album of ALBUMS) {
      const t = album.tracks.find((x) => sameSong(x.title, song));
      if (t) {
        if (!out.some((o) => o.trackId === t.trackId)) out.push({ ...t, n: out.length + 1, from: album.title, slug: album.slug });
        break;
      }
    }
  }
  return out;
}

export const playlistIdea = (slug) => PLAYLIST_IDEAS.find((p) => slugify(p.title) === slug) ?? null;
