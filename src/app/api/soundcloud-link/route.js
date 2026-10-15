import { NextResponse } from "next/server";
import { parseSoundcloudLink } from "@/data/players";

// SoundCloud's embed player only takes full soundcloud.com links, but the
// app's Share › Copy link gives on.soundcloud.com short links. This follows
// one short link's redirect and returns the full link. It only ever fetches
// on.soundcloud.com, so it can't be pointed anywhere else.
export async function GET(request) {
  const url = new URL(request.url).searchParams.get("url") ?? "";
  const match = url.match(/^https:\/\/on\.soundcloud\.com\/([A-Za-z0-9]{4,64})$/);
  if (!match) return NextResponse.json({ error: "Not a SoundCloud short link." }, { status: 400 });
  try {
    const res = await fetch(`https://on.soundcloud.com/${match[1]}`, { redirect: "manual", signal: AbortSignal.timeout(6000) });
    const full = parseSoundcloudLink(res.headers.get("location"));
    if (!full || full.startsWith("https://on.")) return NextResponse.json({ error: "That SoundCloud link didn't lead anywhere." }, { status: 404 });
    return NextResponse.json({ url: full }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return NextResponse.json({ error: "Couldn't reach SoundCloud. Try the full soundcloud.com link." }, { status: 502 });
  }
}
