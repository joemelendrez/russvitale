import { parseSpotifyLink } from "./releaseKey";

// Where a release plays: its Spotify album/track when it has one, otherwise a
// SoundCloud link for the songs Spotify doesn't carry. Both are the services'
// own embed players; nothing is hosted here.

const SOUNDCLOUD_COLOR = "ff3b30";

// The embed to show for a release, or null when it has neither link.
export function playerFor(release) {
  if (release?.spotify) {
    const { kind, id } = release.spotify;
    return {
      source: "spotify",
      key: `spotify-${kind}-${id}`,
      src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
      height: kind === "album" ? 152 : 80,
    };
  }
  if (release?.soundcloud) {
    const params = new URLSearchParams({
      url: release.soundcloud,
      color: `#${SOUNDCLOUD_COLOR}`,
      auto_play: "false",
      hide_related: "true",
      show_comments: "false",
      show_user: "true",
      show_reposts: "false",
      visual: "false",
    });
    return {
      source: "soundcloud",
      key: `soundcloud-${release.soundcloud}`,
      src: `https://w.soundcloud.com/player/?${params}`,
      height: 166,
    };
  }
  return null;
}

// Where "open it" links go: the release on Spotify or SoundCloud, or a Spotify
// search when it has neither.
export function listenLink(release) {
  if (release.spotify) return { href: `https://open.spotify.com/${release.spotify.kind}/${release.spotify.id}`, label: "Spotify" };
  if (release.soundcloud) return { href: release.soundcloud, label: "SoundCloud" };
  return { href: `https://open.spotify.com/search/${encodeURIComponent(`Russ ${release.title}`)}`, label: "Spotify" };
}

// Reads a SoundCloud link (a track or a set, from the browser or the app's
// Share › Copy link, which may come with text around it) into a clean URL.
export function parseSoundcloudLink(text) {
  const value = String(text ?? "");
  const short = value.match(/https?:\/\/on\.soundcloud\.com\/([A-Za-z0-9]+)/);
  if (short) return `https://on.soundcloud.com/${short[1]}`;
  const full = value.match(/(?:https?:\/\/)?(?:www\.|m\.)?soundcloud\.com\/([A-Za-z0-9_-]+)\/((?:sets\/)?[A-Za-z0-9_-]+)/);
  if (!full || ["discover", "search", "you", "stream", "upload", "pages"].includes(full[1])) return null;
  return `https://soundcloud.com/${full[1]}/${full[2]}`;
}

// A pasted Spotify or SoundCloud link as the columns both tables store.
export function parsePlayerLink(text) {
  const spotify = parseSpotifyLink(text);
  if (spotify) return { kind: spotify.kind, spotify_id: spotify.id, soundcloud_url: null };
  const soundcloud = parseSoundcloudLink(text);
  if (soundcloud) return { kind: null, spotify_id: null, soundcloud_url: soundcloud };
  return null;
}

// The link a stored row points at, for filling a form back in.
export function rowLink(row) {
  if (row.spotify_id) return `https://open.spotify.com/${row.kind}/${row.spotify_id}`;
  return row.soundcloud_url ?? "";
}
