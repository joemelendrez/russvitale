"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PALETTE } from "@/data/eras";
import { fanAccounts } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import SignInPanel from "./SignInPanel";
import { applyPalette } from "./usePalette";
import AlbumSwatches from "@/components/AlbumSwatches";

// Only paths on this site, so ?next= can't send anyone elsewhere.
function safeNext(value) {
  return typeof value === "string" && /^\/(?!\/)[\w\-/#?=&.%]*$/.test(value) && !value.startsWith("/login") ? value : "/favorites";
}

// /login: one screen for signing in and signing up. Once signed in it sends
// the fan on to ?next= (the page they came from), or their favorites.
export default function LoginForm() {
  const session = useSession();
  const router = useRouter();
  const [next] = useState(() => (typeof window === "undefined" ? "/favorites" : safeNext(new URLSearchParams(window.location.search).get("next"))));

  useEffect(() => applyPalette(DEFAULT_PALETTE), []);
  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 pb-24 pt-28 sm:px-6 sm:pt-36 md:grid-cols-[1.1fr_1fr] md:items-start">
      <div>
        <AlbumSwatches className="mb-6" />
        <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan archive</p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">Sign in or sign up</h1>
        <p className="mt-6 max-w-md text-era-muted">A free account keeps your favorites and your top 10 on every device. It&apos;s optional: everything works without one.</p>
        <ul className="mt-8 space-y-3 text-sm text-era-fg/80">
          {["Your favorites, in your order, everywhere", "Your top 10, ready to share", "No password to remember, and nothing for sale"].map((t) => (
            <li key={t} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-era-accent" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl border border-era-fg/10 bg-era-fg/[0.03] p-6 sm:p-8">
        {!fanAccounts ? (
          <p className="text-era-muted">Accounts aren&apos;t switched on yet. Your favorites are still saved on this device.</p>
        ) : session === undefined ? (
          <p className="text-era-muted" aria-live="polite">
            Checking...
          </p>
        ) : session ? (
          <p className="text-era-fg" aria-live="polite">
            You&apos;re signed in. Taking you back...
          </p>
        ) : (
          <>
            <p className="font-display text-3xl uppercase">Welcome</p>
            <p className="mt-1 text-sm text-era-muted">New or back, it&apos;s the same step.</p>
            <SignInPanel large redirectTo={`${window.location.origin}/login?next=${encodeURIComponent(next)}`} emailId="login-email" />
            <p className="mt-6 text-xs leading-relaxed text-era-muted">
              Only your email is kept, to sign you in. This is an unofficial fan site, not connected to Russ or his team.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
