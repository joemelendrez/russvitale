import Playlists from "@/components/Playlists";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Russ playlists for every mood | Unofficial fan site",
  description: "Fan-made Spotify playlists of Russ songs for the gym, late night drives, chill days and more.",
  alternates: { canonical: "/playlists" },
};

export default function PlaylistsPage() {
  return (
    <>
      <Playlists />
      <Footer />
    </>
  );
}
