import { ERAS } from "./eras";
import { otherDrops, singlesWithDrops } from "./drops";
import { CATALOG_SINGLES_BY_YEAR, sameSong } from "./catalog";
import { VERSION_RELEASES } from "./versions";
import { tracklistFor } from "./tracklists";
import { FEATURE_RELEASES } from "./features";

// Every album, EP, version, feature and single with the admin's drops
// applied, before saved links. Shared by /music (useAllReleases) and the
// server (top 10 images), so a release key means the same song in both.
// A drop with the same title as a listed release (or naming a built-in
// feature in `replaces`) replaces it; a hidden one takes that feature off.
export function baseReleases(drops) {
  const albums = ERAS.flatMap((era) => era.releases.map((r) => ({ ...r, era })));
  const singles = singlesWithDrops(drops, CATALOG_SINGLES_BY_YEAR).flatMap((g) => g.singles.map((s) => ({ ...s, year: s.year ?? g.year })));
  const listed = [...albums, ...VERSION_RELEASES, ...FEATURE_RELEASES];
  for (const added of otherDrops(drops)) {
    const i = listed.findIndex((r) => r.type === added.type && !r.dropId && sameSong(r.title, added.replaces ?? added.title));
    if (added.hidden) {
      if (i !== -1) listed.splice(i, 1);
    } else if (i === -1) listed.push(added);
    else listed[i] = { ...listed[i], ...added, era: undefined };
  }
  return [...listed, ...singles];
}

// Every album and EP song that isn't already listed as a single, feature or
// version, as its own release (type "song") that plays the song itself and
// carries its album's cover, colors and year. On two albums (a deluxe), the
// first one wins.
export function albumSongs(releases) {
  const listed = releases.filter((r) => r.type !== "album" && r.type !== "ep");
  const songs = [];
  for (const r of releases) {
    if (r.type !== "album" && r.type !== "ep") continue;
    for (const t of tracklistFor(r)) {
      if (listed.some((o) => sameSong(o.title, t.title)) || songs.some((o) => sameSong(o.title, t.title))) continue;
      const others = t.artists
        .split(", ")
        .filter((a) => a !== "Russ")
        .join(", ");
      songs.push({
        type: "song",
        title: t.title,
        year: r.year,
        date: r.date,
        shownYear: r.shownYear,
        era: r.era,
        palette: r.palette,
        cover: r.cover,
        spotify: { kind: "track", id: t.trackId },
        album: r.title,
        albumType: r.type,
        withArtists: others || undefined,
      });
    }
  }
  return songs;
}
