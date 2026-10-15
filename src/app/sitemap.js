import { SITE } from "@/data/site";

export default function sitemap() {
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/music`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/newsletter`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
