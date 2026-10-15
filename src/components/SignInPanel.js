"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Google's error when the provider isn't switched on in Supabase yet.
function friendly(message) {
  if (/provider is not enabled|unsupported provider/i.test(message ?? "")) return "Google sign-in isn't set up yet. Use the email link below.";
  if (/rate limit|too many/i.test(message ?? "")) return "Too many sign-in emails just now. Wait a minute and try again.";
  return message || "Something went wrong. Try again.";
}

// Sign in or sign up in one step: Google, or a link by email. A new email
// gets a free account on its first link, so there's no separate sign-up form.
// `redirectTo` is where the fan lands after signing in.
export default function SignInPanel({ redirectTo, emailId = "signin-email", large = false }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const google = async () => {
    setStatus("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setError(friendly(error.message));
      setStatus(null);
    }
  };

  const sendLink = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
    if (error) {
      setError(friendly(error.message));
      setStatus(null);
    } else setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className={large ? "mt-8" : "mt-4"}>
        <p className="text-era-fg">Check {email.trim()} for a sign-in link.</p>
        <p className="mt-1 text-sm text-era-muted">Open it in this same browser. New here? That link makes your free account too.</p>
        <button type="button" onClick={() => setStatus(null)} className="mt-3 text-sm text-era-muted underline hover:text-era-fg">
          Use a different email
        </button>
      </div>
    );
  }

  const pill = large ? "px-6 py-3.5 text-xs" : "px-5 py-2.5 text-[11px]";
  return (
    <div className={large ? "mt-8" : "mt-4"}>
      <button
        type="button"
        onClick={google}
        disabled={status !== null}
        className={`flex items-center justify-center gap-2 rounded-full bg-era-fg font-semibold uppercase tracking-[0.15em] text-era-bg disabled:opacity-50 ${pill} ${large ? "w-full" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        {status === "google" ? "Opening Google..." : "Continue with Google"}
      </button>
      {large && (
        <p className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-era-muted before:h-px before:flex-1 before:bg-era-fg/10 after:h-px after:flex-1 after:bg-era-fg/10">
          or
        </p>
      )}
      <form onSubmit={sendLink} className={large ? "flex flex-col gap-3" : "mt-3 flex gap-2"}>
        <label htmlFor={emailId} className={large ? "text-sm text-era-muted" : "sr-only"}>
          Email
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          placeholder={large ? "you@example.com" : "or your email"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-full border border-era-fg/15 bg-transparent px-4 py-2.5 text-base text-era-fg placeholder:text-era-muted/60"
        />
        <button
          type="submit"
          disabled={status !== null}
          className={`shrink-0 rounded-full border border-era-fg/15 font-semibold uppercase tracking-[0.15em] disabled:opacity-50 ${pill}`}
        >
          {status === "sending" ? "Sending..." : "Email me a link"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
