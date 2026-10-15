"use client";
import { useEffect, useState } from "react";
import { fanAccounts, supabase } from "@/lib/supabase";

// Optional sign-in on /favorites so the list follows a fan to other devices.
// Google, or a sign-in link by email. FavoritesSync does the saving.
export default function FavoritesAccount() {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fanAccounts) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!fanAccounts || session === undefined) return null;

  if (session) {
    return (
      <p className="mt-4 text-sm text-era-muted">
        Saved to your account ({session.user.email}), so they show up wherever you sign in.{" "}
        <button type="button" onClick={() => supabase.auth.signOut()} className="underline hover:text-era-fg">
          Sign out
        </button>
      </p>
    );
  }

  const redirectTo = `${window.location.origin}/favorites`;
  const google = async () => {
    setStatus("google");
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setError(error.message);
      setStatus(null);
    }
  };
  const sendLink = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
    if (error) {
      setError(error.message);
      setStatus(null);
    } else setStatus("sent");
  };

  return (
    <div className="mt-6 max-w-xl rounded-2xl border border-era-fg/10 p-5">
      <p className="text-sm text-era-fg">Keep them on every device</p>
      <p className="mt-1 text-sm text-era-muted">Sign in and your list is saved to a free account. Nothing else is asked for or shared.</p>
      {status === "sent" ? (
        <p className="mt-4 text-sm text-era-fg">Check {email.trim()} for a sign-in link. Open it in this same browser.</p>
      ) : (
        <>
          <button
            type="button"
            onClick={google}
            disabled={status !== null}
            className="mt-4 rounded-full bg-era-fg px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-era-bg disabled:opacity-50"
          >
            {status === "google" ? "Opening Google..." : "Continue with Google"}
          </button>
          <form onSubmit={sendLink} className="mt-3 flex gap-2">
            <label htmlFor="fav-email" className="sr-only">
              Email
            </label>
            <input
              id="fav-email"
              type="email"
              required
              autoComplete="email"
              placeholder="or your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-full border border-era-fg/15 bg-transparent px-4 py-2.5 text-base text-era-fg placeholder:text-era-muted/60"
            />
            <button
              type="submit"
              disabled={status !== null}
              className="shrink-0 rounded-full border border-era-fg/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Email me a link"}
            </button>
          </form>
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
