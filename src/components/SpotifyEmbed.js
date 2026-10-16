"use client";
import { useEffect, useRef, useState } from "react";
import { loadSpotifyApi, playOneAtATime } from "./PlayerFrame";

// A Spotify playlist/album/track player built with Spotify's iFrame API, so it
// pauses any other Spotify player on the page when it starts. It loads once it
// nears the screen, and falls back to the plain embed if the API won't load.
export default function SpotifyEmbed({ kind = "playlist", id, title, height = 352, className = "" }) {
  const box = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = box.current;
    let controller = null;
    let release = null;
    let cancelled = false;
    let giveUp = null;

    const build = () => {
      const host = document.createElement("div");
      node.appendChild(host);
      giveUp = setTimeout(() => !controller && setFailed(true), 5000);
      loadSpotifyApi()
        .then((api) => {
          if (cancelled) return;
          api.createController(host, { uri: `spotify:${kind}:${id}`, width: "100%", height, theme: "dark" }, (c) => {
            if (cancelled) return c.destroy();
            controller = c;
            clearTimeout(giveUp);
            release = playOneAtATime(c);
          });
        })
        .catch(() => !cancelled && setFailed(true));
    };

    const seen = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen.disconnect();
        build();
      },
      { rootMargin: "400px" },
    );
    seen.observe(node);

    return () => {
      cancelled = true;
      seen.disconnect();
      clearTimeout(giveUp);
      release?.();
      controller?.destroy();
      node.replaceChildren();
    };
  }, [kind, id, height]);

  if (failed) {
    return (
      <iframe
        title={`${title} on Spotify`}
        src={`https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        className={`block w-full rounded-xl border-0 ${className}`}
        style={{ height }}
      />
    );
  }
  return (
    <div
      ref={box}
      title={`${title} on Spotify`}
      className={`overflow-hidden rounded-xl bg-black/60 [&_iframe]:block [&_iframe]:w-full [&_iframe]:border-0 ${className}`}
      style={{ height }}
    />
  );
}
