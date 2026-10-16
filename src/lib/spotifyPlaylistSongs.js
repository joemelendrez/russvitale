// The songs actually in a Spotify playlist, read from Spotify's public embed
// page (no sign-in or API key), so a song added to a playlist on Spotify
// shows up on the site's album and playlist pages within the hour. Cached
// with the "playlists" tag, so admin's refresh picks changes up at once.

const ID = /^[A-Za-z0-9]{22}$/;

// The embed page keeps the tracks in its __NEXT_DATA__ JSON as `trackList`
// ({ title, subtitle: artists }). Found by key, wherever it sits, so a small
// change in Spotify's layout doesn't break it.
function findTrackList(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 12) return null;
  if (Array.isArray(node.trackList)) return node.trackList;
  for (const value of Object.values(node)) {
    const found = findTrackList(value, depth + 1);
    if (found) return found;
  }
  return null;
}

// Russ's song titles from an embed page's HTML, in playlist order; null when
// the page has no track list.
export function songsFromEmbedHtml(html = "") {
  const json = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!json) return null;
  let list;
  try {
    list = findTrackList(JSON.parse(json));
  } catch {
    return null;
  }
  if (!list) return null;
  return list
    .filter((t) => typeof t?.title === "string" && /\bRuss\b/i.test(t.subtitle ?? t.artists ?? ""))
    .map((t) => t.title.trim());
}

// Song titles for a playlist id, or null when Spotify can't be read.
export async function spotifyPlaylistSongs(id) {
  if (!ID.test(id ?? "")) return null;
  try {
    const res = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; russvitale.com)" },
      next: { revalidate: 3600, tags: ["playlists"] },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    return songsFromEmbedHtml(await res.text());
  } catch (e) {
    console.error("spotifyPlaylistSongs", id, e?.message);
    return null;
  }
}
