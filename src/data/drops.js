import { SINGLES_BY_YEAR } from "./singles";

// A row from the `russ_drops` table as a release card.
export function dropToRelease(drop) {
  return {
    title: drop.title,
    type: "single",
    year: Number(drop.released_on.slice(0, 4)),
    dropId: drop.id,
    ...(drop.spotify_id ? { spotify: { kind: drop.kind, id: drop.spotify_id } } : {}),
  };
}

const sameTitle = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// The Singles timeline with drops added at the end of their year, oldest
// first like the rest of the list. A drop with the same title as a single in
// src/data/singles.js replaces it, so a drop can also correct a release's date
// (and keeps its Spotify player if the drop has none).
export function singlesWithDrops(drops) {
  if (!drops?.length) return SINGLES_BY_YEAR;
  const groups = SINGLES_BY_YEAR.map((g) => ({ ...g, singles: [...g.singles] }));
  for (const drop of [...drops].reverse()) {
    let release = dropToRelease(drop);
    for (const g of groups) {
      const i = g.singles.findIndex((s) => !s.dropId && sameTitle(s.title, release.title));
      if (i === -1) continue;
      const [existing] = g.singles.splice(i, 1);
      if (!release.spotify && existing.spotify) release = { ...release, spotify: existing.spotify };
    }
    let group = groups.find((g) => g.year === release.year);
    if (!group) {
      group = { year: release.year, note: "The newest drops.", singles: [] };
      groups.push(group);
    }
    if (group.singles.some((s) => sameTitle(s.title, release.title))) continue;
    group.singles.push(release);
  }
  return groups.filter((g) => g.singles.length).sort((a, b) => a.year - b.year);
}

// The drop the slide-down bar should announce: the newest one marked for it.
export function bannerDrop(drops) {
  return drops?.find((d) => d.show_banner) ?? null;
}
