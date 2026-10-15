// The timeline, oldest first. Each era repaints the whole page as it scrolls
// into view using its `palette`.
//
// Releases:
//   type     "album" | "ep" | "single"
//   spotify  { kind: "album" | "track", id } from the Spotify share link
//            (open.spotify.com/album/<id>). Leave it out and the card links
//            to a Spotify search instead.
//   cover    optional path to artwork in /public/covers. Without one the card
//            draws its own art in the era's colors.
export const ERAS = [
  {
    id: "diemon",
    years: "2011 to 2016",
    title: "Diemon Days",
    kicker: "The SoundCloud grind",
    blurb:
      "Russ co-founds Diemon in Atlanta, then self-releases eleven albums and 87 singles in under three years, producing, mixing and engineering nearly all of it himself. After that comes a song a week on SoundCloud for almost three years, until \"What They Want\" and \"Losin Control\" break into the Billboard Hot 100.",
    palette: { bg: "#120a1f", fg: "#f3e9ff", muted: "#a996c4", accent: "#b98cff" },
    releases: [
      { title: "Velvet", year: 2011, type: "album", spotify: { kind: "album", id: "5WzxgdzPvlq825wikQSRjv" } },
      { title: "Pink Elephant", year: 2014, type: "album" },
      { title: "What They Want", year: 2016, type: "single", spotify: { kind: "track", id: "0AjrdcjDF0nrsoTzOFdXUv" } },
      { title: "Losin Control", year: 2016, type: "single", spotify: { kind: "track", id: "1jkIErXa3YNUX5QIyO6GGR" } },
    ],
  },
  {
    id: "wolf",
    years: "2017",
    title: "There's Really a Wolf",
    kicker: "The debut",
    blurb:
      "A partnership with Columbia, but the same rules: Russ writes, produces and engineers. His official debut lands at No. 7 on the Billboard 200 and the Wake Up Tour takes the songs on the road.",
    palette: { bg: "#0b1218", fg: "#e6eef5", muted: "#8ea3b4", accent: "#8fd0ff" },
    releases: [
      { title: "There's Really a Wolf", year: 2017, type: "album", spotify: { kind: "album", id: "0lUL92det7mZ4DaHYmiUEC" } },
      { title: "Me You", year: 2017, type: "single" },
      { title: "Wife You Up", year: 2017, type: "single" },
    ],
  },
  {
    id: "zoo",
    years: "2018",
    title: "Zoo",
    kicker: "Louder, sharper",
    blurb:
      "The second album climbs to No. 4 on the Billboard 200, with Jessie Reyez on \"Basement\" and the late-year Just in Case EP closing things out.",
    palette: { bg: "#0d1a10", fg: "#f1f5e6", muted: "#a0ad8f", accent: "#f0b429" },
    releases: [
      { title: "Zoo", year: 2018, type: "album" },
      { title: "Basement (feat. Jessie Reyez)", year: 2018, type: "single" },
      { title: "Just in Case", year: 2018, type: "ep" },
    ],
  },
  {
    id: "snowglobe",
    years: "2019 to 2020",
    title: "Shake the Snow Globe",
    kicker: "The last Columbia record",
    blurb:
      "Another No. 4 debut. \"Best on Earth\" with Bia becomes one of his biggest records, and by June 2020 his deal is done.",
    palette: { bg: "#e8eef4", fg: "#0f1720", muted: "#56677a", accent: "#2563eb" },
    releases: [
      { title: "Shake the Snow Globe", year: 2020, type: "album", spotify: { kind: "album", id: "2ZzatxW5gv1XZ0uai8TKxk" } },
      { title: "Best on Earth (feat. Bia)", year: 2019, type: "single", spotify: { kind: "track", id: "6dt78h32We1nu4Vmv1OajN" } },
    ],
  },
  {
    id: "chomp",
    years: "2020 to 2022",
    title: "Chomp",
    kicker: "Fully independent",
    blurb:
      "On June 30, 2020 Russ announces he is independent. The Chomp series has him trading verses with heavyweight lyricists, and \"Are You Entertained\" with Ed Sheeran goes global without a major label behind it.",
    palette: { bg: "#170707", fg: "#fff1ec", muted: "#c79a90", accent: "#ff3b2f" },
    releases: [
      { title: "Chomp", year: 2020, type: "ep" },
      { title: "Chomp 2", year: 2021, type: "album", spotify: { kind: "album", id: "6a1EFm7L9Nl1wTm7JsrYBK" } },
      { title: "Are You Entertained (with Ed Sheeran)", year: 2021, type: "single", spotify: { kind: "track", id: "5bLGQqcpsz5ISWeihZfJnR" } },
      { title: "If Not Now, When?", year: 2022, type: "ep" },
    ],
  },
  {
    id: "santiago",
    years: "2023 to 2024",
    title: "Santiago",
    kicker: "Warmer, looser",
    blurb:
      "Santiago debuts at No. 12 on the Billboard 200. Then a film debut in M. Night Shyamalan's Trap, and a run of collaborations with 6lack and DJ Premier.",
    palette: { bg: "#1d1008", fg: "#fff3e3", muted: "#c9a587", accent: "#ff8a3d" },
    releases: [
      { title: "Nasty", year: 2023, type: "single", spotify: { kind: "track", id: "0DuylJNqsvjRN9hhWUdeJZ" } },
      { title: "Santiago", year: 2023, type: "album" },
      { title: "Workin on Me (with 6lack)", year: 2024, type: "single" },
      { title: "Work This Out (with DJ Premier)", year: 2024, type: "single" },
    ],
  },
  {
    id: "wild",
    years: "2025 to now",
    title: "W!LD",
    kicker: "The newest chapter",
    blurb:
      "W!LD arrives in June 2025, followed by the deluxe, The Elephant & The Rider. The same year Billboard names him an Indie Trailblazer, fourteen years after the first Diemon upload.",
    palette: { bg: "#060606", fg: "#f4ffe6", muted: "#9aa88a", accent: "#c6ff2e" },
    releases: [
      { title: "April 7", year: 2025, type: "single", spotify: { kind: "track", id: "3tHNvYvBIuTgYNMF5W4vzf" } },
      { title: "W!LD", year: 2025, type: "album", spotify: { kind: "album", id: "1gFQ6dGFvpDsHmnr4bPbTV" } },
      { title: "W!LD Deluxe: The Elephant & The Rider", year: 2025, type: "album", spotify: { kind: "album", id: "4yfXdMJl2ckTYvEXes0aaQ" } },
    ],
  },
];

// The palette the page uses outside the timeline (hero, shows, footer).
export const DEFAULT_PALETTE = { bg: "#09090b", fg: "#f5f5f4", muted: "#a1a1aa", accent: "#f5f5f4" };

export function spotifyEmbedUrl(spotify) {
  return `https://open.spotify.com/embed/${spotify.kind}/${spotify.id}?utm_source=generator&theme=0`;
}

export function spotifyLink(release) {
  if (release.spotify) return `https://open.spotify.com/${release.spotify.kind}/${release.spotify.id}`;
  return `https://open.spotify.com/search/${encodeURIComponent(`Russ ${release.title}`)}`;
}
