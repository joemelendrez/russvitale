import { timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";
import { RELEASE_KEYS, parseSpotifyLink } from "@/data/releaseKey";

// Spotify links pasted on the page in edit mode (/?edit=<key>), kept in a
// Netlify Blobs store so every visitor gets the fixed players. Anyone can
// read them; only someone with SPOTIFY_EDIT_KEY can change them.
export const dynamic = "force-dynamic";

const BLOB_KEY = "links";

function store() {
  return getStore("spotify-links");
}

// A Blobs call that hangs shouldn't hang the page's request with it.
function withTimeout(promise, ms = 5000) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))]);
}

async function readLinks() {
  try {
    return (await withTimeout(store().get(BLOB_KEY, { type: "json" }))) ?? {};
  } catch (error) {
    // Outside Netlify (plain `next dev`) there is no store: the page just
    // uses the ids in src/data.
    console.error("spotify-links: read failed", error.message);
    return {};
  }
}

function keyMatches(given) {
  const expected = process.env.SPOTIFY_EDIT_KEY;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  if (new URL(request.url).searchParams.has("diag")) {
    const started = Date.now();
    const out = { hasGlobal: Boolean(globalThis.netlifyBlobsContext), hasEnv: Boolean(process.env.NETLIFY_BLOBS_CONTEXT) };
    try {
      const raw = globalThis.netlifyBlobsContext || process.env.NETLIFY_BLOBS_CONTEXT;
      if (raw) out.keys = Object.keys(JSON.parse(Buffer.from(raw, "base64").toString()));
    } catch (e) {
      out.parse = e.message;
    }
    try {
      out.value = await withTimeout(store().get(BLOB_KEY, { type: "json" }), 8000);
    } catch (e) {
      out.error = e.message;
    }
    out.ms = Date.now() - started;
    return Response.json(out, { headers: { "Cache-Control": "no-store" } });
  }
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
    const links = await readLinks();
    if (spotify) links[body.release] = spotify;
    else delete links[body.release];
    await withTimeout(store().setJSON(BLOB_KEY, links));
    return Response.json({ links });
  } catch (error) {
    console.error("spotify-links: write failed", error.message);
    return Response.json({ error: "Couldn't save right now. Try again in a minute." }, { status: 503 });
  }
}
