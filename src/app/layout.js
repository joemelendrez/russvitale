import "@fontsource/anton/400.css";
import "@fontsource-variable/inter";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
import { SpotifyLinksProvider } from "@/components/SpotifyLinks";
import { PhonePlayerProvider } from "@/components/PhonePlayer";
import { SITE } from "@/data/site";

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
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Impact (Ticketmaster affiliate program) site verification. */}
        <meta name="impact-site-verification" value="0f51a803-5e30-40e5-b84e-28d74d8989f0" />
      </head>
      <body className="grain">
        <a href="#music" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black">
          Skip to the music
        </a>
        <SpotifyLinksProvider>
          <PhonePlayerProvider>
            <SmoothScroll>
              <Header />
              <main>{children}</main>
            </SmoothScroll>
          </PhonePlayerProvider>
        </SpotifyLinksProvider>
      </body>
    </html>
  );
}
