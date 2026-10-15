import Footer from "@/components/Footer";
import TopTen from "@/components/TopTen";
import { parseKeys } from "@/lib/releasesServer";
import { sharedListMetadata } from "@/lib/top10Meta";

export async function generateMetadata({ searchParams }) {
  const keys = parseKeys((await searchParams)?.l);
  return sharedListMetadata(keys, `/top10?l=${keys.join(",")}`);
}

export default async function Top10Page({ searchParams }) {
  const keys = parseKeys((await searchParams)?.l);
  return (
    <>
      <TopTen shared={keys.length ? keys : null} />
      <Footer />
    </>
  );
}
