// Upcoming shows. Add one object per date; past dates hide themselves.
// Example:
// { date: "2026-11-20", city: "Atlanta, GA", venue: "State Farm Arena", tickets: "https://..." },
// Ticket links should point to the official seller, never a reseller we pick.
export const SHOWS = [];

// Russ's Bandsintown artist page; its official widget lists his dates.
export const BANDSINTOWN = { artistId: 187035, href: "https://www.bandsintown.com/a/187035-russ" };

// Where fans can always find the real, current list.
export const TOUR_LINKS = [
  { label: "Official tour dates", href: "https://www.russworld.com", note: "russworld.com" },
  { label: "Bandsintown", href: "https://www.bandsintown.com/a/187035-russ", note: "Track Russ for alerts" },
  { label: "Songkick", href: "https://www.songkick.com/search?query=Russ", note: "Past setlists and dates" },
];
