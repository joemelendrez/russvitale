import { baseReleases } from "@/data/allReleases";
import { releaseKey } from "@/data/releaseKey";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Drops added from admin, read with the public key (anyone may read them).
// Cached for 5 minutes; on any error the built-in list still works.
async function fetchDrops() {
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/russ_drops?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300, tags: ["drops"] },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

// Release keys from a share link: "single-2017-losin-control,album-..."
// Only well-formed keys, at most `max`, no repeats.
export function parseKeys(value, max = 10) {
  const keys = String(value ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => /^[a-z]+-\d{4}-[a-z0-9-]{1,80}$/.test(k));
  return [...new Set(keys)].slice(0, max);
}

// The releases those keys name, in order; unknown keys are skipped.
export async function releasesForKeys(keys) {
  if (!keys.length) return [];
  const all = baseReleases(await fetchDrops());
  const byKey = new Map(all.map((r) => [releaseKey(r), r]));
  return keys.map((k) => byKey.get(k)).filter(Boolean);
}

// The release keys behind a short share link (/t/<code>), or [] when the
// code is unknown. Saved lists never change, so they cache for a day.
export async function keysForCode(code) {
  if (!url || !key || !/^[A-Za-z0-9]{6,12}$/.test(code ?? "")) return [];
  try {
    const res = await fetch(`${url}/rest/v1/russ_top10_links?select=keys&code=eq.${code}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return parseKeys((rows?.[0]?.keys ?? []).join(","));
  } catch {
    return [];
  }
}

// One release's saved link row (cover, date, links) from admin, or null.
export async function savedLinkFor(releaseKeyValue) {
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/russ_release_links?select=*&release_key=eq.${encodeURIComponent(releaseKeyValue)}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300, tags: ["links"] },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

// The fan playlists saved in admin ({ title, blurb, spotify_id }), in order.
export async function savedPlaylists() {
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/russ_playlists?select=title,blurb,spotify_id&order=position&order=created_at`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60, tags: ["playlists"] },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
