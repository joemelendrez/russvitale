import { ImageResponse } from "next/og";
import { OG_COLORS as C, OG_SIZE, ogFonts } from "./ogImage";

// The site's link preview card (1200x630): a small kicker, a big Anton
// title, the line under it and the footer. `background` is an optional
// photo (a blog post's cover) drawn darkened behind the text.
export async function ogCard({ kicker, title, sub, background }) {
  const size = title.length > 60 ? 64 : title.length > 32 ? 84 : 128;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "56px 72px",
          background: C.bg,
          backgroundImage: "radial-gradient(circle at 90% 0%, rgba(255,59,48,0.32), transparent 55%)",
          fontFamily: "Anton",
          position: "relative",
        }}
      >
        {background && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover", opacity: 0.35 }} />
        )}
        <div style={{ display: "flex", fontSize: 24, color: C.accent, letterSpacing: 8, textTransform: "uppercase" }}>{kicker}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: size, color: C.fg, lineHeight: 1.02, textTransform: "uppercase", maxWidth: 1050 }}>{title}</div>
          {sub && <div style={{ display: "flex", fontSize: 30, color: C.muted, marginTop: 18, letterSpacing: 2, maxWidth: 1000 }}>{sub}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: C.muted, letterSpacing: 5, textTransform: "uppercase" }}>
          <div style={{ display: "flex" }}>russvitale.com</div>
          <div style={{ display: "flex" }}>Unofficial fan archive</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts() }
  );
}
