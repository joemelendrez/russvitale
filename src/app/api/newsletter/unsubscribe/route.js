import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/newsletterServer";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function unsubscribe(request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const supabase = serverSupabase();
  if (!supabase || !UUID.test(token)) return false;
  const { data } = await supabase.rpc("russ_unsubscribe", { p_token: token });
  return data === true;
}

// The footer link in every email.
export async function GET(request) {
  const ok = await unsubscribe(request);
  return NextResponse.redirect(new URL(`/newsletter?status=${ok ? "unsubscribed" : "invalid"}`, request.url), 303);
}

// Mail apps' one-click unsubscribe (List-Unsubscribe-Post).
export async function POST(request) {
  const ok = await unsubscribe(request);
  return new NextResponse(null, { status: ok ? 200 : 400 });
}
