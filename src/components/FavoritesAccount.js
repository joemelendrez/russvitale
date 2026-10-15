"use client";
import { fanAccounts, supabase } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";
import SignInPanel from "./SignInPanel";

// Optional sign-in on /favorites and /top10 so the lists follow a fan to
// other devices. FavoritesSync does the saving.
export default function FavoritesAccount({ path = "/favorites", what = "your list" }) {
  const session = useSession();
  if (!fanAccounts || session === undefined) return null;

  if (session) {
    return (
      <p className="mt-4 text-sm text-era-muted">
        Saved to your account ({session.user.email}), so {what} shows up wherever you sign in.{" "}
        <button type="button" onClick={() => supabase.auth.signOut()} className="underline hover:text-era-fg">
          Sign out
        </button>
      </p>
    );
  }

  return (
    <div className="mt-6 max-w-xl rounded-2xl border border-era-fg/10 p-5">
      <p className="text-sm text-era-fg">Keep {what} on every device</p>
      <p className="mt-1 text-sm text-era-muted">Sign in or make a free account. Nothing else is asked for or shared.</p>
      <SignInPanel redirectTo={`${window.location.origin}${path}`} emailId={`account-email${path.replace(/\W/g, "-")}`} />
    </div>
  );
}
