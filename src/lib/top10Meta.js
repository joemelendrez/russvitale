import { releasesForKeys } from "./releasesServer";

const BASE = {
  title: "Make your Russ top 10 | Unofficial fan site",
  description: "Pick your 10 favorite Russ songs, put them in order and share the picture or a link. Free, no sign-up needed.",
};

// A shared list gets its own preview: the picture of that list, and its
// first songs in the description. `url` is the link that was shared
// (/t/<code>, or the older /top10?l=...).
export async function sharedListMetadata(keys, url) {
  if (!keys.length) {
    return {
      ...BASE,
      alternates: { canonical: "/top10" },
      openGraph: {
        ...BASE,
        title: "Make your Russ top 10",
        url: "/top10",
        type: "website",
        images: [{ url: "/top10/image", width: 1200, height: 630, alt: "My Russ top 10" }],
      },
      twitter: { card: "summary_large_image", title: "Make your Russ top 10", description: BASE.description, images: ["/top10/image"] },
    };
  }
  const releases = await releasesForKeys(keys);
  const names = releases
    .slice(0, 3)
    .map((r) => r.title)
    .join(", ");
  const title = "A fan's Russ top 10";
  const description = releases.length ? `${names}${releases.length > 3 ? " and more" : ""}. See the whole list and make your own.` : BASE.description;
  const image = `/top10/image?l=${keys.join(",")}`;
  return {
    title: `${title} | Unofficial fan site`,
    description,
    // Shared lists are endless variations of one page.
    alternates: { canonical: "/top10" },
    robots: { index: false, follow: true },
    openGraph: { title, description, url, type: "website", images: [{ url: image, width: 1200, height: 630, alt: `${title}: ${names}` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
