import Playlists from "@/components/Playlists";
import Footer from "@/components/Footer";
import { savedPlaylists } from "@/lib/releasesServer";
import { spotifyCover } from "@/lib/spotifyCover";

export const metadata = {
  title: "Russ playlists for every mood | Unofficial fan site",
  description: "Fan-made Spotify playlists of Russ songs for the gym, late night drives, chill days and more.",
  alternates: { canonical: "/playlists" },
};

export const revalidate = 60;

export default async function PlaylistsPage() {
  // The lists and each cover's color come with the page (Spotify's answer is
  // cached an hour), so the card borders don't flash from a stand-in color.
  const lists = await savedPlaylists();
  const covers = Object.fromEntries(
    await Promise.all(lists.map(async (l) => [l.spotify_id, { color: (await spotifyCover(l.spotify_id)).color }]))
  );
  return (
    <>
      <Playlists initialLists={lists.length ? lists : null} initialCovers={covers} />
      <Footer />
    </>
  );
}
