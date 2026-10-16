import Footer from "@/components/Footer";
import AlbumSwatches from "@/components/AlbumSwatches";

const CONTACT_EMAIL = "russvitalearchive@gmail.com";

export const metadata = {
  title: "Contact | Unofficial fan site",
  description: "Get in touch about the unofficial Russ fan archive: domain questions, credit or takedown requests, corrections or anything else.",
  alternates: { canonical: "/contact" },
};

const REASONS = [
  { title: "The domain", text: "Questions about russvitale.com, including from Russ or his team. We'll answer quickly and work it out." },
  { title: "Credit or takedown", text: "If you own a photo, video or anything else shown here and want it credited differently or removed, tell us and it's done the same day." },
  { title: "Corrections", text: "A wrong date, a missing song or a broken player. Fans catch things we miss." },
  { title: "Anything else", text: "Ideas for the site, a favorite deep cut we should feature, or just to say hi." },
];

export default function ContactPage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
        <AlbumSwatches className="mb-6" />
        <p className="text-xs uppercase tracking-[0.35em] text-era-muted">Unofficial fan archive</p>
        <h1 className="mt-4 font-display text-5xl uppercase leading-[0.95] sm:text-7xl">Contact</h1>
        <p className="mt-6 max-w-xl text-era-muted">
          This is a fan site. It isn't connected to Russ, Diemon or any label, and it doesn't sell anything. Write in about any of the
          below and a real person will reply.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-10 inline-flex max-w-full items-center rounded-full bg-era-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-era-bg transition-opacity hover:opacity-90"
        >
          Email us
        </a>
        <p className="mt-4 text-sm text-era-muted [overflow-wrap:anywhere]">
          Or copy the address: <span className="select-all text-era-fg">{CONTACT_EMAIL}</span>
        </p>
        <ul className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {REASONS.map((r) => (
            <li key={r.title} className="rounded-2xl border border-era-fg/15 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em]">{r.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-era-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </>
  );
}
