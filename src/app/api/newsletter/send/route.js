import { NextResponse } from "next/server";
import { newsletterConfig, renderEmail, sendBatch, serverSupabase } from "@/lib/newsletterServer";

// Sends a newsletter, as the signed-in admin (their token in Authorization).
// `test: true` sends only to the admin. The database decides who's an admin.
export async function POST(request) {
  const config = newsletterConfig();
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer /, "");
  const supabase = serverSupabase(accessToken);
  if (!config.ready || !supabase) return NextResponse.json({ error: "Email isn't set up yet. See the Newsletter card for what's missing." }, { status: 503 });
  if (!accessToken) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const { data: userData } = await supabase.auth.getUser(accessToken);
  const { data: isAdmin } = await supabase.rpc("russ_is_admin");
  if (!userData?.user || isAdmin !== true) return NextResponse.json({ error: "Only admins can send the newsletter." }, { status: 403 });

  let body = {};
  try {
    body = await request.json();
  } catch {}
  const subject = String(body.subject ?? "").trim();
  const text = String(body.body ?? "").trim();
  if (!subject || subject.length > 150 || !text || text.length > 20000) return NextResponse.json({ error: "Add a subject (up to 150 characters) and a message." }, { status: 400 });

  let recipients;
  if (body.test) {
    recipients = [{ email: userData.user.email, token: null }];
  } else {
    // `city` sends only to fans who asked for show news there.
    const city = String(body.city ?? "").trim();
    const { data, error } = city ? await supabase.rpc("russ_newsletter_recipients_in", { p_city: city }) : await supabase.rpc("russ_newsletter_recipients");
    if (error) return NextResponse.json({ error: "Couldn't load subscribers." }, { status: 500 });
    recipients = data ?? [];
    if (!recipients.length) return NextResponse.json({ error: city ? `Nobody has confirmed a signup for ${city} yet.` : "Nobody has confirmed a signup yet." }, { status: 400 });
  }

  const emails = recipients.map(({ email, token }) => {
    const { html, text: plain, unsub } = renderEmail({ heading: subject, body: text, token, address: config.address });
    return {
      from: config.from,
      to: [email],
      subject: body.test ? `[Test] ${subject}` : subject,
      html,
      text: plain,
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    };
  });

  let sent = 0;
  try {
    for (let i = 0; i < emails.length; i += 100) {
      await sendBatch(config.resendKey, emails.slice(i, i + 100));
      sent += Math.min(100, emails.length - i);
    }
  } catch (err) {
    console.error("newsletter send failed", err.message);
    if (!body.test && sent) await supabase.from("russ_newsletters").insert({ subject, body: text, recipients: sent });
    return NextResponse.json({ error: `Sending stopped after ${sent} of ${emails.length}.` }, { status: 502 });
  }
  if (!body.test) await supabase.from("russ_newsletters").insert({ subject, body: text, recipients: sent });
  return NextResponse.json({ ok: true, sent });
}

// For the admin card: what's missing before email can go out.
export async function GET() {
  const c = newsletterConfig();
  const missing = [
    !c.resendKey && "RESEND_API_KEY",
    !c.from && "RUSS_NEWSLETTER_FROM",
    !c.address && "RUSS_NEWSLETTER_ADDRESS",
    !c.secret && "RUSS_NEWSLETTER_SECRET",
  ].filter(Boolean);
  return NextResponse.json({ missing });
}
