import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import Shows from "@/components/Shows";
import Watch from "@/components/Watch";
import About from "@/components/About";
import Footer from "@/components/Footer";
import { HERO_PALETTE } from "@/data/eras";
import { paletteCss } from "@/lib/theme";

export default function Home() {
  return (
    <>
      {/* First paint in the hero's colors for the chosen mode. */}
      <style>{paletteCss(HERO_PALETTE)}</style>
      <Hero />
      <Timeline />
      <Shows />
      <Watch />
      <About />
      <Footer />
    </>
  );
}
