import { swatchAt } from "@/components/AlbumSwatches";
import { PLAYLIST_IDEAS, playlistCoverUrl, playlistIcon } from "@/data/playlists";
import { CATALOG_RELEASES } from "@/data/releaseKey";
import { keysForCode, releasesForKeys } from "@/lib/releasesServer";

const SITE = "https://russvitale.com";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Read by Joseph's playlist generator (spotifyplaylistgen.netlify.app), so it
// can build each mood's playlist from the same song list admin shows, and
// update the playlist already on /playlists instead of making a second one.
//   /playlists/lists.json            every mood list
//   /playlists/lists.json?top10=abc  a shared top 10 (russvitale.com/t/abc)
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, s-maxage=300",
  // Keep ?top10= in Netlify's cache key, or every code gets the first answer.
  "Netlify-Vary": "query",
};

const song = (r, title = r?.title) => ({
  title,
  artist: "Russ",
  kind: r?.spotify?.kind ?? null,
  spotifyId: r?.spotify?.id ?? null,
});

async function savedPlaylists() {
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/russ_playlists?select=title,spotify_id&order=position`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300, tags: ["playlists"] },
      signal: AbortSignal.timeout(6000),
    });
    const rows = res.ok ? await res.json() : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export async function GET(request) {
  const code = new URL(request.url).searchParams.get("top10");
  if (code) {
    const releases = await releasesForKeys(await keysForCode(code));
    if (!releases.length) return Response.json({ error: "That top 10 link wasn't found." }, { status: 404, headers: HEADERS });
    return Response.json({ list: { title: "My Russ top 10", songs: releases.map((r) => song(r)) } }, { headers: HEADERS });
  }

  const saved = await savedPlaylists();
  const lists = PLAYLIST_IDEAS.map((idea, i) => {
    const row = saved.find((r) => r.title.trim().toLowerCase() === idea.title.toLowerCase());
    return {
      title: idea.title,
      blurb: idea.blurb,
      playlistId: row?.spotify_id ?? null,
      cover: SITE + playlistCoverUrl({ color: swatchAt(i), icon: playlistIcon(idea.title), text: idea.title }),
      songs: idea.songs.map((t) => song(CATALOG_RELEASES.find((r) => r.title === t), t)),
    };
  });
  return Response.json({ lists }, { headers: HEADERS });
}
