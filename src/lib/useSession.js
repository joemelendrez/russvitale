"use client";
import { useEffect, useState } from "react";
import { fanAccounts, mightBeSignedIn, whenSignedIn } from "./supabaseConfig";

// The signed-in fan's session: undefined while it loads, then a session or
// null. Always null when fan accounts are off.
export function useSession() {
  const [session, setSession] = useState(fanAccounts ? undefined : null);
  useEffect(() => {
    if (!fanAccounts) return;
    let live = true;
    let sub = null;
    // Never signed in on this browser: no session, without loading Supabase.
    if (!mightBeSignedIn()) Promise.resolve().then(() => live && setSession(null));
    const cancel = whenSignedIn((supabase) => {
      supabase.auth.getSession().then(({ data }) => live && setSession(data.session));
      sub = supabase.auth.onAuthStateChange((_e, s) => setSession(s)).data.subscription;
    });
    return () => {
      live = false;
      cancel();
      sub?.unsubscribe();
    };
  }, []);
  return session;
}

// A short name for the header: the Google name's first word, else the
// part of the email before the @.
export function displayName(session) {
  const meta = session?.user?.user_metadata ?? {};
  const name = meta.full_name || meta.name;
  if (name) return String(name).split(/\s+/)[0];
  return session?.user?.email?.split("@")[0] ?? "";
}
