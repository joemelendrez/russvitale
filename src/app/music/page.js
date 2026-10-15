import Discography from "@/components/Discography";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Every Russ album, EP and single | Unofficial fan site",
  description: "Every Russ album, EP, single and new drop in one searchable list, playable through the official Spotify, YouTube Music and SoundCloud players.",
  alternates: { canonical: "/music" },
  openGraph: {
    title: "Every Russ release",
    description: "Every album, EP, single and new drop in one searchable list.",
    url: "/music",
    type: "website",
  },
};

export default function MusicPage() {
  return (
    <>
      <Discography />
      <Footer />
    </>
  );
}
