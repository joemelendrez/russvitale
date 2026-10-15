"use client";
import { useSyncExternalStore } from "react";
import { SERVICE_KEYS } from "@/data/players";

// Which service the listener plays music on, kept per device. Read through
// useSyncExternalStore so the server render (always Spotify) and a device that
// picked another service don't disagree during hydration.
const KEY = "russ-listen-on";
const listeners = new Set();
let memory = "spotify";

function read() {
  try {
    const saved = localStorage.getItem(KEY);
    if (SERVICE_KEYS.includes(saved)) return saved;
  } catch {}
  return memory;
}

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function setListenOn(service) {
  memory = service;
  try {
    localStorage.setItem(KEY, service);
  } catch {}
  listeners.forEach((fn) => fn());
}

export function useListenOn() {
  return useSyncExternalStore(subscribe, read, () => "spotify");
}
