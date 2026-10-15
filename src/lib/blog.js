// The blog's posts are written in Handoff Hero (the "Russ Fan Archive" brand)
// and published to a WordPress subsite; the pages read the live ones from
// WPGraphQL. Until RUSS_WORDPRESS_GRAPHQL_URL points at a real subsite, or
// when WordPress can't be reached, the blog just shows that posts are on the
// way. Set it to "off" to stop reading WordPress.

import { coverUrl, iconFromTags } from "@/data/blogCovers";

const URL_SETTING = process.env.RUSS_WORDPRESS_GRAPHQL_URL || "https://cms.habitnova.com/russvitale/graphql";
export const blogConfigured = URL_SETTING !== "off";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", hellip: "…" };

// WordPress stores curly quotes and dashes as entities (&#8217;).
export function decodeEntities(text = "") {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

export const stripTags = (html = "") => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

async function query(gql, variables = {}) {
  if (!blogConfigured) return null;
  try {
    const res = await fetch(URL_SETTING, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables }),
      next: { revalidate: 300, tags: ["blog"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || "GraphQL error");
    return json.data;
  } catch (error) {
    console.error("Blog read failed:", error.message);
    return null;
  }
}

const FIELDS = `
  slug
  title
  excerpt
  dateGmt
  modifiedGmt
  categories { nodes { name slug } }
  tags { nodes { name slug } }
  featuredImage { node { sourceUrl altText } }
`;

// WPGraphQL's *Gmt dates have no zone marker.
const gmt = (d) => (d ? new Date(/Z$/.test(d) ? d : `${d}Z`).toISOString() : null);

// Handoff Hero opens a post with its meta description as an italic line;
// the excerpt field carries the same text, so the line is dropped from the body.
const dropMetaLine = (html) => html.replace(/^\s*<p>\s*<em>[\s\S]*?<\/em>\s*<\/p>/i, "");

function toPost(node, withContent = false) {
  const html = dropMetaLine(node.content || "");
  const words = stripTags(html).split(" ").filter(Boolean).length;
  const category = node.categories?.nodes?.find((c) => c.slug !== "uncategorized") ?? null;
  return {
    slug: node.slug,
    title: decodeEntities(node.title || ""),
    excerpt: stripTags(node.excerpt || ""),
    category: category ? { name: decodeEntities(category.name), slug: category.slug } : null,
    // No featured image: the category's flat-color cover (/blog/cover).
    cover: node.featuredImage?.node?.sourceUrl || coverUrl({ category: category?.slug, icon: iconFromTags(node.tags?.nodes?.map((t) => t.slug)) }),
    coverAlt: node.featuredImage?.node?.altText || "",
    published: gmt(node.dateGmt),
    updated: gmt(node.modifiedGmt),
    minutes: Math.max(1, Math.round(words / 230)),
    ...(withContent ? { html } : {}),
  };
}

// Newest published posts (WPGraphQL caps a page at 100).
export async function getPosts(first = 100) {
  const data = await query(`query Posts($first: Int) { posts(first: $first, where: { status: PUBLISH }) { nodes { content ${FIELDS} } } }`, { first });
  return (data?.posts?.nodes || []).map((n) => toPost(n));
}

export async function getPost(slug) {
  const data = await query(`query Post($slug: String!) { postBy(slug: $slug) { status content ${FIELDS} } }`, { slug });
  const node = data?.postBy;
  if (!node || node.status !== "publish") return null;
  return toPost(node, true);
}

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;
