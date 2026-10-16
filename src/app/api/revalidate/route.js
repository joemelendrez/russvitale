import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/newsletterServer";

// The cache tags the site's pages read with (src/lib/releasesServer.js,
// src/lib/blog.js). Admin calls this after a save so album pages, playlist
// pages, the sitemap and the blog show the change on the next visit instead
// of after their few-minute cache runs out.
const TAGS = new Set(["drops", "links", "playlists", "blog"]);

export async function POST(request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!accessToken) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const supabase = serverSupabase(accessToken);
  if (!supabase) return NextResponse.json({ error: "Supabase isn't set up." }, { status: 503 });

  // The database decides who's an admin, the same check RLS uses on saves.
  const { data: isAdmin } = await supabase.rpc("russ_is_admin");
  if (isAdmin !== true) return NextResponse.json({ error: "Only admins can refresh the site." }, { status: 403 });

  let body = {};
  try {
    body = await request.json();
  } catch {}
  const tags = [...new Set(Array.isArray(body.tags) ? body.tags : [])].filter((t) => TAGS.has(t));
  if (!tags.length) return NextResponse.json({ error: "Nothing to refresh." }, { status: 400 });

  // expire: 0, so the next visit gets fresh data rather than one more stale page.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ refreshed: tags });
}
