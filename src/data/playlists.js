// Spotify playlist links: open.spotify.com/playlist/<id> (any ?si= is fine).
export function playlistIdFromLink(link) {
  const m = String(link ?? "").match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?playlist\/([A-Za-z0-9]{22})/);
  return m ? m[1] : null;
}

export const playlistUrl = (id) => `https://open.spotify.com/playlist/${id}`;

// Moods offered as a starting point in admin, each with a starter song list
// to copy into a playlist maker. Titles match the site's catalog
// (CATALOG_RELEASES), which supplies the Spotify links. Nothing shows on the
// site until a playlist is saved.
export const PLAYLIST_IDEAS = [
  {
    title: "Gym",
    blurb: "High energy for the last set.",
    songs: ["Psycho, Pt. 2", "Ain't Goin Back", "Civil War", "Pull the Trigger", "Yung God", "Crown", "Bankrupt", "Misunderstood", "Status", "Money on Me", "Fire", "Win", "Break!", "Get Up and Get It", "Grammy Bag Freestyle", "Said It Freestyle", "Small Talk", "The Flute Song"],
  },
  {
    title: "Late night drive",
    blurb: "Windows down, city lights.",
    songs: ["Losin Control", "Losin Control, Pt. 2", "Moonlight in Atlanta", "Nighttime (Interlude)", "What They Want", "Inbetween", "Tsunami", "Lost", "The Otherside", "Waste My Time", "Summer at 7", "3:15 (Breathe)", "Seduce (feat. Capella Grey)", "Satisfy", "Nasty", "Coulda Shoulda Woulda"],
  },
  {
    title: "Bet on yourself",
    blurb: "For the days you need the push.",
    songs: ["Do It Myself", "Keep It Moving (feat. John Anthony)", "Always Knew", "Here I Am", "The Formula", "Off the Strength", "10 Year Freestyle", "Overdue", "Prosper", "Since I Was Broke", "Back to Life", "Paid Off", "Can't Be Me", "I Love Me", "Rather Be Myself", "Workin on Me (with 6lack)", "Win", "Get Up and Get It"],
  },
  {
    title: "Chill",
    blurb: "The smoother side of the catalog.",
    songs: ["Summer at 7", "Moonlight in Atlanta", "Take You Back (with Kehlani)", "When I'm with You", "Satisfy", "Private (feat. Rexx Life Raj)", "Lean on You", "Used to You", "Maybe", "Whenever", "Try It", "Home", "That's My Girl", "I Got You", "April 7", "Recognize (with Jessy Blakemore)"],
  },
  {
    title: "In my feelings",
    blurb: "The honest, heavier songs.",
    songs: ["Goodbye", "If I Died", "Lonely in Time Square", "Gone", "Alone", "Nobody Knows", "Tell Me Why", "Give Up", "Sorry", "Why", "3:15 (Breathe)", "Can't Let Go", "Remember", "Can't Get This Right", "If This Is It", "Hell", "Coulda Shoulda Woulda"],
  },
  {
    title: "SoundCloud era",
    blurb: "The Diemon days, 2011 to 2016.",
    songs: ["Goodbye", "Psycho", "KiKi", "The King", "Boomerang", "Do It Myself", "Willy Wonka (feat. Paulina and Jafé)", "Too Many", "February", "Out of Tune", "Lapped", "Dr. Seuss", "Brooklyn Freestyle", "Pull the Trigger", "Titanic", "Down for You", "Yung God", "DiMaggio"],
  },
];
