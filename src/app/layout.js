import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import MotionProvider from "@/components/MotionProvider";
import PageTransition from "@/components/PageTransition";
import Header from "@/components/Header";
import FavoritesSync from "@/components/FavoritesSync";
import { SpotifyLinksProvider } from "@/components/SpotifyLinks";
import { PhonePlayerProvider } from "@/components/PhonePlayer";
import { SITE } from "@/data/site";
import { DEFAULT_PALETTE } from "@/data/eras";
import { THEME_SCRIPT, paletteCss } from "@/lib/theme";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: "Russ: the music, era by era | Unofficial fan site",
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Russ: the music, era by era",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Russ: the music, era by era", description: SITE.description },
  keywords: ["Russ", "Russ rapper", "Russ discography", "Russ albums", "Russ songs", "Russ features", "Russ fan site"],
  formatDetection: { telephone: false },
};

// Who the site is (an unofficial fan site) and who it's about, for search.
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: "Russ fan archive (unofficial)",
  url: SITE.url,
  description: SITE.description,
  inLanguage: "en",
  about: { "@type": "Person", name: "Russ", alternateName: "Russell Vitale", sameAs: [SITE.officialSite, SITE.spotifyArtist] },
  publisher: { "@type": "Person", name: SITE.builder.name, url: SITE.builder.url },
};

// Both fonts are served with the page and preloaded, so text doesn't show in
// a stand-in font first and then jump. The big Anton headings wait for theirs
// (block); body text shows at once in a fallback sized to match Inter.
const anton = localFont({ src: "./fonts/anton-latin-400.woff2", weight: "400", display: "block", variable: "--font-anton", fallback: ["Impact", "sans-serif"] });
const inter = localFont({ src: "./fonts/inter-latin-wght.woff2", weight: "100 900", display: "swap", variable: "--font-inter", adjustFontFallback: "Arial" });

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Light or dark before the first paint: the saved choice, else the phone's setting. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <style>{paletteCss(DEFAULT_PALETTE)}</style>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, "\\u003c") }} />
      </head>
      <body className="grain">
        <a href="#music" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black">
          Skip to the music
        </a>
        <FavoritesSync />
        <MotionProvider>
          <SpotifyLinksProvider>
            <PhonePlayerProvider>
              <SmoothScroll>
                <Header />
                <main>{children}</main>
                <PageTransition />
              </SmoothScroll>
            </PhonePlayerProvider>
          </SpotifyLinksProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
