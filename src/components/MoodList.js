import Link from "@/components/QuietLink";
import { playlistHref } from "@/data/albums";

// Playlists as rows split by a line, each in its own cover color, like the
// cards on /playlists. Lists need { title, color }.
export default function MoodList({ lists, className = "" }) {
  return (
    <ul className={`border-t border-era-fg/10 ${className}`}>
      {lists.map((p) => (
        <li key={p.spotify_id ?? p.title} style={{ "--cover": p.color }}>
          <Link href={playlistHref(p.title)} className="group flex items-center gap-3 border-b border-era-fg/10 py-3">
            <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden="true" />
            <span className="cover-ink min-w-0 flex-1 truncate font-display text-2xl uppercase leading-none group-hover:underline">{p.title}</span>
            <span aria-hidden="true" className="text-era-muted transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
