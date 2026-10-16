import { DROP_SELECT, LINK_SELECT } from "@/data/releaseColumns";

// /releases.json: the song links and drops saved in admin, for every page's
// players and lists. Served from Netlify's CDN instead of each visitor asking
// Supabase twice; admin saves refresh it (tags "links" and "drops", see
// /api/revalidate), and the CDN copy lasts at most a minute.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function read(path, tag) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 300, tags: [tag] },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`${path.split("?")[0]} HTTP ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export async function GET() {
  if (!url || !key) return Response.json({ links: [], drops: [] });
  try {
    const [links, drops] = await Promise.all([
      read(`russ_release_links?select=${encodeURIComponent(LINK_SELECT)}`, "links"),
      read(`russ_drops?select=${encodeURIComponent(DROP_SELECT)}&order=released_on.desc,created_at.desc&limit=500`, "drops"),
    ]);
    return Response.json({ links, drops }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=60" } });
  } catch (error) {
    // The browser falls back to reading Supabase itself.
    console.error("releases.json", error.message);
    return Response.json({ error: "Couldn't read releases." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
