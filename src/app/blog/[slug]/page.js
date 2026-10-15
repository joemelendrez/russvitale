import Link from "next/link";
import { notFound } from "next/navigation";
import BlogFaq from "@/components/BlogFaq";
import BlogToc from "@/components/BlogToc";
import DefaultPalette from "@/components/DefaultPalette";
import { categoryPalette } from "@/data/blogCovers";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";
import { AMAZON_DISCLOSURE, SITE } from "@/data/site";
import { formatDate, getPost, getPosts } from "@/lib/blog";
import { bodySegments, faqSchema, withHeadings } from "@/lib/postBody";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: `${post.title} | Russ fan blog`,
    description: post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      siteName: SITE.name,
      url: `/blog/${post.slug}`,
      publishedTime: post.published || undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt || undefined },
  };
}

function JsonLd({ item }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />;
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const [post, all] = await Promise.all([getPost(slug), getPosts(12)]);
  if (!post) notFound();

  const raw = bodySegments(post.html);
  const faq = faqSchema(raw);
  const { segments, headings } = withHeadings(raw);
  const url = `${SITE.url}/blog/${post.slug}`;
  const hasAmazon = /amazon\.com|amzn\.to/i.test(post.html);
  const more = all.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <DefaultPalette palette={categoryPalette(post.category?.slug)} />
      <ReadingProgress targetId="article" />
      <JsonLd
        item={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || undefined,
          image: post.cover ? [new URL(post.cover, SITE.url).href] : undefined,
          datePublished: post.published || undefined,
          dateModified: post.updated || undefined,
          author: { "@type": "Person", name: SITE.builder.name, url: SITE.builder.url },
          publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
          mainEntityOfPage: url,
        }}
      />
      <JsonLd
        item={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        }}
      />
      {faq && <JsonLd item={faq} />}

      <article id="article">
        <header className="mx-auto max-w-4xl px-4 pt-28 text-center sm:px-6 sm:pt-36">
          <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.25em] text-era-muted">
            <Link href="/blog" className="hover:text-era-fg">
              The mindset
            </Link>
            {post.category && <span> &middot; {post.category.name}</span>}
          </nav>
          <h1 className="mt-5 font-display text-5xl uppercase leading-[0.92] sm:text-7xl">{post.title}</h1>
          {post.excerpt && <p className="mx-auto mt-6 max-w-2xl text-lg text-era-muted">{post.excerpt}</p>}
          <p className="mt-6 text-[11px] uppercase tracking-[0.22em] text-era-muted">
            By {SITE.builder.name}, a fan &middot; {[formatDate(post.published), `${post.minutes} min read`].filter(Boolean).join(" · ")}
          </p>
        </header>

        {post.cover && (
          <div className="mx-auto mt-12 max-w-5xl px-4 sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- WordPress media URLs */}
            <img src={post.cover} alt={post.coverAlt} className="aspect-[16/9] w-full rounded-3xl object-cover" />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20 lg:grid lg:max-w-6xl lg:grid-cols-[16rem_minmax(0,46rem)] lg:gap-14">
          <aside className="hidden lg:block">
            <BlogToc headings={headings} />
          </aside>
          <div>
            {hasAmazon && (
              <p className="mb-8 rounded-2xl border border-dashed border-era-fg/20 px-4 py-3 text-sm text-era-muted">{AMAZON_DISCLOSURE}</p>
            )}
            <BlogToc headings={headings} variant="mobile" />
            <div className="space-y-10">
              {segments.map((s, i) =>
                s.type === "faq" ? (
                  <BlogFaq key={i} title={s.title} items={s.items} />
                ) : (
                  <div key={i} className="post-body" dangerouslySetInnerHTML={{ __html: s.html }} />
                )
              )}
            </div>

            <aside className="mt-16 rounded-3xl border border-era-fg/10 p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.3em] text-era-muted">About this blog</p>
              <p className="mt-3 text-sm leading-relaxed text-era-muted">
                Written by {SITE.builder.name}, a Russ fan who also builds{" "}
                <a href="https://habitnova.com" target="_blank" rel="noopener" className="text-era-fg underline decoration-era-accent underline-offset-4">
                  Habit Nova
                </a>
                , a habit tracker. This is an unofficial fan site, not affiliated with or endorsed by Russ, Diemon or any label. Quotes are kept
                short and link to where he said them.
              </p>
            </aside>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6" aria-labelledby="more-posts">
          <h2 id="more-posts" className="border-b border-era-fg/10 pb-4 font-display text-4xl uppercase">
            Keep reading
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-era-muted">{formatDate(p.published)}</p>
                  <p className="mt-2 font-display text-2xl uppercase leading-[0.95] transition-colors group-hover:text-era-accent">{p.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Footer />
    </>
  );
}
