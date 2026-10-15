"use client";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import { releaseKey } from "@/data/releaseKey";

// A heart that saves a release to the fan's favorites (on this device).
export default function FavoriteButton({ release, className = "" }) {
  const key = releaseKey(release);
  const saved = useFavorites().includes(key);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(key);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${release.title} from favorites` : `Add ${release.title} to favorites`}
      title={saved ? "In your favorites" : "Add to favorites"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${saved ? "text-era-accent" : "text-era-fg/50 hover:text-era-fg"} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  );
}
