"use client";
import { useState } from "react";

// Email signup for tour dates, new drops and site updates. The server sends a
// confirmation email; nobody is added until they tap it.
export default function NewsletterForm({ id = "newsletter-email", withCity = false, label = "Get tour dates and new drops by email" }) {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website, ...(withCity && city.trim() ? { city: city.trim() } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't sign you up. Try again later.");
      setStatus("done");
      setMessage(data.message);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  if (status === "done") return <p className="text-sm text-era-fg">{message}</p>;
  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <label htmlFor={id} className="block text-xs uppercase tracking-[0.2em] text-era-muted">
        {label}
      </label>
      {withCity && (
        <input
          id={`${id}-city`}
          type="text"
          required
          autoComplete="address-level2"
          maxLength={80}
          placeholder="Your city, e.g. Atlanta, GA"
          aria-label="Your city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="mt-3 w-full rounded-full border border-era-fg/15 bg-transparent px-4 py-2.5 text-base text-era-fg placeholder:text-era-muted/60"
        />
      )}
      <div className="mt-3 flex gap-2">
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-full border border-era-fg/15 bg-transparent px-4 py-2.5 text-base text-era-fg placeholder:text-era-muted/60"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-full bg-era-accent px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-era-bg disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Sign up"}
        </button>
      </div>
      {/* Hidden from people; bots fill it in. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      {message && <p className="mt-2 text-sm font-semibold text-era-fg" role="alert">{message}</p>}
      <p className="mt-2 text-xs text-era-muted">An unofficial fan newsletter. One tap in any email unsubscribes you.</p>
    </form>
  );
}
