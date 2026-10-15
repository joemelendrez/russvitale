import { getPost } from "@/lib/blog";
import { ogCard } from "@/lib/ogCard";

export const alt = "A post on the Russ mindset blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

// The post's title over its cover photo, when it has one.
export default async function Image({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  const cover = post?.cover && /^https:\/\//.test(post.cover) ? post.cover : null;
  const card = { kicker: "The Russ mindset blog", title: post?.title ?? "The Russ mindset blog" };
  if (!cover) return ogCard(card);
  // A cover that can't be fetched shouldn't cost the post its preview.
  try {
    const res = await ogCard({ ...card, background: cover });
    await res.clone().arrayBuffer();
    return res;
  } catch {
    return ogCard(card);
  }
}
