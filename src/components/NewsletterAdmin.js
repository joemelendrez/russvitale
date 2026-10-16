"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const input = "w-full rounded-lg [color-scheme:dark] border border-white/15 bg-black/50 px-3 py-2.5 text-base text-white placeholder:text-white/30";

// Admin card: subscriber counts, what's missing before email can go out,
// write a newsletter, send a test to yourself, then send it to everyone.
export default function NewsletterAdmin() {
  const [stats, setStats] = useState(null);
  const [missing, setMissing] = useState(null);
  const [history, setHistory] = useState([]);
  // Cities fans asked for show news in (migration 0014); empty before it.
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const [s, h, env, c] = await Promise.all([
      supabase.rpc("russ_newsletter_stats"),
      supabase.from("russ_newsletters").select("id, subject, recipients, sent_at").order("sent_at", { ascending: false }).limit(10),
      fetch("/api/newsletter/send")
        .then((r) => r.json())
        .catch(() => ({ missing: [] })),
      supabase.rpc("russ_subscriber_cities"),
    ]);
    setCities(c.error ? [] : (c.data ?? []));
    setStats(s.error ? false : (s.data?.[0] ?? { confirmed: 0, pending: 0, unsubscribed: 0 }));
    setHistory(h.data ?? []);
    setMissing(env.missing ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const send = async (test) => {
    if (status) return;
    const count = audience;
    if (!test && !window.confirm(`Send "${subject.trim()}" to ${count} ${count === 1 ? "person" : "people"}? This can't be undone.`)) return;
    setStatus(test ? "test" : "send");
    setError(null);
    setMessage(null);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ subject, body, test, ...(city ? { city } : {}) }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error ?? "Couldn't send it.");
      if (test) setMessage("Test sent to your email.");
      else {
        setMessage(`Sent to ${out.sent} ${out.sent === 1 ? "person" : "people"}.`);
        setSubject("");
        setBody("");
      }
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus(null);
    }
  };

  const ready = missing !== null && missing.length === 0;
  const audience = city ? Number(cities.find((c) => c.city === city)?.confirmed ?? 0) : Number(stats?.confirmed ?? 0);
  const filled = subject.trim() && body.trim();
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Newsletter</h2>
      <p className="text-sm text-white/70">
        {stats === null
          ? "Loading..."
          : stats === false
            ? "Couldn't load subscribers."
            : `${stats.confirmed} confirmed · ${stats.pending} waiting to confirm · ${stats.unsubscribed} unsubscribed`}
      </p>
      {missing?.length > 0 && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
          Email isn&apos;t set up yet. Add these on Netlify: {missing.join(", ")}.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {cities.length > 0 && (
          <>
            <label htmlFor="nl-city" className="block text-sm text-white/70">
              Send to
            </label>
            <select id="nl-city" value={city} onChange={(e) => setCity(e.target.value)} className={input}>
              <option value="">Everyone ({Number(stats?.confirmed ?? 0)})</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  Fans near {c.city} ({c.confirmed})
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="nl-subject" className="block text-sm text-white/70">
          Subject
        </label>
        <input id="nl-subject" maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} className={input} placeholder="Russ just announced a tour" />
        <label htmlFor="nl-body" className="block text-sm text-white/70">
          Message
        </label>
        <textarea
          id="nl-body"
          rows={8}
          maxLength={20000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={input}
          placeholder={"Leave a blank line between paragraphs. Links starting with https:// become clickable."}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => send(true)}
            disabled={!ready || !filled || status !== null}
            className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
          >
            {status === "test" ? "Sending..." : "Send me a test"}
          </button>
          <button
            type="button"
            onClick={() => send(false)}
            disabled={!ready || !filled || status !== null || !audience}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-40"
          >
            {status === "send" ? "Sending..." : `Send to ${audience}`}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Sent</p>
          <ul className="mt-2 divide-y divide-white/10 text-sm">
            {history.map((n) => (
              <li key={n.id} className="flex justify-between gap-4 py-2">
                <span className="min-w-0 truncate">{n.subject}</span>
                <span className="shrink-0 text-white/50">
                  {new Date(n.sent_at).toLocaleDateString()} · {n.recipients}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
