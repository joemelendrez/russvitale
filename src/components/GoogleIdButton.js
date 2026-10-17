"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// With NEXT_PUBLIC_GOOGLE_CLIENT_ID set, draws Google's own button (Google
// Identity Services), so Google's screen says "Sign in to russvitale.com"
// instead of the Supabase project's address. The ID token Google returns is
// traded for a session with signInWithIdToken. Without the client id, or if
// Google's script doesn't load, it shows `children` (the redirect button).
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

let loading = null;
function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => {
      loading = null;
      reject(new Error("Google sign-in did not load."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// Google gets the hashed nonce; Supabase gets the raw one and checks they match.
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

export default function GoogleIdButton({ redirectTo, children }) {
  const box = useRef(null);
  const [state, setState] = useState(CLIENT_ID && supabase ? "loading" : "fallback");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!CLIENT_ID || !supabase) return;
    let gone = false;
    (async () => {
      try {
        const [{ raw, hashed }] = await Promise.all([makeNonce(), loadScript()]);
        if (gone || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }) => {
            setState("signing-in");
            setError(null);
            const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: credential, nonce: raw });
            if (error) {
              console.error("Google ID token sign-in failed:", error);
              setError("Google didn't let that sign-in through. Try again.");
              setState("ready");
            } else window.location.assign(redirectTo);
          },
        });
        window.google.accounts.id.renderButton(box.current, {
          theme: "filled_black",
          shape: "pill",
          size: "large",
          text: "continue_with",
          logo_alignment: "center",
          width: Math.min(400, box.current.offsetWidth || 320),
        });
        setState("ready");
      } catch (err) {
        console.error(err);
        if (!gone) setState("fallback");
      }
    })();
    return () => {
      gone = true;
    };
  }, [redirectTo]);

  if (state === "fallback") return children;
  return (
    <div>
      <div ref={box} className={`flex min-h-11 w-full justify-center ${state === "signing-in" ? "pointer-events-none opacity-60" : ""}`} />
      {state === "signing-in" && (
        <p role="status" className="mt-2 text-center text-sm opacity-70">
          Signing you in...
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
