"use client";
import { useSyncExternalStore } from "react";
import { fanAccounts, getSupabase } from "./supabaseConfig";

// How many signed-in fans have each release in their favorites
// (russ_favorite_counts, totals only). A release shows up once MIN_FANS
// fans have it. Fetched once per visit and shared by every heart.
export const MIN_FANS = 5;

const EMPTY = new Map();
let counts = EMPTY;
let started = false;
const listeners = new Set();

function load() {
  if (started || !fanAccounts) return;
  started = true;
  getSupabase().then((supabase) => supabase.rpc("russ_favorite_counts", { p_min: MIN_FANS })).then(({ data, error }) => {
    if (error || !Array.isArray(data)) return;
    counts = new Map(data.map((row) => [row.release_key, row.fans]));
    listeners.forEach((fn) => fn());
  });
}

function subscribe(callback) {
  listeners.add(callback);
  load();
  return () => listeners.delete(callback);
}

export function useFavoriteCounts() {
  return useSyncExternalStore(
    subscribe,
    () => counts,
    () => EMPTY
  );
}

// "1.2k" style for the small count by a heart.
export function shortCount(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);
}
