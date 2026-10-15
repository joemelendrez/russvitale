"use client";
import { useEffect, useRef, useState } from "react";

// One embed player (Spotify, YouTube or SoundCloud) from playerFor().
// With `autoplay` it starts playing as soon as it loads, which browsers allow
// because it always follows a tap or click on our own play button.
// YouTube and SoundCloud take an autoplay flag in the URL; Spotify's embed
// doesn't, so a Spotify player is built with its iFrame API and told to play.
export default function PlayerFrame({ player, title, className = "", lazy = false, autoplay = false }) {
  if (autoplay && player.spotify) {
    return <SpotifyAutoplay key={player.key} player={player} title={title} className={className} />;
  }
  return <Frame key={player.key} player={player} title={title} className={className} lazy={lazy} autoplay={autoplay} />;
}

function frameClass(player, className) {
  return `block w-full rounded-xl border-0 bg-black/60 ${player.video ? "aspect-video" : ""} ${className}`;
}

function autoplaySrc(src) {
  const url = new URL(src);
  if (url.hostname === "w.soundcloud.com") url.searchParams.set("auto_play", "true");
  else url.searchParams.set("autoplay", "1");
  return url.toString();
}

function Frame({ player, title, className, lazy, autoplay }) {
  return (
    <iframe
      title={`${title} on ${player.label}`}
      src={autoplay ? autoplaySrc(player.src) : player.src}
      height={player.video ? undefined : player.height}
      className={frameClass(player, className)}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen={player.video || undefined}
      loading={lazy && !autoplay ? "lazy" : undefined}
    />
  );
}

// Spotify's iFrame API (developer.spotify.com/documentation/embeds). It calls
// one global callback once, so every player shares one loader.
let spotifyApi = null;
function loadSpotifyApi() {
  if (spotifyApi) return spotifyApi;
  spotifyApi = new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      spotifyApi = null;
      reject(new Error("Spotify iFrame API failed to load"));
    };
    document.body.appendChild(script);
  });
  return spotifyApi;
}

function SpotifyAutoplay({ player, title, className }) {
  const box = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let controller = null;
    let cancelled = false;
    // The API swaps the element it gets for its iframe, so hand it one React
    // doesn't own.
    const host = document.createElement("div");
    box.current.appendChild(host);
    const giveUp = setTimeout(() => !controller && setFailed(true), 5000);

    loadSpotifyApi()
      .then((api) => {
        if (cancelled) return;
        api.createController(
          host,
          { uri: `spotify:${player.spotify.kind}:${player.spotify.id}`, width: "100%", height: player.height, theme: "dark" },
          (c) => {
            if (cancelled) return c.destroy();
            controller = c;
            clearTimeout(giveUp);
            c.addListener("ready", () => c.play());
          },
        );
      })
      .catch(() => !cancelled && setFailed(true));

    const node = box.current;
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      controller?.destroy();
      node?.replaceChildren();
    };
  }, [player]);

  // If the API can't load, fall back to the plain embed (one more tap to play).
  if (failed) return <Frame player={player} title={title} className={className} />;
  return (
    <div
      ref={box}
      title={`${title} on ${player.label}`}
      className={`overflow-hidden rounded-xl bg-black/60 [&_iframe]:block [&_iframe]:w-full [&_iframe]:border-0 ${className}`}
      style={{ height: player.height }}
    />
  );
}
