import { NextResponse } from "next/server";

// Finds which Russ song a remembered line is from, through Genius's search.
// Only titles and the Genius link come back: the site never stores or shows
// lyrics. Needs GENIUS_ACCESS_TOKEN (a Genius API client access token).

const MIN = 6;
const MAX = 200;

// A few searches per address per minute, per server instance.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > 60_000) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > 20;
}

// "Russ, Bugus & Kehlani" lists Russ; "Russ Millions" is someone else.
const byRuss = (song) =>
  song.primary_artist?.name?.trim().toLowerCase() === "russ" ||
  (song.artist_names ?? "")
    .split(/,|&|\band\b|\bfeat\.?|\bft\.?/i)
    .some((name) => name.trim().toLowerCase() === "russ");

export async function GET(request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  if (q.length < MIN || q.length > MAX) return NextResponse.json({ error: `Type ${MIN} to ${MAX} characters.` }, { status: 400 });
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ available: false, songs: [] });
  const ip = request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many searches. Try again in a minute." }, { status: 429 });

  try {
    const res = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(`${q} Russ`)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Genius answered ${res.status}`);
    const data = await res.json();
    const seen = new Set();
    const songs = [];
    for (const { result: song } of data?.response?.hits ?? []) {
      if (!song?.title || !byRuss(song) || seen.has(song.id)) continue;
      seen.add(song.id);
      // Only genius.com links go out, so a bad answer can't point anywhere else.
      const url = /^https:\/\/genius\.com\//.test(song.url ?? "") ? song.url : null;
      songs.push({ title: song.title, artists: song.artist_names ?? "Russ", url });
      if (songs.length === 5) break;
    }
    // checked: how many Genius results came back before keeping Russ's own.
    const all = data?.response?.hits ?? [];
    return NextResponse.json({ available: true, songs, checked: all.length, artists: [...new Set(all.map((h) => h.result?.primary_artist?.name))].slice(0, 5) }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
  } catch (err) {
    console.error("lyrics-search", err);
    return NextResponse.json({ error: "Couldn't reach Genius. Try again in a bit." }, { status: 502 });
  }
}
