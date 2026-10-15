import { timingSafeEqual } from "node:crypto";
import { RELEASE_KEYS, parseSpotifyLink } from "@/data/releaseKey";

// Spotify links pasted on the page in edit mode (/?edit=<key>), kept in a
// Netlify Blobs site store so every visitor gets the fixed players. Anyone
// can read them; only someone with SPOTIFY_EDIT_KEY can change them.
//
// This talks to the Blobs edge API directly. The @netlify/blobs client hung
// inside this route on Netlify (every call ran into its retry loop), while a
// plain fetch to the same URL answers in well under 100ms.
export const dynamic = "force-dynamic";

const BLOB_URL_PATH = "site:spotify-links/links";

function blobRequest() {
  const raw = process.env.NETLIFY_BLOBS_CONTEXT;
  if (!raw) return null;
  const context = JSON.parse(Buffer.from(raw, "base64").toString());
  return {
    url: new URL(`/${context.siteID}/${BLOB_URL_PATH}`, context.uncachedEdgeURL || context.edgeURL),
    headers: { authorization: `Bearer ${context.token}` },
  };
}

// strict: a failed read throws instead of returning {}, so a save never
// overwrites every saved link with just the new one.
async function readLinks({ strict = false } = {}) {
  try {
    const blob = blobRequest();
    if (!blob) return {}; // plain `next dev`: just the ids in src/data
    const res = await fetch(blob.url, { headers: blob.headers, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.status === 404) return {};
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("spotify-links: read failed", error.message);
    if (strict) throw error;
    return {};
  }
}

async function writeLinks(links) {
  const blob = blobRequest();
  if (!blob) throw new Error("no Blobs context");
  const res = await fetch(blob.url, {
    method: "PUT",
    headers: { ...blob.headers, "content-type": "application/json", "cache-control": "max-age=0, stale-while-revalidate=60" },
    body: JSON.stringify(links),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
}

function keyMatches(given) {
  const expected = process.env.SPOTIFY_EDIT_KEY;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  return Response.json(await readLinks(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!keyMatches(request.headers.get("x-edit-key"))) {
    return Response.json({ error: "That edit key doesn't match." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (body.action === "check") return Response.json({ ok: true });

  if (!RELEASE_KEYS.has(body.release)) {
    return Response.json({ error: "Unknown release." }, { status: 400 });
  }

  let spotify = null;
  if (!body.remove) {
    spotify = parseSpotifyLink(body.link);
    if (!spotify) {
      return Response.json({ error: "Paste a Spotify album or track link (open.spotify.com/...)." }, { status: 400 });
    }
  }

  try {
    const links = await readLinks({ strict: true });
    if (spotify) links[body.release] = spotify;
    else delete links[body.release];
    await writeLinks(links);
    return Response.json({ links });
  } catch (error) {
    console.error("spotify-links: write failed", error.message);
    return Response.json({ error: "Couldn't save right now. Try again in a minute." }, { status: 503 });
  }
}
