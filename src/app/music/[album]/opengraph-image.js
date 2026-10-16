import { albumBySlug } from "@/data/albums";
import { ogCard } from "@/lib/ogCard";

export const alt = "A Russ album on the unofficial fan archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }) {
  const { album: slug } = await params;
  const album = albumBySlug(slug);
  if (!album) return ogCard({ kicker: "All music", title: "Every Russ release" });
  const songs = album.tracks.length ? `${album.tracks.length} songs · ` : "";
  return ogCard({ kicker: `${album.era.title} era · ${album.year}`, title: album.title, sub: `${songs}Tracklist and the official Spotify player.` });
}
