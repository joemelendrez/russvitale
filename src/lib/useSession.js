"use client";
import { useEffect, useState } from "react";
import { fanAccounts, supabase } from "./supabase";

// The signed-in fan's session: undefined while it loads, then a session or
// null. Always null when fan accounts are off.
export function useSession() {
  const [session, setSession] = useState(fanAccounts ? undefined : null);
  useEffect(() => {
    if (!fanAccounts) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
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
