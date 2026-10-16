import { spotifyCover } from "@/lib/spotifyCover";

// /playlists/covers.json?ids=a,b: each Spotify playlist's saved picture and
// its main color, for the cards on /playlists.
export async function GET(request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[A-Za-z0-9]{22}$/.test(s))
    .slice(0, 24);
  const covers = Object.fromEntries(await Promise.all([...new Set(ids)].map(async (id) => [id, await spotifyCover(id)])));
  return Response.json(
    { covers },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400", "Netlify-Vary": "query" } }
  );
}
