import { stripTags } from "./blog";

const FAQ_HEADING = /^(frequently asked questions|faqs?|common questions)\b/i;

// Splits a post's HTML into text chunks and its FAQ, so the FAQ shows as
// the tap-to-open card. Handoff Hero writes the FAQ as an h2 ("Frequently
// Asked Questions") followed by an h3 per question with the answer under it;
// the section ends at the next h2. A section it can't read cleanly (no
// questions, or block-editor wrappers inside) stays ordinary text.
export function bodySegments(html = "") {
  const heading = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].find((m) => FAQ_HEADING.test(stripTags(m[1])));
  if (!heading) return [{ type: "html", html }];
  const start = heading.index + heading[0].length;
  const next = html.slice(start).search(/<h2\b/i);
  const end = next === -1 ? html.length : start + next;
  const items = /<\/?div\b/i.test(html.slice(start, end)) ? null : faqItems(html.slice(start, end));
  if (!items) return [{ type: "html", html }];
  return [
    { type: "html", html: html.slice(0, heading.index) },
    { type: "faq", title: stripTags(heading[1]), items },
    ...bodySegments(html.slice(end)),
  ].filter((s) => s.type !== "html" || stripTags(s.html) || /<img\b/i.test(s.html));
}

const BLOCKS = /<(h3|p|ul|ol|blockquote|figure)\b[^>]*>[\s\S]*?<\/\1>/gi;

function faqItems(section) {
  if (stripTags(section.replace(BLOCKS, ""))) return null;
  const items = [];
  for (const [block] of section.matchAll(BLOCKS)) {
    const h3 = block.match(/^<h3\b[^>]*>([\s\S]*?)<\/h3>$/i);
    if (h3) items.push({ question: stripTags(h3[1]), answer: [] });
    else if (items.length) items.at(-1).answer.push(block);
  }
  const done = items.map((i) => ({ question: i.question, answer: i.answer.join("\n") })).filter((i) => i.question && stripTags(i.answer));
  return done.length ? done : null;
}

// Gives each h2/h3 an id from its text and lists them for the table of
// contents, with the FAQ as its own entry where it sits. Main sections get
// a running number.
export function withHeadings(segments) {
  const used = new Set(["faq"]);
  const headings = [];
  const idFor = (text) => {
    const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "section";
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  const out = segments.map((s) => {
    if (s.type === "faq") {
      headings.push({ id: "faq", text: "FAQ", level: 2, kind: "faq" });
      return s;
    }
    const html = s.html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
      const text = stripTags(inner);
      if (!text) return match;
      const existing = attrs.match(/\bid="([^"]+)"/i)?.[1];
      const id = existing || idFor(text);
      if (existing) used.add(existing);
      headings.push({ id, text, level: Number(tag[1]) });
      return existing ? match : `<${tag} id="${id}"${attrs}>${inner}</${tag}>`;
    });
    return { ...s, html };
  });
  let number = 0;
  let section = null;
  for (const h of headings) {
    if (h.level === 2) {
      section = h.id;
      if (!h.kind) number += 1;
    }
    Object.assign(h, { number, section });
  }
  return { segments: out, headings };
}

// FAQPage structured data for Google.
export function faqSchema(segments) {
  const items = segments.filter((s) => s.type === "faq").flatMap((s) => s.items);
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: stripTags(item.answer) },
    })),
  };
}
