"use client";
import Link from "next/link";
import { fanAccounts } from "@/lib/supabaseConfig";
import { useSession } from "@/lib/useSession";

// One line under the title on /favorites and /top10: where the list is kept,
// with a link to /login (in the header too) when the fan isn't signed in.
// FavoritesSync does the saving.
export default function FavoritesAccount({ path = "/favorites", what = "your list" }) {
  const session = useSession();
  if (!fanAccounts || session === undefined) return null;
  return (
    <p className="mt-3 text-sm text-era-muted">
      {session ? (
        <>Saved to your account, so {what} shows up wherever you sign in.</>
      ) : (
        <>
          <Link href={`/login?next=${encodeURIComponent(path)}`} className="text-era-fg underline underline-offset-4">
            Sign in
          </Link>{" "}
          to keep {what} on every device.
        </>
      )}
    </p>
  );
}
