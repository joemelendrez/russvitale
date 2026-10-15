"use client";
import { useMemo } from "react";
import { featureCredit } from "@/data/features";
import { releaseKey } from "@/data/releaseKey";
import { MIN_FANS, useFavoriteCounts } from "@/lib/favoriteCounts";
import { useAllReleases } from "./Discography";
import FavoriteButton from "./FavoriteButton";

// The fan chart: releases the most signed-in fans have in their favorites.
// Shows nothing until at least one release reaches MIN_FANS.
export default function MostLoved({ limit = 10 }) {
  const counts = useFavoriteCounts();
  const all = useAllReleases();
  const chart = useMemo(() => {
    const byKey = new Map(all.map((r) => [releaseKey(r), r]));
    return [...counts]
      .map(([key, fans]) => ({ release: byKey.get(key), fans }))
      .filter((x) => x.release)
      .slice(0, limit);
  }, [counts, all, limit]);

  if (!chart.length) return null;
  const top = chart[0].fans;

  return (
    <section className="mt-16" aria-labelledby="most-loved">
      <p className="text-xs uppercase tracking-[0.35em] text-era-muted">From fans with accounts</p>
      <h2 id="most-loved" className="mt-3 font-display text-4xl uppercase sm:text-5xl">
        Most loved
      </h2>
      <ol className="mt-6 space-y-2">
        {chart.map(({ release, fans }, i) => (
          <li key={releaseKey(release)} className="relative flex items-center gap-4 overflow-hidden rounded-xl px-3 py-2.5">
            <span className="absolute inset-y-0 left-0 bg-era-accent/10" style={{ width: `${(fans / top) * 100}%` }} aria-hidden="true" />
            <span className="relative w-7 text-right font-display text-xl text-era-accent">{i + 1}</span>
            <span className="relative min-w-0 flex-1">
              <span className="block truncate font-semibold">{release.title}</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-era-muted">
                {release.type === "feature" ? featureCredit(release) : release.shownYear} &middot; {fans} fans
              </span>
            </span>
            <FavoriteButton release={release} className="relative" />
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-era-muted">Counts only fans who sign in, and only songs at least {MIN_FANS} of them love. Nobody&apos;s list is shown.</p>
    </section>
  );
}
