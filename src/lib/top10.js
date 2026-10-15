"use client";
import { createListStore } from "./listStore";

export const TOP10_MAX = 10;

// A fan's top 10, by releaseKey(), number 1 first. Kept on the device and,
// once signed in, on the account (FavoritesSync).
const store = createListStore("russ-top10", TOP10_MAX);

export const setTop10 = store.set;
export const useTop10 = store.use;
export const getTop10 = store.read;
export const subscribeTop10 = store.subscribe;
