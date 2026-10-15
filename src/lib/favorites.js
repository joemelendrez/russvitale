"use client";
import { useSyncExternalStore } from "react";

// A fan's favorite releases, by releaseKey(), in the order they put them.
// Kept on the device; signing in also keeps them on the account (FavoritesSync).
const KEY = "russ-favorites";
const EMPTY = [];
const listeners = new Set();
let memory = EMPTY;
let cache = { raw: null, list: EMPTY };

function read() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return memory;
  }
  if (raw === cache.raw) return cache.list;
  let list = EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) list = parsed.filter((k) => typeof k === "string");
  } catch {}
  cache = { raw, list };
  return list;
}

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function setFavorites(list) {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  listeners.forEach((fn) => fn());
}

export function toggleFavorite(key) {
  const list = read();
  setFavorites(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
}

export function useFavorites() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const getFavorites = read;
export const subscribeFavorites = subscribe;
