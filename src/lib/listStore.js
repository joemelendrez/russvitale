"use client";
import { useSyncExternalStore } from "react";

// A list of release keys kept on the device (localStorage) that components
// can subscribe to. `max` caps its length; extra keys are dropped.
export function createListStore(storageKey, max = 1000) {
  const EMPTY = [];
  const listeners = new Set();
  let memory = EMPTY;
  let cache = { raw: null, list: EMPTY };

  function read() {
    let raw = null;
    try {
      raw = localStorage.getItem(storageKey);
    } catch {
      return memory;
    }
    if (raw === cache.raw) return cache.list;
    let list = EMPTY;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.filter((k) => typeof k === "string").slice(0, max);
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

  function set(list) {
    memory = [...new Set(list)].slice(0, max);
    try {
      localStorage.setItem(storageKey, JSON.stringify(memory));
    } catch {}
    listeners.forEach((fn) => fn());
  }

  const use = () => useSyncExternalStore(subscribe, read, () => EMPTY);
  return { read, subscribe, set, use };
}
