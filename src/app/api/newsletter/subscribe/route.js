import { NextResponse } from "next/server";
import { SITE } from "@/data/site";
import { newsletterConfig, rateLimited, renderEmail, sendBatch, serverSupabase } from "@/lib/newsletterServer";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same answer whether the address is new, pending or already in, so the form
// can't be used to check who subscribed.
const DONE = { ok: true, message: "Check your inbox and tap the link to confirm." };

export async function POST(request) {
  const config = newsletterConfig();
  const supabase = serverSupabase();
  if (!config.ready || !supabase) return NextResponse.json({ error: "The newsletter isn't open yet." }, { status: 503 });

  const ip = request.headers.get("x-nf-client-connection-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many tries. Try again in a few minutes." }, { status: 429 });

  let body = {};
  try {
    body = await request.json();
  } catch {}
  // Bots fill the hidden field; tell them it worked and do nothing.
  if (body.website) return NextResponse.json(DONE);
  const email = String(body.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });

  const { data: token, error } = await supabase.rpc("russ_subscribe", { p_email: email, p_secret: config.secret });
  if (error) {
    console.error("russ_subscribe failed", error.message);
    return NextResponse.json({ error: "Couldn't sign you up. Try again later." }, { status: 500 });
  }
  if (!token) return NextResponse.json(DONE);

  const confirm = `${SITE.url}/api/newsletter/confirm?token=${token}`;
  const { html, text } = renderEmail({
    heading: "Confirm your email",
    body: "Tap the button to get tour dates, new drops and site updates from the Russ fan archive. If you didn't sign up, ignore this email and nothing happens.",
    button: { href: confirm, label: "Yes, sign me up" },
    token,
    address: config.address,
  });
  try {
    await sendBatch(config.resendKey, [{ from: config.from, to: [email], subject: "Confirm your Russ fan newsletter signup", html, text }]);
  } catch (err) {
    console.error("confirm email failed", err.message);
    return NextResponse.json({ error: "Couldn't send the confirmation email. Try again later." }, { status: 502 });
  }
  return NextResponse.json(DONE);
}
