import { ImageResponse } from "next/og";
import { COVER_FORMATS, coverCategory, sectionShade } from "@/data/blogCovers";
import { COVER_ICONS } from "@/data/coverIcons";
import { ogFonts } from "@/lib/ogImage";

// A blog cover or section image: a flat category color with one white line
// icon in the middle, and optional words under it. Built only from the
// site's own colors and icons, so it can't be made to show anything else.
//   /blog/cover?c=mindset&i=flame            the cover
//   /blog/cover?c=mindset&i=target&t=Step 1&v=section   a section image
//   &s=deep | light                          a section image's shade (default dark)
//   &f=square | pin                          other sizes (default wide)
export async function GET(request) {
  const q = new URL(request.url).searchParams;
  const category = coverCategory(q.get("c"));
  const icon = COVER_ICONS[q.get("i")] ? q.get("i") : category.icon;
  const text = (q.get("t") ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const section = q.get("v") === "section";
  const { width, height } = COVER_FORMATS[q.get("f")] ?? COVER_FORMATS.wide;
  const background = section ? sectionShade(category.color, q.get("s")) : category.color;

  const side = Math.min(width, height);
  const iconSize = Math.round(side * (text ? 0.15 : 0.17));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${COVER_ICONS[icon]}</svg>`;
  const textSize = Math.round(side * (text.length > 18 ? 0.07 : 0.09));

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background,
        fontFamily: "Anton",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} width={iconSize} height={iconSize} alt="" />
      {text && (
        <div
          style={{
            display: "flex",
            marginTop: Math.round(side * 0.05),
            maxWidth: width * 0.8,
            textAlign: "center",
            color: "#fff",
            fontSize: textSize,
            lineHeight: 1.05,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {text}
        </div>
      )}
    </div>,
    {
      width,
      height,
      fonts: text ? await ogFonts() : undefined,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800" },
    },
  );
}
