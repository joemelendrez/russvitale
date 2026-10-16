export const SITE = {
  name: "Russ Vitale Fan Archive",
  url: "https://russvitale.com",
  description:
    "An unofficial fan site walking through Russ's music from the SoundCloud era to now, with every album and single playable through Spotify, YouTube Music or SoundCloud.",
  officialSite: "https://www.russworld.com",
  spotifyArtist: "https://open.spotify.com/artist/1z7b1Pr1rSlvWRzsW3HOrS",
  builder: { name: "Joseph Melendrez", url: "https://josephmelendrez.com" },
  youtubeMusic: "https://music.youtube.com/channel/UCiIETTq2It3OzW8_WYRPTyQ",
};

// `group` items share one dropdown in the desktop header and a labelled
// block in the phone menu; the footer lists every link flat.
export const NAV = [
  { label: "Albums", href: "#music", tab: "albums", group: "Music" },
  { label: "Singles", href: "#singles", tab: "singles", group: "Music" },
  { label: "All music", href: "/music", page: true, group: "Music" },
  { label: "Features", href: "/music#features", page: true, group: "Music" },
  { label: "Top 10", href: "/top10", page: true, group: "Music" },
  { label: "Playlists", href: "/playlists", page: true, group: "Music" },
  { label: "Blog", href: "/blog", page: true },
  { label: "Favorites", href: "/favorites", page: true },
  { label: "Shows", href: "#shows" },
  { label: "Watch", href: "#watch" },
  { label: "About", href: "#about" },
];

// NAV with each group folded into one { group, items } entry where its first
// link sits.
export function navMenu() {
  const out = [];
  for (const item of NAV) {
    if (!item.group) out.push(item);
    else {
      const g = out.find((e) => e.group === item.group && e.items);
      if (g) g.items.push(item);
      else out.push({ group: item.group, items: [item] });
    }
  }
  return out;
}

// Plain Amazon links, no affiliate tag: the site earns nothing.
const amazon = (asin) => `https://www.amazon.com/dp/${asin}`;

// `type`/`year` give each book a release key, so its cover uploads in edit
// mode and is stored like an album cover.
export const BOOKS = [
  { type: "book", year: 2019, title: "It's All In Your Head", note: "His first book, on building self-belief before anyone else has it.", href: amazon("0062962434") },
  { type: "book", year: 2023, title: "It Was You All Along", note: "A memoir about therapy, growth and learning to like himself.", href: amazon("0063357887") },
];
