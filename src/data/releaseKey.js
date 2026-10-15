import { ERAS } from "./eras";
import { SINGLES_BY_YEAR } from "./singles";
import { CATALOG_SINGLES_BY_YEAR } from "./catalog";

// A stable id for a release, used to store a Spotify link pasted on the page.
export function releaseKey(release) {
  const slug = release.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${release.type}-${release.year}-${slug}`;
}

export const ALL_RELEASES = [
  ...ERAS.flatMap((era) => era.releases),
  ...SINGLES_BY_YEAR.flatMap((group) => group.singles.map((single) => ({ ...single, year: group.year }))),
];

// Everything /music lists: the albums plus every single in catalog.js.
export const CATALOG_RELEASES = [
  ...ERAS.flatMap((era) => era.releases),
  ...CATALOG_SINGLES_BY_YEAR.flatMap((group) => group.singles.map((single) => ({ ...single, year: group.year }))),
];

export const RELEASE_KEYS = new Set(ALL_RELEASES.map(releaseKey));

// Reads a Spotify share link (open.spotify.com/album/<id>?si=..., the intl-xx
// variants, or a spotify:track:<id> URI) into { kind, id }, or null.
export function parseSpotifyLink(text) {
  const value = String(text ?? "").trim();
  const match =
    value.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?(album|track)\/([A-Za-z0-9]{22})/) ??
    value.match(/^spotify:(album|track):([A-Za-z0-9]{22})$/);
  return match ? { kind: match[1], id: match[2] } : null;
}
