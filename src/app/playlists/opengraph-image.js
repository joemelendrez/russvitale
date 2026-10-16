import { ogCard } from "@/lib/ogCard";

export const alt = "Russ playlists for every mood on the unofficial fan archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return ogCard({ kicker: "Unofficial fan playlists", title: "Russ for every mood", sub: "Gym, late night drives, chill days and more. Play them on Spotify." });
}
