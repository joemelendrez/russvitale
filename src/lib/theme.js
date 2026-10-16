// Light and dark mode from the site's own era colors. Every era palette
// ({ bg, fg, muted, accent }) is either dark or light already; its twin for
// the other mode swaps background and text and moves the accent until it
// reads on the new background. Pure, so pages can render it on the server.

export const THEME_KEY = "russ-theme"; // "light" | "dark"; missing = follow the phone

const hex = (h) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
};
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

// `t` of the way from a to b.
export function mix(a, b, t) {
  const [x, y] = [hex(a), hex(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

function luminance(h) {
  const [r, g, b] = hex(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export const isLight = (palette) => luminance(palette.bg) > 0.4;

// Moves `color` toward `toward` in small steps until it reaches `ratio`
// against `bg` (or gets there).
function until(color, toward, bg, ratio) {
  let c = color;
  for (let t = 0; t <= 1 && contrast(c, bg) < ratio; t += 0.05) c = mix(color, toward, t);
  return c;
}

function twin(p) {
  if (isLight(p)) {
    // Light era into dark: its ink becomes the page, its paper the text.
    const bg = mix(p.fg, "#000000", 0.25);
    const fg = p.bg;
    return { bg, fg, muted: until(mix(fg, bg, 0.45), fg, bg, 4.6), accent: p.accent === p.fg ? fg : until(p.accent, "#ffffff", bg, 4.5) };
  }
  // Dark era into light: a soft paper tinted with its accent, its dark
  // background as the text.
  return readable({ bg: mix(p.accent, PAPER, 0.86), fg: p.bg, accent: p.accent });
}

// Light mode's page tone: a warm grey paper rather than white, so it's easy
// on the eyes.
const PAPER = "#dcd8d0";

function readable({ bg, fg: ink, accent: tint }) {
  const fg = until(ink, "#000000", bg, 11);
  // Secondary text stays dark enough to read easily on the paper.
  return { bg, fg, muted: until(mix(fg, bg, 0.3), fg, bg, 7), accent: until(tint, fg, bg, 4.8) };
}

// A palette that's already light (the Wolf and W!LD eras), toned down to
// the same paper.
function soften(p) {
  return readable({ bg: mix(p.bg, PAPER, 0.85), fg: p.fg, accent: p.accent });
}

const cache = new Map();

// The palette to show in `mode` ("light" | "dark").
export function themedPalette(palette, mode) {
  if (!palette || (mode === "dark" && !isLight(palette))) return palette;
  // A palette can name its own light-mode colors.
  if (mode === "light" && palette.light) return palette.light;
  const key = `${mode}${palette.bg}${palette.fg}${palette.muted}${palette.accent}`;
  if (!cache.has(key)) cache.set(key, mode === "light" && isLight(palette) ? soften(palette) : twin(palette));
  return cache.get(key);
}

const vars = (p) => `--bg:${p.bg};--fg:${p.fg};--muted:${p.muted};--accent:${p.accent}`;

// CSS for a page's first paint: the palette for each mode, picked by the
// data-theme the head script sets before anything shows.
export function paletteCss(palette) {
  return `:root,:root[data-theme="dark"]{${vars(themedPalette(palette, "dark"))}}:root[data-theme="light"]{${vars(themedPalette(palette, "light"))}}`;
}

// Runs in <head> before paint: the saved choice, else the phone's setting.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}`;
