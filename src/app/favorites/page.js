import Favorites from "@/components/Favorites";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Your Russ favorites | Unofficial fan site",
  description: "Your favorite Russ songs in the order you like, saved on your device and playable through the official players.",
  alternates: { canonical: "/favorites" },
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <>
      <Favorites />
      <Footer />
    </>
  );
}
