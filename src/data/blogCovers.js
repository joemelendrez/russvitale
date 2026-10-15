import { COVER_ICONS } from "./coverIcons";

// Blog covers in the style of Russ's single art: one flat color, one small
// white line icon in the middle, nothing else. Each category has its color;
// section images inside a post use an off shade of it.
export const COVER_CATEGORIES = [
  { slug: "start-here", name: "Start here", color: "#E8457C", icon: "sparkles" },
  { slug: "mindset", name: "Mindset", color: "#FF4A1C", icon: "flame" },
  { slug: "consistency", name: "Consistency", color: "#9B6BBE", icon: "repeat" },
  { slug: "money", name: "Money and ownership", color: "#1F9D5C", icon: "key" },
  { slug: "the-book", name: "The book", color: "#2E6BE0", icon: "book-open" },
  { slug: "music", name: "Music", color: "#E3192F", icon: "music" },
  { slug: "mental-health", name: "Mental health", color: "#17A3A0", icon: "heart" },
];

export const FALLBACK_CATEGORY = { slug: "fan-notes", name: "Fan notes", color: "#3A3A3C", icon: "quote" };

export const COVER_FORMATS = {
  wide: { width: 1200, height: 675, label: "Blog (wide)" },
  square: { width: 1080, height: 1080, label: "Square" },
  pin: { width: 1000, height: 1500, label: "Pinterest" },
};

export const ICON_NAMES = Object.keys(COVER_ICONS);

// A WordPress category slug, or a category's name, to its cover style.
export function coverCategory(slugOrName) {
  const key = String(slugOrName ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return COVER_CATEGORIES.find((c) => c.slug === key || c.slug === key.replace(/-and-ownership$/, "")) ?? FALLBACK_CATEGORY;
}

// The off shade for section images: the same hue, a step darker.
export function sectionShade(hex, amount = 0.16) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
}

// The URL of a cover image drawn by /blog/cover.
export function coverUrl({ category, icon, text, variant, format } = {}) {
  const p = new URLSearchParams();
  if (category) p.set("c", category);
  if (icon) p.set("i", icon);
  if (text) p.set("t", text);
  if (variant === "section") p.set("v", "section");
  if (format && format !== "wide") p.set("f", format);
  return `/blog/cover?${p}`;
}

// A post picks its own icon with a WordPress tag named "icon-<name>"
// (for example icon-flame); otherwise it gets its category's icon.
export function iconFromTags(tags = []) {
  for (const t of tags) {
    const name = String(t)
      .toLowerCase()
      .replace(/^icon[-:\s]+/, "");
    if (name !== String(t).toLowerCase() && COVER_ICONS[name]) return name;
  }
  return null;
}
