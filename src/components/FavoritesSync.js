"use client";
import { useEffect } from "react";
import { getFavorites, setFavorites, subscribeFavorites } from "@/lib/favorites";
import { getTop10, setTop10, subscribeTop10 } from "@/lib/top10";
import { fanAccounts, supabase } from "@/lib/supabase";

const strings = (v) => (Array.isArray(v) ? v.filter((k) => typeof k === "string") : []);

// Keeps a signed-in fan's favorites and top 10 on their account. On sign-in
// the saved favorites come first and anything only on this device is added
// after them, so nothing is lost; the saved top 10 wins unless it's empty.
// After that every change is saved (debounced).
export default function FavoritesSync() {
  useEffect(() => {
    if (!fanAccounts) return;
    let userId = null;
    let lastSaved = null;
    let timer = null;

    const save = () => {
      if (!userId) return;
      const row = { keys: getFavorites(), top10: getTop10() };
      const json = JSON.stringify(row);
      if (json === lastSaved) return;
      lastSaved = json;
      supabase
        .from("russ_favorites")
        .upsert({ user_id: userId, ...row, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) {
            lastSaved = null;
            console.error("Couldn't save favorites", error.message);
          }
        });
    };

    const start = async (session) => {
      const id = session?.user?.id ?? null;
      if (id === userId) return;
      userId = id;
      lastSaved = null;
      if (!id) return;
      const { data, error } = await supabase.from("russ_favorites").select("keys, top10").eq("user_id", id).maybeSingle();
      if (error || userId !== id) return;
      const saved = strings(data?.keys);
      const local = getFavorites();
      const merged = [...saved, ...local.filter((k) => !saved.includes(k))];
      const savedTop = strings(data?.top10);
      const top = savedTop.length ? savedTop : getTop10();
      lastSaved = JSON.stringify({ keys: saved, top10: savedTop });
      if (JSON.stringify(local) !== JSON.stringify(merged)) setFavorites(merged);
      if (JSON.stringify(getTop10()) !== JSON.stringify(top)) setTop10(top);
      save();
    };

    const later = () => {
      clearTimeout(timer);
      timer = setTimeout(save, 800);
    };
    const offFavorites = subscribeFavorites(later);
    const offTop10 = subscribeTop10(later);
    supabase.auth.getSession().then(({ data }) => start(data.session));
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      // Run outside the auth callback; Supabase warns against awaiting in it.
      setTimeout(() => start(session), 0);
    });
    return () => {
      offFavorites();
      offTop10();
      clearTimeout(timer);
      auth.subscription.unsubscribe();
    };
  }, []);
  return null;
}
