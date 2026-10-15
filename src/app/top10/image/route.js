import { ImageResponse } from "next/og";
import { featureCredit } from "@/data/features";
import { OG_COLORS as C, ogFonts } from "@/lib/ogImage";
import { parseKeys, releasesForKeys } from "@/lib/releasesServer";

const FORMATS = {
  og: { width: 1200, height: 630 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

const TYPE = { album: "Album", ep: "EP", single: "Single", version: "Version", feature: "Feature" };

function meta(r) {
  return r.type === "feature" ? `${featureCredit(r)} · ${r.year}` : `${TYPE[r.type] ?? "Song"} · ${r.year}`;
}

// A fan's top 10 as a picture: the link preview (og) and the image fans
// share or save (square, story). Built from release keys only, so the
// picture can only ever show real Russ releases from this site's list.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const format = FORMATS[params.get("format")] ? params.get("format") : "og";
  const { width, height } = FORMATS[format];
  const releases = await releasesForKeys(parseKeys(params.get("l")));
  const wide = format === "og";
  const story = format === "story";

  const rowSize = wide ? 30 : story ? 54 : 44;
  const rows = releases.length ? releases : [{ title: "Pick your 10", type: "single", year: "", empty: true }];
  const columns = wide ? [rows.slice(0, 5), rows.slice(5, 10)] : [rows];

  const row = (r, i) => (
    <div key={i} style={{ display: "flex", alignItems: "center", gap: wide ? 18 : 28, width: "100%" }}>
      <div style={{ display: "flex", width: rowSize * 1.5, justifyContent: "flex-end", color: C.accent, fontSize: rowSize * 1.1 }}>
        {String(i + 1).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", fontSize: rowSize, color: C.fg, textTransform: "uppercase", lineHeight: 1.05 }}>
          {r.title.length > 34 ? `${r.title.slice(0, 32)}...` : r.title}
        </div>
        {!r.empty && (
          <div style={{ display: "flex", fontSize: rowSize * 0.5, color: C.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>{meta(r)}</div>
        )}
      </div>
    </div>
  );

  const image = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: C.bg,
        backgroundImage: `radial-gradient(circle at 85% 0%, rgba(255,59,48,0.28), transparent 55%)`,
        padding: wide ? "48px 64px" : story ? "140px 90px" : "80px 84px",
        fontFamily: "Anton",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: wide ? 20 : 28, color: C.muted, letterSpacing: 8, textTransform: "uppercase" }}>
          A fan&apos;s picks
        </div>
        <div style={{ display: "flex", fontSize: wide ? 72 : story ? 150 : 112, color: C.fg, lineHeight: 1, marginTop: 8 }}>
          MY RUSS <span style={{ color: C.accent, marginLeft: 24 }}>TOP 10</span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, gap: 40, marginTop: wide ? 30 : story ? 90 : 50 }}>
        {columns.map((list, c) => (
          <div key={c} style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: story ? "space-between" : "flex-start", gap: wide ? 14 : 22 }}>
            {list.map((r, i) => row(r, i + c * 5))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: wide ? 18 : 26, color: C.muted, letterSpacing: 4, textTransform: "uppercase", marginTop: 24 }}>
        <div style={{ display: "flex" }}>russvitale.com/top10</div>
        <div style={{ display: "flex" }}>Unofficial fan archive</div>
      </div>
    </div>
  );

  return new ImageResponse(image, {
    width,
    height,
    fonts: await ogFonts(),
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" },
  });
}
