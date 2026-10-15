import { ogCard } from "@/lib/ogCard";

export const alt = "The Russ mindset blog. An unofficial fan site.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({ kicker: "The mindset", title: "The Russ mindset blog", sub: "A fan's notes on betting on yourself, ownership and consistency." });
}
