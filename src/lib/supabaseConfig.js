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
const waiting = new Set();

// The browser client, loaded on first use. Resolves to null without the env vars.
export function getSupabase() {
  if (!supabaseConfigured) return Promise.resolve(null);
  loading ??= import("./supabase").then((m) => m.supabase);
  return loading;
}

// Called by ./supabase when it loads, however it was imported (the sign-in
// form imports it directly), so code waiting in whenSignedIn() starts then.
export function supabaseLoaded(client) {
  loading ??= Promise.resolve(client);
  for (const run of waiting) run(client);
  waiting.clear();
}

// Whether this browser could be signed in: a saved Supabase session, or a
// sign-in link coming back. Most visitors never sign in, and for them the
// library isn't downloaded at all.
function maybeSignedIn() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      if (name?.startsWith("sb-") && name.endsWith("-auth-token")) return true;
    }
  } catch {
    return true;
  }
  const search = new URLSearchParams(window.location.search);
  return search.has("code") || window.location.hash.includes("access_token");
}

// True when whenSignedIn() would start right away.
export function mightBeSignedIn() {
  return supabaseConfigured && Boolean(loading || maybeSignedIn());
}

// Runs fn(client) for code that only matters to signed-in fans: right away
// when this browser may be signed in, otherwise only once something else
// loads Supabase (someone signs in on this page). Returns a cancel function.
export function whenSignedIn(fn) {
  if (!supabaseConfigured) return () => {};
  let live = true;
  if (mightBeSignedIn()) {
    getSupabase().then((client) => live && client && fn(client));
    return () => {
      live = false;
    };
  }
  const run = (client) => live && fn(client);
  waiting.add(run);
  return () => {
    live = false;
    waiting.delete(run);
  };
}
