import { ogCard } from "@/lib/ogCard";

export const alt = "Russ: the music, era by era. An unofficial fan archive.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({ kicker: "The music, era by era", title: "Russ", sub: "Every album and single from the SoundCloud days to now, playable in one place." });
}
