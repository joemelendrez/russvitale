"use client";
import { useSyncExternalStore } from "react";
import { fanAccounts } from "./supabaseConfig";
import { MIN_FANS } from "./favoriteCountsConfig";

// How many signed-in fans have each release in their favorites
// (russ_favorite_counts, totals only). A release shows up once MIN_FANS
// fans have it. Fetched once per visit from the site's cached copy
// (/favorite-counts.json) and shared by every heart.
export { MIN_FANS };

const EMPTY = new Map();
let counts = EMPTY;
let started = false;
const listeners = new Set();

function load() {
  if (started || !fanAccounts) return;
  started = true;
  fetch("/favorite-counts.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!Array.isArray(data?.counts)) return;
      counts = new Map(data.counts);
      listeners.forEach((fn) => fn());
    })
    .catch(() => {});
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
