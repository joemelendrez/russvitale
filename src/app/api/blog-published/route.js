import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Called by the WordPress subsite when a post is published, updated or
// unpublished (a small snippet on cms.habitnova.com/russvitale), so /blog and
// the sitemap show it on the next visit. The shared secret
// RUSS_BLOG_WEBHOOK_SECRET comes in the X-Russ-Secret header.
const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function POST(request) {
  const secret = process.env.RUSS_BLOG_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not set up." }, { status: 503 });
  if (!same(request.headers.get("x-russ-secret") ?? "", secret)) return NextResponse.json({ error: "Wrong secret." }, { status: 401 });
  revalidateTag("blog", { expire: 0 });
  return NextResponse.json({ refreshed: ["blog"] });
}
