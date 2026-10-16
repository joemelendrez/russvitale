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

// Every color a playlist cover can use: the era colors, then each album's
// own accent, then a few plain ones. Any other hex works too (the custom
// picker), these are just the quick picks.
export const COVER_COLORS = (() => {
  const out = [];
  const add = (color, title) => {
    if (!out.some((c) => c.color.toLowerCase() === color.toLowerCase())) out.push({ color, title });
  };
  for (const s of ALBUM_SWATCHES) add(s.color, s.title);
  for (const era of ERAS) for (const r of era.releases) if (r.palette) add(r.palette.accent, r.title);
  for (const era of ERAS) add(era.palette.bg, `${era.title} (dark)`);
  for (const [color, title] of [["#0a0a0a", "Black"], ["#f5f5f4", "White"], ["#c4241b", "Red"], ["#1d4ed8", "Blue"], ["#15803d", "Green"], ["#7c3aed", "Purple"]]) add(color, title);
  return out;
})();

// A cover color from a URL or a picker: "#rrggbb", lowercase, or null.
export function coverHex(value) {
  const m = String(value ?? "").trim().replace(/^#/, "").match(/^[0-9a-f]{6}$/i);
  return m ? `#${m[0].toLowerCase()}` : null;
}

// The swatch color for the nth item in a list, cycling through the albums.
export const swatchAt = (i) => ALBUM_SWATCHES[i % ALBUM_SWATCHES.length].color;

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
        <li key={s.id} title={s.title} className="h-4 w-4 shrink-0 rounded-[4px] ring-1 ring-white/10" style={{ background: s.color }}>
          <span className="sr-only">{s.title}</span>
        </li>
      ))}
    </ul>
  );
}
