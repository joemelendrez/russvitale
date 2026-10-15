import { ERAS } from "@/data/eras";

// One color per album era, taken from the colors the timeline repaints the
// page with. W!LD and There's Really a Wolf are light covers, so their
// background color reads better than their dark accent.
const LIGHT_ERAS = new Set(["wolf"]);
export const ALBUM_SWATCHES = ERAS.map((era) => ({
  id: era.id,
  title: era.title,
  color: LIGHT_ERAS.has(era.id) ? era.palette.bg : era.palette.accent,
}));

// "chips": a row of small squares, one per album. "band": a full-width strip.
export default function AlbumSwatches({ variant = "chips", className = "" }) {
  if (variant === "band") {
    return (
      <div className={`flex h-2 w-full ${className}`} aria-hidden="true">
        {ALBUM_SWATCHES.map((s) => (
          <span key={s.id} className="flex-1" style={{ background: s.color }} />
        ))}
      </div>
    );
  }
  return (
    <ul className={`flex gap-1.5 ${className}`} aria-label="Album colors">
      {ALBUM_SWATCHES.map((s) => (
        <li key={s.id} title={s.title} className="h-4 w-4 rounded-[4px] ring-1 ring-white/10" style={{ background: s.color }}>
          <span className="sr-only">{s.title}</span>
        </li>
      ))}
    </ul>
  );
}
