import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/data/site";

// Server-only helpers for the newsletter. Mail goes out through Resend's HTTP
// API. Env: RESEND_API_KEY, RUSS_NEWSLETTER_FROM ("Russ Fan Archive
// <news@russvitale.com>", a domain verified in Resend), RUSS_NEWSLETTER_ADDRESS
// (the postal address US law wants in every email) and RUSS_NEWSLETTER_SECRET
// (matches russ_settings.newsletter_secret, see migration 0007).

export function newsletterConfig() {
  const config = {
    resendKey: process.env.RESEND_API_KEY,
    from: process.env.RUSS_NEWSLETTER_FROM,
    address: process.env.RUSS_NEWSLETTER_ADDRESS,
    secret: process.env.RUSS_NEWSLETTER_SECRET,
  };
  return { ...config, ready: Boolean(config.resendKey && config.from && config.address && config.secret) };
}

// A Supabase client as the public site, or as the signed-in admin when a token is passed.
export function serverSupabase(accessToken) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}

const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Plain-text body (blank lines between paragraphs, bare links) as email HTML.
function bodyHtml(body) {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((para) => {
      const safe = escapeHtml(para).replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" style="color:#ff3b30">$1</a>').replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e5e5e5">${safe}</p>`;
    })
    .join("");
}

export const unsubscribeUrl = (token) => `${SITE.url}/api/newsletter/unsubscribe?token=${token}`;

// One email in the site's look. `token` (null for a test) makes the unsubscribe link.
export function renderEmail({ heading, body, token, address, button }) {
  const unsub = token ? unsubscribeUrl(token) : `${SITE.url}/newsletter`;
  const html = `<!doctype html><html><body style="margin:0;background:#0b0b0d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#151518;border-radius:16px">
<tr><td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif">
<p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8a8a8f">Russ fan archive &middot; unofficial</p>
<h1 style="margin:12px 0 20px;font-size:28px;line-height:1.1;text-transform:uppercase;color:#ffffff">${escapeHtml(heading)}</h1>
${bodyHtml(body)}
${button ? `<p style="margin:8px 0 24px"><a href="${button.href}" style="display:inline-block;background:#ff3b30;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">${escapeHtml(button.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a8a8f;border-top:1px solid #26262b">
An unofficial fan newsletter from <a href="${SITE.url}" style="color:#8a8a8f">russvitale.com</a>. Not affiliated with Russ, Diemon or any label.<br>
${escapeHtml(address)}<br>
<a href="${unsub}" style="color:#8a8a8f">Unsubscribe</a>
</td></tr></table></td></tr></table></body></html>`;
  const text = `${heading}\n\n${body.trim()}${button ? `\n\n${button.label}: ${button.href}` : ""}\n\n--\nAn unofficial fan newsletter from russvitale.com. Not affiliated with Russ, Diemon or any label.\n${address}\nUnsubscribe: ${unsub}`;
  return { html, text, unsub };
}

// Sends up to 100 emails in one Resend call. Throws on failure.
export async function sendBatch(resendKey, emails) {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(emails),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Resend answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// A few signups per address per window, per server instance (fine at this size).
const hits = new Map();
export function rateLimited(ip, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > windowMs) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}
