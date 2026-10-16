"use client";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { releaseKey } from "@/data/releaseKey";
import { shortCount, useFavoriteCounts } from "@/lib/favoriteCounts";

// A heart that saves a release to the fan's favorites (on this device), with
// how many fans have it once that's at least MIN_FANS.
export default function FavoriteButton({ release, className = "" }) {
  const key = releaseKey(release);
  const saved = useFavorites().includes(key);
  const fans = useFavoriteCounts().get(key);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(key);
      }}
      aria-pressed={saved}
      aria-label={`${saved ? `Remove ${release.title} from favorites` : `Add ${release.title} to favorites`}${fans ? `. ${fans} fans love it` : ""}`}
      title={`${saved ? "In your favorites" : "Add to favorites"}${fans ? ` · ${fans} fans love it` : ""}`}
      className={`flex h-10 shrink-0 items-center justify-center gap-1 rounded-full transition-colors ${fans ? "min-w-10 px-2" : "w-10"} ${saved ? "text-era-accent" : "text-era-fg/50 hover:text-era-fg"} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
      {fans ? <span className="text-[11px] font-semibold tabular-nums">{shortCount(fans)}</span> : null}
    </button>
  );
}
