"use client";
import { useEffect, useRef, useState } from "react";
import { BANDSINTOWN } from "@/data/shows";

const SCRIPT_SRC = "https://widgetv3.bandsintown.com/main.min.js";

// Bandsintown's own tour-dates widget for Russ: real dates straight from
// them, never typed in by us. The script only loads once the section is near.
export default function BandsintownWidget() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near || document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
  }, [near]);

  return (
    <div ref={ref} className="bit-widget-host mt-14 min-h-24 rounded-2xl border border-era-fg/10 p-4 sm:p-6">
      {near && (
        <a
          className="bit-widget-initializer"
          href={BANDSINTOWN.href}
          data-artist-name={`id_${BANDSINTOWN.artistId}`}
          data-display-local-dates="false"
          data-display-past-dates="true"
          data-auto-style="false"
          data-text-color="#FFFFFF"
          data-link-color="#FFFFFF"
          data-background-color="rgba(0,0,0,0)"
          data-display-limit="8"
          data-display-start-time="false"
          data-link-text-color="#000000"
          data-font="inherit"
          data-display-lineup="false"
          data-display-play-my-city="true"
          data-separator-color="rgba(255,255,255,0.15)"
        >
          Russ on Bandsintown
        </a>
      )}
    </div>
  );
}
