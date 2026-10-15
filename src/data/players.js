import { parseSpotifyLink } from "./releaseKey";

// Where a release plays. Listeners pick Spotify, YouTube Music or SoundCloud
// (the switch above the timeline); a song their pick doesn't carry falls back
// to SoundCloud (or Spotify, for SoundCloud listeners) when it can.
// All of these are the services' own embed players; nothing is hosted here.

export const SERVICES = [
  { key: "spotify", label: "Spotify" },
  { key: "youtube", label: "YouTube Music", short: "YouTube" },
  { key: "soundcloud", label: "SoundCloud" },
];

export const SERVICE_KEYS = SERVICES.map((s) => s.key);

const SOUNDCLOUD_COLOR = "ff3b30";

function spotifyPlayer({ kind, id }) {
  return {
    key: `spotify-${kind}-${id}`,
    label: "Spotify",
    src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
    height: kind === "album" ? 152 : 80,
    // PlayerFrame builds an autoplaying player from this with Spotify's iFrame API.
    spotify: { kind, id },
  };
}

function youtubePlayer({ kind, id }) {
  const src =
    kind === "playlist"
      ? `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&rel=0`
      : `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
  // Video players keep their 16:9 shape instead of a fixed height.
  return { key: `youtube-${kind}-${id}`, label: "YouTube Music", src, video: true };
}

function soundcloudPlayer(url) {
  const params = new URLSearchParams({
    url,
    color: `#${SOUNDCLOUD_COLOR}`,
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    visual: "false",
  });
  return { key: `soundcloud-${url}`, label: "SoundCloud", src: `https://w.soundcloud.com/player/?${params}`, height: 166 };
}

// The embed to show for a release on the listener's service, or null.
// Spotify falls back to SoundCloud, then YouTube; YouTube Music falls back to
// SoundCloud only (a Spotify embed is no use to someone who picked YouTube);
// SoundCloud, where most of the catalog isn't, falls back to Spotify.
export function playerFor(release, service = "spotify") {
  if (!release) return null;
  if (service === "soundcloud") {
    if (release.soundcloud) return soundcloudPlayer(release.soundcloud);
    if (release.spotify) return spotifyPlayer(release.spotify);
    return null;
  }
  if (service === "youtube") {
    if (release.youtube) return youtubePlayer(release.youtube);
    if (release.soundcloud) return soundcloudPlayer(release.soundcloud);
    return null;
  }
  if (release.spotify) return spotifyPlayer(release.spotify);
  if (release.soundcloud) return soundcloudPlayer(release.soundcloud);
  if (release.youtube) return youtubePlayer(release.youtube);
  return null;
}

function youtubeMusicUrl({ kind, id }) {
  return kind === "playlist" ? `https://music.youtube.com/playlist?list=${id}` : `https://music.youtube.com/watch?v=${id}`;
}

export function searchLinks(release) {
  const q = encodeURIComponent(`Russ ${release.title}`);
  return {
    spotify: `https://open.spotify.com/search/${q}`,
    youtube: `https://music.youtube.com/search?q=${q}`,
    soundcloud: `https://soundcloud.com/search/sounds?q=${q}`,
  };
}

// Where "open it" links go on the listener's service: the release itself, or
// a search there when it has no link for that service.
export function listenLink(release, service = "spotify") {
  if (service === "soundcloud") {
    if (release.soundcloud) return { href: release.soundcloud, label: "SoundCloud" };
    return { href: searchLinks(release).soundcloud, label: "SoundCloud" };
  }
  if (service === "youtube") {
    if (release.youtube) return { href: youtubeMusicUrl(release.youtube), label: "YouTube Music" };
    if (release.soundcloud) return { href: release.soundcloud, label: "SoundCloud" };
    return { href: searchLinks(release).youtube, label: "YouTube Music" };
  }
  if (release.spotify) return { href: `https://open.spotify.com/${release.spotify.kind}/${release.spotify.id}`, label: "Spotify" };
  if (release.soundcloud) return { href: release.soundcloud, label: "SoundCloud" };
  return { href: searchLinks(release).spotify, label: "Spotify" };
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

// Reads a YouTube or YouTube Music link: an album/playlist page becomes a
// playlist, a watch/youtu.be/shorts link the video.
export function parseYoutubeLink(text) {
  const value = String(text ?? "");
  if (!/(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/.test(value)) return null;
  const list = value.match(/[?&]list=([A-Za-z0-9_-]{10,64})/);
  const video =
    value.match(/[?&]v=([A-Za-z0-9_-]{11})/) ??
    value.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ??
    value.match(/\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
  const isPlaylistPage = /\/playlist\?/.test(value) || /\/embed\/videoseries/.test(value);
  if (list && (isPlaylistPage || !video)) return { kind: "playlist", id: list[1] };
  if (video) return { kind: "video", id: video[1] };
  return null;
}

// A pasted link as the columns both tables store. Spotify and SoundCloud
// replace each other; a YouTube link only sets the YouTube columns.
export function parsePlayerLink(text) {
  const spotify = parseSpotifyLink(text);
  if (spotify) return { kind: spotify.kind, spotify_id: spotify.id, soundcloud_url: null };
  const soundcloud = parseSoundcloudLink(text);
  if (soundcloud) return { kind: null, spotify_id: null, soundcloud_url: soundcloud };
  const youtube = parseYoutubeLink(text);
  if (youtube) return { youtube_kind: youtube.kind, youtube_id: youtube.id };
  return null;
}

// A stored row (russ_release_links or russ_drops) as release fields.
export function releaseFieldsFromRow(row) {
  if (!row) return {};
  return {
    ...(row.spotify_id ? { spotify: { kind: row.kind, id: row.spotify_id } } : {}),
    ...(row.soundcloud_url ? { soundcloud: row.soundcloud_url } : {}),
    ...(row.youtube_id ? { youtube: { kind: row.youtube_kind, id: row.youtube_id } } : {}),
    ...(row.cover_url ? { cover: row.cover_url } : {}),
    ...(row.released_on ? { date: row.released_on } : {}),
  };
}

// The links a stored row points at, for filling a form back in.
export function rowLink(row) {
  if (row.spotify_id) return `https://open.spotify.com/${row.kind}/${row.spotify_id}`;
  return row.soundcloud_url ?? "";
}

export function rowYoutubeLink(row) {
  return row.youtube_id ? youtubeMusicUrl({ kind: row.youtube_kind, id: row.youtube_id }) : "";
}

export function releaseYoutubeLink(release) {
  return release.youtube ? youtubeMusicUrl(release.youtube) : "";
}

// Swaps an on.soundcloud.com short link in a parsed link for the full link
// the embed player needs (via /api/soundcloud-link). Throws with a message
// the form can show when it can't.
export async function expandSoundcloud(parsed) {
  if (!parsed?.soundcloud_url?.startsWith("https://on.soundcloud.com/")) return parsed;
  let body = null;
  try {
    const res = await fetch(`/api/soundcloud-link?url=${encodeURIComponent(parsed.soundcloud_url)}`);
    body = await res.json();
  } catch {}
  if (!body?.url) throw new Error(body?.error ?? "Couldn't open that SoundCloud link. Paste the full soundcloud.com link instead.");
  return { ...parsed, soundcloud_url: body.url };
}

// The player columns for a drop from the admin's two link boxes (a Spotify or
// SoundCloud link, and a YouTube one). Throws with a message the form can show.
export async function playerColumnsFromLinks(link, youtubeLink) {
  const found = link?.trim() ? parsePlayerLink(link) : null;
  if (link?.trim() && (!found || found.youtube_id)) throw new Error("The first link box takes a Spotify or SoundCloud link. YouTube links go in the box below it.");
  const youtube = youtubeLink?.trim() ? parseYoutubeLink(youtubeLink) : null;
  if (youtubeLink?.trim() && !youtube) throw new Error("That doesn't look like a YouTube or YouTube Music link.");
  const parsed = await expandSoundcloud(found);
  return {
    kind: parsed?.kind ?? null,
    spotify_id: parsed?.spotify_id ?? null,
    soundcloud_url: parsed?.soundcloud_url ?? null,
    youtube_kind: youtube?.kind ?? null,
    youtube_id: youtube?.id ?? null,
  };
}
