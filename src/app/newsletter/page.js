import Footer from "@/components/Footer";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata = {
  title: "Russ fan newsletter | Unofficial fan site",
  description: "Tour dates, new drops and updates to the unofficial Russ fan archive, by email.",
  alternates: { canonical: "/newsletter" },
};

const STATUS = {
  confirmed: { title: "You're in", text: "You'll get tour dates, new drops and site updates by email." },
  unsubscribed: { title: "You're off the list", text: "No more emails. You can sign up again any time below." },
  invalid: { title: "That link didn't work", text: "It may be old or already used. Sign up again below to get a fresh one." },
};

export default async function NewsletterPage({ searchParams }) {
  const { status } = await searchParams;
  const shown = STATUS[status];
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan archive</p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">{shown?.title ?? "The newsletter"}</h1>
        <p className="mt-6 max-w-xl text-era-muted">
          {shown?.text ?? "Tour dates when they're announced, new songs when they drop, and what's new on the site. No spam, and nothing for sale."}
        </p>
        <div className="mt-10">
          <NewsletterForm id="newsletter-page-email" />
        </div>
      </div>
      <Footer newsletter={false} />
    </>
  );
}
