// The albums timeline, oldest first (singles live in singles.js). Each era
// repaints the whole page as it scrolls into view using its `palette`.
//
// Releases:
//   type     "album" | "ep"
//   spotify  { kind: "album" | "track", id } from the Spotify share link
//            (open.spotify.com/album/<id>).
//   soundcloud  a soundcloud.com link, for releases Spotify doesn't carry.
//            With neither, the card links to a Spotify search instead.
//   date     release day, "YYYY-MM-DD" (an admin can set or fix it from edit mode)
//   cover    optional path to artwork in /public/covers. Without one the card
//            draws its own art in the era's colors.
export const ERAS = [
  {
    id: "diemon",
    years: "2011 to 2016",
    title: "Diemon Days",
    kicker: "The SoundCloud grind",
    blurb:
      "Russ co-founds Diemon in Atlanta, then self-releases eleven albums and 87 singles in under three years, producing, mixing and engineering nearly all of it himself.\n\nAfter that comes a song a week on SoundCloud for almost three years, until \"What They Want\" and \"Losin Control\" break into the Billboard Hot 100.",
    palette: { bg: "#0b0c22", fg: "#eef0ff", muted: "#9c9fd0", accent: "#a7abff" },
    releases: [
      { title: "Velvet", year: 2011, date: "2011-12-09", type: "album", spotify: { kind: "album", id: "5WzxgdzPvlq825wikQSRjv" } },
      { title: "Apollo 13", year: 2012, date: "2012-01-24", type: "album" },
      { title: "5280", year: 2012, date: "2012-07-23", type: "album", spotify: { kind: "album", id: "6K4fDvF7E5uqN1BsvYUYFp" } },
      { title: "Vacation", year: 2012, date: "2012-09-24", type: "album", spotify: { kind: "album", id: "5vBogQencvbV8I0N38tf5E" } },
      { title: "Straight From Limbo", year: 2013, date: "2013-01-01", type: "album", spotify: { kind: "album", id: "5x1YzNGPlD0K2rExbgMa7k" } },
      { title: "The Edge", year: 2013, date: "2013-06-12", type: "album", spotify: { kind: "album", id: "5Qn4TuVc7C8YENgsDo2B2k" } },
      { title: "Color Blind", year: 2013, date: "2013-09-02", type: "album", spotify: { kind: "album", id: "3TS0aPsOU08Eu3Jr5NSWPz" } },
      { title: "Pink Elephant", year: 2014, date: "2014-01-23", type: "album", spotify: { kind: "album", id: "0NI2guYRXuRQvjAiSrhfh5" } },
      { title: "Brain Dead", year: 2014, date: "2014-03-24", type: "album", spotify: { kind: "album", id: "2kZ8n3EFPdiWXM5x2j0JxF" } },
      { title: "Silence", year: 2014, date: "2014-06-11", type: "album" },
      { title: "How to Rob", year: 2014, date: "2014-08-18", type: "album" },
    ],
  },
  {
    id: "wolf",
    years: "2017",
    title: "There's Really a Wolf",
    kicker: "The debut",
    blurb:
      "A partnership with Columbia, but the same rules: Russ writes, produces and engineers.\n\nHis official debut lands at No. 7 on the Billboard 200 and the Wake Up Tour takes the songs on the road.",
    palette: { bg: "#f3f2ec", fg: "#16160f", muted: "#6c6b63", accent: "#16160f" },
    releases: [
      { title: "There's Really a Wolf", year: 2017, date: "2017-05-05", type: "album", spotify: { kind: "album", id: "0lUL92det7mZ4DaHYmiUEC" } },
    ],
  },
  {
    id: "zoo",
    years: "2018",
    title: "Zoo",
    kicker: "Louder, sharper",
    blurb:
      "The second album climbs to No. 4 on the Billboard 200, with Jessie Reyez on \"Basement\" and the late-year Just in Case EP closing things out.",
    palette: { bg: "#1a120a", fg: "#f4ead6", muted: "#ab977a", accent: "#e0a33e" },
    releases: [
      { title: "Zoo", year: 2018, date: "2018-09-07", type: "album" },
      { title: "Just in Case", year: 2018, date: "2018-12-23", type: "ep", spotify: { kind: "album", id: "7CC9iqq2JZ3j4jF9SNNLL7" } },
    ],
  },
  {
    id: "snowglobe",
    years: "2019 to 2020",
    title: "Shake the Snow Globe",
    kicker: "The last Columbia record",
    blurb:
      "Another No. 4 debut.\n\n\"Best on Earth\" with Bia becomes one of his biggest records, and by June 2020 his deal is done.",
    palette: { bg: "#030404", fg: "#e9f3f2", muted: "#8d9a99", accent: "#93dcd8" },
    releases: [
      { title: "Shake the Snow Globe", year: 2020, date: "2020-01-31", type: "album", spotify: { kind: "album", id: "2ZzatxW5gv1XZ0uai8TKxk" } },
    ],
  },
  {
    id: "chomp",
    years: "2020 to 2022",
    title: "Chomp",
    kicker: "Fully independent",
    blurb:
      "On June 30, 2020 Russ announces he is independent.\n\nThe Chomp series has him trading verses with heavyweight lyricists, and \"Are You Entertained\" with Ed Sheeran goes global without a major label behind it.",
    palette: { bg: "#1e0606", fg: "#fff0e8", muted: "#c69a92", accent: "#ffd21f" },
    releases: [
      { title: "Chomp", year: 2020, date: "2020-11-17", type: "ep", spotify: { kind: "album", id: "6hTlfMRAEJBMyETemdH5Qq" } },
      { title: "Chomp 2", year: 2021, date: "2021-12-08", type: "album", spotify: { kind: "album", id: "6a1EFm7L9Nl1wTm7JsrYBK" } },
      { title: "If Not Now, When?", year: 2022, date: "2022-04-26", type: "ep", spotify: { kind: "album", id: "5K4Ygp0yLgeaYSKFizi15P" } },
    ],
  },
  {
    id: "santiago",
    years: "2023 to 2024",
    title: "Santiago",
    kicker: "Warmer, looser",
    blurb:
      "Santiago debuts at No. 12 on the Billboard 200.\n\nThen a film debut in M. Night Shyamalan's Trap, and a run of collaborations with 6lack and DJ Premier.",
    palette: { bg: "#0f1c3f", fg: "#e9f5f8", muted: "#93b3c6", accent: "#62b6d0" },
    releases: [
      { title: "Santiago", year: 2023, date: "2023-08-18", type: "album", spotify: { kind: "album", id: "3mX0HbDt7oIzBBJHgQYnDY" } },
    ],
  },
  {
    id: "wild",
    years: "2025 to now",
    title: "W!LD",
    kicker: "The newest chapter",
    blurb:
      "W!LD arrives in June 2025, followed by the deluxe, The Elephant & The Rider.\n\nThe same year Billboard names him an Indie Trailblazer, fourteen years after the first Diemon upload.",
    palette: { bg: "#e5e2dc", fg: "#121417", muted: "#5f6168", accent: "#0a4fc8" },
    releases: [
      { title: "W!LD", year: 2025, date: "2025-06-27", type: "album", spotify: { kind: "album", id: "1gFQ6dGFvpDsHmnr4bPbTV" } },
      { title: "W!LD Deluxe: The Elephant & The Rider", year: 2025, type: "album", spotify: { kind: "album", id: "4yfXdMJl2ckTYvEXes0aaQ" } },
    ],
  },
];

// The palette the page uses outside the timeline (hero, shows, footer).
// Its red comes from the stage lights and jersey in the hero photo.
export const DEFAULT_PALETTE = { bg: "#08070c", fg: "#f5f5f4", muted: "#a1a1aa", accent: "#ff3b30" };

// The few blocks outside the timeline that get their own colors; everything
// else stays black.
export const SECTION_PALETTES = {
  // The purple and white of his second book, It Was You All Along.
  watch: { bg: "#7b1fd0", fg: "#ffffff", muted: "#e2cdf8", accent: "#ffffff" },
  // The yellow and black of his book, It's All in Your Head.
  footer: { bg: "#ffe600", fg: "#111111", muted: "#2b2805", accent: "#111111" },
};

// The era a given year belongs to, for coloring the singles timeline.
const ERA_BY_YEAR = { 2016: "diemon", 2017: "wolf", 2018: "zoo", 2019: "snowglobe", 2020: "chomp", 2021: "chomp", 2022: "chomp", 2023: "santiago", 2024: "santiago" };

export function eraForYear(year) {
  const id = ERA_BY_YEAR[year] ?? (year < 2016 ? "diemon" : "wild");
  return ERAS.find((era) => era.id === id);
}
