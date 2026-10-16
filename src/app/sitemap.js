import { SITE } from "@/data/site";
import { getPosts } from "@/lib/blog";
import { ALBUMS, albumHref, playlistHref } from "@/data/albums";
import { savedPlaylists } from "@/lib/releasesServer";

export default async function sitemap() {
  const [posts, playlists] = await Promise.all([getPosts(), savedPlaylists()]);
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/music`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE.url}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/top10`, changeFrequency: "monthly", priority: 0.6 },
    ...ALBUMS.map((a) => ({ url: `${SITE.url}${albumHref(a)}`, changeFrequency: "monthly", priority: 0.7 })),
    { url: `${SITE.url}/playlists`, changeFrequency: "weekly", priority: 0.7 },
    ...playlists.map((p) => ({ url: `${SITE.url}${playlistHref(p.title)}`, changeFrequency: "weekly", priority: 0.6 })),
    ...posts.map((p) => ({ url: `${SITE.url}/blog/${p.slug}`, lastModified: p.updated || p.published || undefined, changeFrequency: "monthly", priority: 0.6 })),
    { url: `${SITE.url}/newsletter`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
