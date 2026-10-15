"use client";
import { useEffect } from "react";
import { getFavorites, setFavorites, subscribeFavorites } from "@/lib/favorites";
import { fanAccounts, supabase } from "@/lib/supabase";

// Keeps a signed-in fan's favorites on their account. On sign-in the saved
// list comes first and anything only on this device is added after it, so
// nothing is lost either way; after that every change is saved (debounced).
export default function FavoritesSync() {
  useEffect(() => {
    if (!fanAccounts) return;
    let userId = null;
    let lastSaved = null;
    let timer = null;

    const save = () => {
      if (!userId) return;
      const keys = getFavorites();
      const json = JSON.stringify(keys);
      if (json === lastSaved) return;
      lastSaved = json;
      supabase
        .from("russ_favorites")
        .upsert({ user_id: userId, keys, updated_at: new Date().toISOString() })
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
      const { data, error } = await supabase.from("russ_favorites").select("keys").eq("user_id", id).maybeSingle();
      if (error || userId !== id) return;
      const saved = Array.isArray(data?.keys) ? data.keys.filter((k) => typeof k === "string") : [];
      const local = getFavorites();
      const merged = [...saved, ...local.filter((k) => !saved.includes(k))];
      lastSaved = JSON.stringify(saved);
      if (JSON.stringify(local) !== JSON.stringify(merged)) setFavorites(merged);
      save();
    };

    const unsubscribe = subscribeFavorites(() => {
      clearTimeout(timer);
      timer = setTimeout(save, 800);
    });
    supabase.auth.getSession().then(({ data }) => start(data.session));
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => {
      // Run outside the auth callback; Supabase warns against awaiting in it.
      setTimeout(() => start(session), 0);
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
      auth.subscription.unsubscribe();
    };
  }, []);
  return null;
}
