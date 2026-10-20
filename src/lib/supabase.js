import { createClient } from "@supabase/supabase-js";
import { supabaseLoaded } from "./supabaseConfig";

// Browser client with the public (anon/publishable) key. Every write is
// checked by RLS (supabase/migrations), so there is no server key anywhere.
// Without the env vars the site still works from src/data alone.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key, { auth: { flowType: "pkce" } }) : null;
if (supabase) supabaseLoaded(supabase);

// Pages everyone visits use getSupabase() from ./supabaseConfig instead,
// which loads this file after the page is up.
export { fanAccounts } from "./supabaseConfig";
