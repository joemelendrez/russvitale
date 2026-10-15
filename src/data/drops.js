import { SINGLES_BY_YEAR } from "./singles";
import { releaseFieldsFromRow } from "./players";

// A row from the `russ_drops` table as a release card.
export function dropToRelease(drop) {
  return {
    title: drop.title,
    type: drop.release_type ?? "single",
    ...(drop.version_of ? { versionOf: drop.version_of } : {}),
    year: Number(drop.released_on.slice(0, 4)),
    dropId: drop.id,
    ...releaseFieldsFromRow(drop),
  };
}

const sameTitle = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// The Singles timeline with drops added at the end of their year, oldest
// first like the rest of the list. A drop with the same title as a single in
// src/data/singles.js replaces it, so a drop can also correct a release's date
// (and keeps its players for any service the drop has no link for).
export function singlesWithDrops(allDrops, base = SINGLES_BY_YEAR) {
  // Albums, EPs and versions added from admin only show on /music.
  const drops = allDrops?.filter((d) => (d.release_type ?? "single") === "single");
  if (!drops?.length) return base;
  const groups = base.map((g) => ({ ...g, singles: [...g.singles] }));
  for (const drop of [...drops].reverse()) {
    let release = dropToRelease(drop);
    for (const g of groups) {
      const i = g.singles.findIndex((s) => !s.dropId && sameTitle(s.title, release.title));
      if (i === -1) continue;
      const [existing] = g.singles.splice(i, 1);
      // A drop keeps the single's links for any service it has none for.
      if (!release.spotify && !release.soundcloud) {
        release = { ...release, ...(existing.spotify ? { spotify: existing.spotify } : {}), ...(existing.soundcloud ? { soundcloud: existing.soundcloud } : {}) };
      }
      if (!release.youtube && existing.youtube) release = { ...release, youtube: existing.youtube };
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

// Albums, EPs and versions added from admin, as releases for /music.
export function otherDrops(drops) {
  return (drops ?? []).filter((d) => (d.release_type ?? "single") !== "single").map(dropToRelease);
}
