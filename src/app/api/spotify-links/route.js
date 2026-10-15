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
    out.hasOriginalFetch = Boolean(globalThis._nextOriginalFetch);
    const timed = async (label, fn) => {
      const t = Date.now();
      try {
        out[label] = { ok: await withTimeout(fn(), 3000) };
      } catch (e) {
        out[label] = { error: e.message };
      }
      out[label].ms = Date.now() - t;
    };
    const which = new URL(request.url).searchParams.get("diag");
    if (which === "original") await timed("original", () => getStore({ name: "spotify-links", fetch: globalThis._nextOriginalFetch }).get(BLOB_KEY, { type: "json" }));
    if (which === "nostore") await timed("noStoreFetch", () => getStore({ name: "spotify-links", fetch: (u, o) => fetch(u, { ...o, cache: "no-store" }) }).get(BLOB_KEY, { type: "json" }));
    if (which === "authed") await timed("authed", async () => {
      const c = JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT, "base64").toString());
      const res = await fetch(new URL(`/${c.siteID}/site:spotify-links/${BLOB_KEY}`, c.edgeURL), { headers: { authorization: `Bearer ${c.token}` }, cache: "no-store" });
      return { status: res.status, body: (await res.text()).slice(0, 300), region: c.primaryRegion };
    });
    if (which === "raw") await timed("raw", async () => (await (globalThis._nextOriginalFetch ?? fetch)(JSON.parse(Buffer.from(process.env.NETLIFY_BLOBS_CONTEXT, "base64").toString()).edgeURL, { method: "HEAD" })).status);
    if (which === "default") await timed("default", () => store().get(BLOB_KEY, { type: "json" }));
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
