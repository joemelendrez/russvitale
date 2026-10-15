import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Anton for every shared image (next/og reads woff, not woff2). The files
// sit in src/assets and are traced into the server functions by
// outputFileTracingIncludes in next.config.mjs.
let fonts = null;
export async function ogFonts() {
  if (!fonts) {
    const [latin, ext] = await Promise.all([
      readFile(join(process.cwd(), "src/assets/anton-latin.woff")),
      readFile(join(process.cwd(), "src/assets/anton-latin-ext.woff")),
    ]);
    fonts = [
      { name: "Anton", data: latin, weight: 400, style: "normal" },
      { name: "Anton", data: ext, weight: 400, style: "normal" },
    ];
  }
  return fonts;
}

export const OG_COLORS = { bg: "#08070c", fg: "#f5f5f4", muted: "#a1a1aa", accent: "#ff3b30" };
export const OG_SIZE = { width: 1200, height: 630 };
