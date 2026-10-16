// Spotify playlist links: open.spotify.com/playlist/<id> (any ?si= is fine).
export function playlistIdFromLink(link) {
  const m = String(link ?? "").match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?playlist\/([A-Za-z0-9]{22})/);
  return m ? m[1] : null;
}

export const playlistUrl = (id) => `https://open.spotify.com/playlist/${id}`;

// Moods offered as a starting point in admin; nothing shows on the site
// until a playlist is saved.
export const PLAYLIST_IDEAS = [
  { title: "Gym", blurb: "High energy for the last set." },
  { title: "Late night drive", blurb: "Windows down, city lights." },
  { title: "Bet on yourself", blurb: "For the days you need the push." },
  { title: "Chill", blurb: "The smoother side of the catalog." },
  { title: "In my feelings", blurb: "The honest, heavier songs." },
  { title: "SoundCloud era", blurb: "The Diemon days, 2011 to 2016." },
];
