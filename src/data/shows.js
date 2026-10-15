// Upcoming shows. Add one object per date; past dates hide themselves.
// Example:
// { date: "2026-11-20", city: "Atlanta, GA", venue: "State Farm Arena", tickets: "https://..." },
// Ticket links should point to the official seller, never a reseller we pick.
export const SHOWS = [];

// Russ's Bandsintown artist page; its official widget lists his dates.
export const BANDSINTOWN = { artistId: 187035, href: "https://www.bandsintown.com/a/187035-russ" };

// Ticketmaster affiliate program, run through Impact. Paste the tracking
// link base from Impact (Ads > Create link, without the ?u= part), e.g.
// "https://ticketmaster.evyy.net/c/1234567/264167/4272". While it's empty,
// Ticketmaster links go out plain and no disclosure shows.
export const TICKETMASTER_TRACKING = "";
export const TICKETMASTER_DISCLOSURE = "Ticketmaster links are affiliate links: this site may earn a commission on tickets, at no extra cost to you.";

const isTicketmaster = (url) => /^https:\/\/(www\.)?ticketmaster\.(com|ca)\//.test(url || "");

// Wraps an official Ticketmaster URL in the Impact tracking link. Anything
// else (and everything while tracking isn't set) comes back unchanged.
export function ticketLink(url) {
  if (!TICKETMASTER_TRACKING || !isTicketmaster(url)) return { href: url, sponsored: false };
  return { href: `${TICKETMASTER_TRACKING}?u=${encodeURIComponent(url)}`, sponsored: true };
}

export const hasTicketmasterAffiliate = Boolean(TICKETMASTER_TRACKING);

// Where fans can always find the real, current list.
export const TOUR_LINKS = [
  { label: "Ticketmaster", href: "https://www.ticketmaster.com/search?q=russ", note: "Official tickets" },
  { label: "Official tour dates", href: "https://www.russworld.com", note: "russworld.com" },
  { label: "Bandsintown", href: "https://www.bandsintown.com/a/187035-russ", note: "Track Russ for alerts" },
  { label: "Songkick", href: "https://www.songkick.com/search?query=Russ", note: "Past setlists and dates" },
];
