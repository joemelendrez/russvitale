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
  // A new pick replaces whatever service the button was showing.
  if (nowPlaying) {
    nowPlaying = null;
    playingListeners.forEach((fn) => fn());
  }
  try {
    localStorage.setItem(KEY, service);
  } catch {}
  listeners.forEach((fn) => fn());
}

export function useListenOn() {
  return useSyncExternalStore(subscribe, read, () => "spotify");
}

// The service of whatever is playing right now, when that isn't the pick
// (a song only on SoundCloud plays there for a Spotify listener). The Play on
// button shows it while it plays, then goes back to the pick. Not saved.
let nowPlaying = null; // { owner, service }
const playingListeners = new Set();

function subscribePlaying(callback) {
  playingListeners.add(callback);
  return () => playingListeners.delete(callback);
}

export function setNowPlaying(owner, service) {
  if (nowPlaying?.owner === owner && nowPlaying.service === service) return;
  nowPlaying = service ? { owner, service } : null;
  playingListeners.forEach((fn) => fn());
}

// Clears it only if this owner set it, so a card closing doesn't clear another's.
export function clearNowPlaying(owner) {
  if (nowPlaying?.owner !== owner) return;
  nowPlaying = null;
  playingListeners.forEach((fn) => fn());
}

export function useNowPlayingService() {
  return useSyncExternalStore(
    subscribePlaying,
    () => nowPlaying?.service ?? null,
    () => null
  );
}

// "spotify-album-…" → "spotify"
export function serviceOfPlayer(player) {
  return player ? player.key.split("-")[0] : null;
}
