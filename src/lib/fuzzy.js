// Loose text matching for song titles and lyric searches. Everything is
// turned into the way it's sung: lowercase, no punctuation or apostrophes,
// "-ing" as "-in", and common spoken spellings ("going to" → "gonna",
// "because" → "cause"), so either spelling finds the other.

// Phrases first (longest first), then single words.
const PHRASES = [
  ["i am going to", "imma"],
  ["im going to", "imma"],
  ["im gonna", "imma"],
  ["going to", "gonna"],
  ["want to", "wanna"],
  ["got to", "gotta"],
  ["have to", "hafta"],
  ["trying to", "tryna"],
  ["kind of", "kinda"],
  ["sort of", "sorta"],
  ["out of", "outta"],
  ["let me", "lemme"],
  ["give me", "gimme"],
  ["do not know", "dunno"],
  ["dont know", "dunno"],
  ["what are you", "whatcha"],
  ["got you", "gotcha"],
  ["you all", "yall"],
  ["a lot", "alot"],
];

const WORDS = {
  because: "cause",
  cuz: "cause",
  coz: "cause",
  cos: "cause",
  bc: "cause",
  until: "til",
  till: "til",
  them: "em",
  about: "bout",
  though: "tho",
  through: "thru",
  okay: "ok",
  yea: "yeah",
  yeh: "yeah",
  yah: "yeah",
  ima: "imma",
  wit: "with",
  ya: "you",
  u: "you",
  ur: "your",
  dat: "that",
  da: "the",
  tha: "the",
  gon: "gonna",
  finna: "gonna",
  lil: "little",
  ol: "old",
  n: "and",
};

export function fuzzy(text) {
  let s = ` ${String(text)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;
  for (const [from, to] of PHRASES) s = s.split(` ${from} `).join(` ${to} `);
  return s
    .replace(/(\w)ing\b/g, "$1in")
    .trim()
    .split(" ")
    .map((w) => WORDS[w] ?? w)
    .join(" ");
}

// One letter off (a swap, a missing or an extra letter).
function nearly(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

// Does the search (already run through fuzzy) match this text? The whole
// search as a run of words, or else every word somewhere in it, allowing one
// typo in words of five letters or more and a half-typed last word.
export function fuzzyMatch(text, q) {
  if (!q) return true;
  const t = fuzzy(text);
  if (t.includes(q) || t.replace(/ /g, "").includes(q.replace(/ /g, ""))) return true;
  const words = t.split(" ");
  const want = q.split(" ");
  return want.every((w, i) =>
    words.some((x) => x === w || (w.length >= 5 && nearly(x, w)) || (i === want.length - 1 && w.length >= 3 && x.startsWith(w)))
  );
}

// The search as it's likely written on Genius, or null when that's no different.
export function sungSpelling(q) {
  const sung = fuzzy(q);
  return sung === q.toLowerCase().replace(/[^a-z0-9 ]+/g, "").trim() ? null : sung;
}
