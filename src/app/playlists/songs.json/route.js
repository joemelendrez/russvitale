import { ALBUMS } from "@/data/albums";
import { CATALOG_SINGLES_BY_YEAR, sameSong } from "@/data/catalog";

// Every Russ song with a Spotify track id, for the "Russ" mode of Joseph's
// playlist generator (spotifyplaylistgen.netlify.app): the AI picks from this
// list only, so every song is real and plays on Spotify. Album tracks first
// (with their album), then singles that aren't on an album.
export const dynamic = "force-static";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};

export function GET() {
  const songs = [];
  for (const album of ALBUMS) {
    for (const t of album.tracks) {
      songs.push({ title: t.title, artists: t.artists, from: album.title, year: album.year, seconds: t.seconds, spotifyId: t.trackId });
    }
  }
  for (const group of CATALOG_SINGLES_BY_YEAR) {
    for (const s of group.singles) {
      if (s.spotify?.kind !== "track" || songs.some((x) => x.spotifyId === s.spotify.id || sameSong(x.title, s.title))) continue;
      songs.push({ title: s.title, artists: "Russ", from: "Single", year: group.year, seconds: null, spotifyId: s.spotify.id });
    }
  }
  return Response.json({ songs }, { headers: HEADERS });
}
