import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabaseServer";

// The newsletter is gone, but emails already sent still carry this link, so
// it keeps working: it takes the address off russ_subscribers and says so.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function unsubscribe(request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const supabase = serverSupabase();
  if (!supabase || !UUID.test(token)) return false;
  const { data } = await supabase.rpc("russ_unsubscribe", { p_token: token });
  return data === true;
}

const page = (message) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Unsubscribed</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0d;color:#fff;font-family:Arial,Helvetica,sans-serif;padding:24px">
<main style="max-width:420px;text-align:center"><p style="font-size:18px;line-height:1.5">${message}</p>
<p><a href="/" style="color:#ff3b30">Back to russvitale.com</a></p></main></body></html>`;

export async function GET(request) {
  const ok = await unsubscribe(request);
  const message = ok
    ? "You're unsubscribed. The fan newsletter has ended, so no more emails will come."
    : "The fan newsletter has ended, so no more emails will come.";
  return new NextResponse(page(message), { headers: { "content-type": "text/html; charset=utf-8" } });
}

// Mail apps' one-click unsubscribe (List-Unsubscribe-Post).
export async function POST(request) {
  await unsubscribe(request);
  return new NextResponse(null, { status: 200 });
}
