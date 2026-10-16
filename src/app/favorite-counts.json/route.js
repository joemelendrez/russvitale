import { MIN_FANS } from "@/lib/favoriteCountsConfig";

// /favorite-counts.json: how many fans have each release in their favorites
// (russ_favorite_counts, totals only, MIN_FANS+). Every heart on the site
// reads it, so it's cached on the CDN for 5 minutes instead of each visitor
// asking Supabase.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!url || !key) return Response.json({ counts: [] });
  try {
    const res = await fetch(`${url}/rest/v1/rpc/russ_favorite_counts`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_min: MIN_FANS }),
      next: { revalidate: 300, tags: ["favorite-counts"] },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const counts = (Array.isArray(rows) ? rows : []).map((r) => [r.release_key, r.fans]).filter(([k, n]) => typeof k === "string" && Number.isFinite(n));
    return Response.json({ counts }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("favorite-counts.json", error.message);
    return Response.json({ counts: [] }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
