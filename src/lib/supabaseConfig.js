// Supabase settings without the Supabase library itself. Pages everyone
// visits load the client lazily through getSupabase(), after the page is up,
// so the library (about 60 KB gzipped) isn't part of the first download.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

// Fan accounts (favorites sync) only turn on once the site has its own
// project; until then it still shares Handoff Hero's, whose users they'd join.
export const fanAccounts = supabaseConfigured && !url.includes("eljtjrcjyxmqkkruaucl");

let loading = null;

// The browser client, loaded on first use. Resolves to null without the env vars.
export function getSupabase() {
  if (!supabaseConfigured) return Promise.resolve(null);
  loading ??= import("./supabase").then((m) => m.supabase);
  return loading;
}
