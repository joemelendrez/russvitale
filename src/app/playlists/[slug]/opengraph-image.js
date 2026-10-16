import { PLAYLIST_IDEAS } from "@/data/playlists";
import { slugify } from "@/data/albums";
import { ogCard } from "@/lib/ogCard";

export const alt = "A fan-made Russ playlist on the unofficial fan archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { slug } = await params;
  const idea = PLAYLIST_IDEAS.find((p) => slugify(p.title) === slug);
  const title = idea?.title ?? slug.replace(/-/g, " ");
  return ogCard({ kicker: "Russ playlist · Unofficial", title, sub: idea?.blurb ? `${idea.blurb} Play it on Spotify.` : "A fan-made playlist. Play it on Spotify." });
}
