"use client";
import { supabase } from "./supabase";

// Tells the server an admin save changed what cached pages show
// (/api/revalidate). Saves made close together (a reorder, a run of
// link fixes) are sent as one request a moment after the last one.
const WAIT = 1200;
let pending = new Set();
let timer = null;
let waiting = [];

async function send() {
  const tags = [...pending];
  const done = waiting;
  pending = new Set();
  waiting = [];
  timer = null;
  let ok = false;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tags }),
      });
      ok = res.ok;
      if (!ok) console.error("Couldn't refresh the site", res.status);
    }
  } catch (error) {
    console.error("Couldn't refresh the site", error?.message);
  }
  done.forEach((resolve) => resolve(ok));
}

// refreshSite("drops") or refreshSite(["drops", "links"]). Resolves to
// true once the server has refreshed them; never throws.
export function refreshSite(tags) {
  if (!supabase) return Promise.resolve(false);
  for (const tag of [].concat(tags)) pending.add(tag);
  clearTimeout(timer);
  timer = setTimeout(send, WAIT);
  return new Promise((resolve) => waiting.push(resolve));
}
