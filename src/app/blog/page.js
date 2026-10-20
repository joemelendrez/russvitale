import Link from "@/components/QuietLink";
import DefaultPalette from "@/components/DefaultPalette";
import Footer from "@/components/Footer";
import NewsletterForm from "@/components/NewsletterForm";
import { formatDate, getPosts } from "@/lib/blog";
import AlbumSwatches from "@/components/AlbumSwatches";

export const revalidate = 300;

export const metadata = {
  title: "The Russ mindset blog | Unofficial fan site",
  description: "A fan's notes on Russ's beliefs about betting on yourself, owning your work, consistency and self-talk, with every quote linked to where he said it.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "The Russ mindset blog",
    description: "A fan's notes on what Russ believes about betting on yourself, ownership and consistency.",
    url: "/blog",
    type: "website",
  },
};

export default async function BlogPage() {
  const posts = await getPosts();
  const [lead, ...rest] = posts;

  return (
    <>
      <DefaultPalette />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <AlbumSwatches className="mb-6" />
        <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan blog</p>
        <h1 className="mt-4 font-display text-6xl uppercase leading-[0.9] sm:text-8xl">
          The <span className="text-era-accent">mindset</span>
        </h1>
        <p className="mt-6 max-w-xl text-era-muted">
          What Russ believes about betting on yourself, owning your work, staying consistent and talking to yourself like you mean it, written
          by a fan. Every quote links to where he said it.
        </p>

        {posts.length === 0 ? (
          <div className="mt-14 rounded-3xl border border-era-fg/10 bg-era-fg/[0.03] p-6 sm:p-10">
            <p className="font-display text-4xl uppercase leading-none sm:text-5xl">First posts are on the way</p>
            <p className="mt-4 max-w-lg text-era-muted">Get them by email the day they go up, along with tour dates and new drops.</p>
            <div className="mt-8 max-w-xl">
              <NewsletterForm id="blog-newsletter-email" />
            </div>
          </div>
        ) : (
          <>
            <Link href={`/blog/${lead.slug}`} className="group mt-14 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-10">
              <Cover post={lead} className="aspect-[16/10]" eager />
              <div>
                <Meta post={lead} />
                <h2 className="mt-3 font-display text-4xl uppercase leading-[0.95] transition-colors group-hover:text-era-accent sm:text-6xl">{lead.title}</h2>
                {lead.excerpt && <p className="mt-4 line-clamp-4 text-era-muted">{lead.excerpt}</p>}
                <span className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Read it <span aria-hidden="true">&rarr;</span>
                </span>
              </div>
            </Link>

            {rest.length > 0 && (
              <ul className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/blog/${post.slug}`} className="group block">
                      <Cover post={post} className="aspect-[16/10]" />
                      <div className="mt-5">
                        <Meta post={post} />
                        <h2 className="mt-2 font-display text-3xl uppercase leading-[0.95] transition-colors group-hover:text-era-accent">{post.title}</h2>
                        {post.excerpt && <p className="mt-3 line-clamp-3 text-sm text-era-muted">{post.excerpt}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <p className="mt-20 text-xs leading-relaxed text-era-muted">
          An unofficial fan blog, not affiliated with or endorsed by Russ, Diemon or any label. Quotes are short and link to their sources.
        </p>
      </div>
      <Footer />
    </>
  );
}

function Meta({ post }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.22em] text-era-muted">
      {[post.category?.name, formatDate(post.published), `${post.minutes} min read`].filter(Boolean).join(" · ")}
    </p>
  );
}

function Cover({ post, className, eager = false }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-era-fg/[0.06] ${className}`}>
      {post.cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- WordPress media URLs
        <img
          src={post.cover}
          alt={post.coverAlt}
          loading={eager ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-end p-5">
          <span className="font-display text-5xl uppercase leading-none text-era-fg/15">{post.title}</span>
        </div>
      )}
    </div>
  );
}
