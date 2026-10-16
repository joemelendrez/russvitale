import { decode } from "jpeg-js";

// The picture saved on a Spotify playlist and its main color, read through
// Spotify's public oEmbed (no sign-in). Used so a playlist's card border and
// page color match the cover people see on Spotify.

const ID = /^[A-Za-z0-9]{22}$/;
const HOUR = 3600;

// Spotify serves covers from i.scdn.co, mosaic.scdn.co and *.spotifycdn.com.
function isSpotifyImage(src) {
  try {
    const u = new URL(src);
    return u.protocol === "https:" && (u.hostname.endsWith(".scdn.co") || u.hostname.endsWith(".spotifycdn.com"));
  } catch {
    return false;
  }
}

const hex = (n) => Math.round(n).toString(16).padStart(2, "0");

// The most common color in the picture: pixels are grouped into coarse
// buckets, and the biggest bucket's average wins. A flat cover gives its
// background; a mosaic gives its biggest patch.
export function mainColor({ width, height, data }) {
  const step = Math.max(1, Math.floor(Math.sqrt((width * height) / 4096)));
  const buckets = new Map();
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const s = buckets.get(key) ?? [0, 0, 0, 0];
      s[0] += r;
      s[1] += g;
      s[2] += b;
      s[3] += 1;
      buckets.set(key, s);
    }
  }
  let best = null;
  for (const s of buckets.values()) if (!best || s[3] > best[3]) best = s;
  if (!best) return null;
  return `#${hex(best[0] / best[3])}${hex(best[1] / best[3])}${hex(best[2] / best[3])}`;
}

async function coverImage(id) {
  const page = `https://open.spotify.com/playlist/${id}`;
  const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(page)}`, {
    next: { revalidate: HOUR },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const src = (await res.json())?.thumbnail_url;
  return isSpotifyImage(src) ? src : null;
}

// { image, color } for a playlist id, or nulls when Spotify can't be read.
export async function spotifyCover(id) {
  if (!ID.test(id ?? "")) return { image: null, color: null };
  try {
    const image = await coverImage(id);
    if (!image) return { image: null, color: null };
    const res = await fetch(image, { next: { revalidate: HOUR }, signal: AbortSignal.timeout(5000) });
    const buf = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    if (!buf || buf.length > 3_000_000) return { image, color: null };
    try {
      const pixels = decode(buf, { useTArray: true, maxResolutionInMP: 4, maxMemoryUsageInMB: 64 });
      return { image, color: mainColor(pixels) };
    } catch (e) {
      console.error("spotifyCover decode", id, e?.message);
      return { image, color: null };
    }
  } catch (e) {
    console.error("spotifyCover", id, e?.message);
    return { image: null, color: null };
  }
}
