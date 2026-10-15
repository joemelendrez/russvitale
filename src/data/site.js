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

export const NAV = [
  { label: "Albums", href: "#music", tab: "albums" },
  { label: "Singles", href: "#singles", tab: "singles" },
  { label: "All music", href: "/music", page: true },
  { label: "Shows", href: "#shows" },
  { label: "Watch", href: "#watch" },
  { label: "About", href: "#about" },
];

// Amazon Associates links (Joseph's tag). Any page showing these needs the
// AMAZON_DISCLOSURE line next to them.
const AMAZON_TAG = "joseph0f30b-20";
const amazon = (asin) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`;

export const AMAZON_DISCLOSURE = "As an Amazon Associate, this site earns from qualifying purchases.";

// `type`/`year` give each book a release key, so its cover uploads in edit
// mode and is stored like an album cover.
export const BOOKS = [
  { type: "book", year: 2019, title: "It's All In Your Head", note: "His first book, on building self-belief before anyone else has it.", href: amazon("0062962434") },
  { type: "book", year: 2023, title: "It Was You All Along", note: "A memoir about therapy, growth and learning to like himself.", href: amazon("0063357887") },
];
