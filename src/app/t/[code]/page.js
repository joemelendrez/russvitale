import Footer from "@/components/Footer";
import TopTen from "@/components/TopTen";
import { keysForCode } from "@/lib/releasesServer";
import { sharedListMetadata } from "@/lib/top10Meta";

// A short share link for a fan's top 10: russvitale.com/t/<code>.
export async function generateMetadata({ params }) {
  const { code } = await params;
  return sharedListMetadata(await keysForCode(code), `/t/${code}`);
}

export default async function ShortTop10Page({ params }) {
  const { code } = await params;
  const keys = await keysForCode(code);
  return (
    <>
      <TopTen shared={keys.length ? keys : null} />
      <Footer />
    </>
  );
}
