import "@fontsource/anton/400.css";
import "@fontsource-variable/inter";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Header from "@/components/Header";
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
      <body className="grain">
        <a href="#music" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black">
          Skip to the music
        </a>
        <SmoothScroll>
          <Header />
          <main>{children}</main>
        </SmoothScroll>
      </body>
    </html>
  );
}
