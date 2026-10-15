"use client";
import { createListStore } from "./listStore";

// A fan's favorite releases, by releaseKey(), in the order they put them.
// Kept on the device; signing in also keeps them on the account (FavoritesSync).
const store = createListStore("russ-favorites", 1000);

export const setFavorites = store.set;
export const useFavorites = store.use;
export const getFavorites = store.read;
export const subscribeFavorites = store.subscribe;

export function toggleFavorite(key) {
  const list = store.read();
  store.set(list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
}
