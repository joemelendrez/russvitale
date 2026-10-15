import { SINGLES_BY_YEAR } from "./singles";
import { CATALOG_TRACK_IDS } from "./spotifyIds";

// Same key as releaseKey() (releaseKey.js imports this file, so it is repeated here).
const keyOf = (title, year) => `single-${year}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

// The rest of Russ's singles and promotional singles, from the "Russ
// discography" article on Wikipedia (years only; exact dates get filled in
// from edit mode). These only show on /music; the Singles timeline on the
// home page keeps the hand-picked ones in singles.js.
const MORE = {
  2014: ["Goodbye", "Psycho", "KiKi", "The King", "Boomerang", "No Matter What"],
  2015: [
    "Willy Wonka (feat. Paulina and Jafé)",
    "Too Many",
    "Pull the Trigger",
    "Someone to Drink With",
    "Do It Myself",
    "February",
    "Got It Good",
    "Hoe Love",
    "My Baby",
    "Out of Tune",
    "Lonely in Time Square",
    "Shootin Up (feat. Bugus)",
    "Brand New",
    "99 (feat. Paulina and TOTEM)",
    "If I Died",
    "Reminder",
    "Single Parent Anthem",
    "Brooklyn Freestyle",
    "Your Favorite Rapper",
    "Piranha Freestyle",
    "Bugatti Stranger",
    "Lapped",
    "Dr. Seuss",
    "Keep It Moving (feat. John Anthony)",
    "Like That",
    "Straight from Saudi",
    "Juice & Sauce",
    "First One",
    "Here I Am",
    "Always Knew",
    "Titanic",
    "The Formula",
    "Down for You",
  ],
  2016: [
    "Waste My Time",
    "Exposed",
    "We Just Haven't Met Yet",
    "Gone",
    "Look",
    "Overdue",
    "For the Stunt",
    "Psycho, Pt. 2",
    "Fallin' Too",
    "Ain't Nobody Takin My Baby",
    "Try It",
    "Moonlight in Atlanta",
    "The Otherside",
    "Confidence",
    "Lost",
    "Manifest",
    "Tsunami",
    "Let Me In",
    "T'd Up",
    "DiMaggio",
    "Unavailable",
    "Whenever",
    "Off the Strength",
    "10 Year Freestyle",
  ],
  2017: [
    "The Journey",
    "Maybe",
    "The Best Party",
    "Used to You",
    "Take It All In (feat. Rexx Life Raj)",
    "Keep on Goin (feat. Bas)",
    "Cherry Hill",
    "The Game",
    "Think Twice",
    "Prosper",
    "Lean on You",
  ],
  2018: ["Back to Life", "Nobody Knows", "Alone", "Since I Was Broke", "Sore Losers", "Dangerous", "Don't Fall for It", "September 16", "Tell Me Why", "Serious"],
  2019: ["Paranoid", "Summer at 7", "Rent Free", "Crown", "ON 10 (feat. Rexx Life Raj)", "Old Days", "Grammy Bag Freestyle", "Nighttime (Interlude)"],
  2020: ["Paid Off", "Sorry", "I Love Me", "Live from the Villa", "Can't Be Me", "Still", "One More Chance", "Why", "Aw Aw", "Freed Up"],
  2021: [
    "Misunderstood",
    "Bankrupt",
    "Small Talk",
    "Status",
    "Private (feat. Rexx Life Raj)",
    "Money on Me",
    "Rather Be Myself",
    "Satisfy",
    "On the Way",
    "Nothin I Won't Do",
    "Fate",
    "When I'm with You",
    "Can't Let Go",
    "When This Was All New",
    "Losin Control, Pt. 2",
  ],
  2022: ["Real", "Last Night", "Too Much", "Home"],
  2023: ["Can't Get This Right", "Fire", "Said It Freestyle"],
  2024: ["I Got You", "Win", "Break!", "If This Is It", "Get Up and Get It"],
  2025: ["Pent Up in a Penthouse", "Clue"],
};

// "Ain't Goin Back (feat. X)" and "Aint Goin Back" are the same song.
export const sameSong = (a, b) => {
  const norm = (t) => t.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "");
  return norm(a) === norm(b);
};

// Every single by year: the timeline's (with their players) plus the rest.
export const CATALOG_SINGLES_BY_YEAR = (() => {
  const groups = SINGLES_BY_YEAR.map((g) => ({ ...g, singles: [...g.singles] }));
  const known = groups.flatMap((g) => g.singles.map((s) => s.title));
  for (const [year, titles] of Object.entries(MORE)) {
    let group = groups.find((g) => g.year === Number(year));
    if (!group) {
      group = { year: Number(year), singles: [] };
      groups.push(group);
    }
    for (const title of titles) {
      if (known.some((k) => sameSong(k, title))) continue;
      known.push(title);
      const id = CATALOG_TRACK_IDS[keyOf(title, year)];
      group.singles.push({ title, type: "single", ...(id && { spotify: { kind: "track", id } }) });
    }
  }
  return groups.sort((a, b) => a.year - b.year);
})();
