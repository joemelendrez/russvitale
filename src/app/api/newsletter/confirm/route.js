import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/newsletterServer";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The link in the confirmation email.
export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const supabase = serverSupabase();
  let ok = false;
  if (supabase && UUID.test(token)) {
    const { data } = await supabase.rpc("russ_confirm_subscriber", { p_token: token });
    ok = data === true;
  }
  return NextResponse.redirect(new URL(`/newsletter?status=${ok ? "confirmed" : "invalid"}`, url.origin), 303);
}
