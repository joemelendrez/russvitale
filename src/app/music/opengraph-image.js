import { ogCard } from "@/lib/ogCard";

export const alt = "Every Russ release in one list. An unofficial fan archive.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({ kicker: "All music", title: "Every Russ release", sub: "Albums, EPs, singles, versions and features, searchable and playable." });
}
