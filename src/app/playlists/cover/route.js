import { ImageResponse } from "next/og";
import { ALBUM_SWATCHES } from "@/components/AlbumSwatches";
import { COVER_ICONS } from "@/data/coverIcons";
import { inkFor } from "@/data/playlists";
import { ogFonts } from "@/lib/ogImage";

const SIZE = 1000;

// A playlist cover to upload on Spotify: one album color, a line icon and the
// mood's name. Only the site's own colors and icons, like /blog/cover.
//   /playlists/cover?c=7b1fd0&i=dumbbell&t=Gym
export async function GET(request) {
  const q = new URL(request.url).searchParams;
  const wanted = `#${(q.get("c") ?? "").toLowerCase()}`;
  const background = ALBUM_SWATCHES.find((s) => s.color.toLowerCase() === wanted)?.color ?? ALBUM_SWATCHES[0].color;
  const icon = COVER_ICONS[q.get("i")] ? q.get("i") : "list-music";
  const text = (q.get("t") ?? "").replace(/\s+/g, " ").trim().slice(0, 30);
  const ink = inkFor(background);

  const iconSize = Math.round(SIZE * (text ? 0.26 : 0.34));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${COVER_ICONS[icon]}</svg>`;
  const textSize = Math.round(SIZE * (text.length > 14 ? 0.085 : 0.11));

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
            marginTop: Math.round(SIZE * 0.06),
            maxWidth: SIZE * 0.84,
            textAlign: "center",
            color: ink,
            fontSize: textSize,
            lineHeight: 1.05,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {text}
        </div>
      )}
    </div>,
    {
      width: SIZE,
      height: SIZE,
      fonts: text ? await ogFonts() : undefined,
      // CORS so the playlist generator can draw it on a canvas and upload it.
      headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800" },
    },
  );
}
