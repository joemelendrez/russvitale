// A post's FAQ as tap-to-open questions. Plain <details>, so it works
// without JavaScript and every answer is in the page for Google.
export default function BlogFaq({ title, items }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 rounded-3xl border border-era-fg/10 bg-era-fg/[0.03] p-5 sm:p-8">
      <p className="text-[11px] uppercase tracking-[0.3em] text-era-muted">{title || "Frequently asked questions"}</p>
      <h2 id="faq-title" className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">
        Questions fans ask
      </h2>
      <div className="mt-6 divide-y divide-era-fg/10 border-y border-era-fg/10">
        {items.map((item, i) => (
          <details key={i} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 text-left font-semibold leading-snug sm:text-lg [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-era-fg/20 text-xl leading-none transition-all group-open:rotate-45 group-open:border-era-accent group-open:bg-era-accent group-open:text-era-bg"
              >
                +
              </span>
            </summary>
            <div className="post-body pb-5 pr-10 text-base" dangerouslySetInnerHTML={{ __html: item.answer }} />
          </details>
        ))}
      </div>
    </section>
  );
}
