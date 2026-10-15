import { SITE } from "@/data/site";

export default function robots() {
  return { rules: { userAgent: "*", allow: "/", disallow: "/admin" }, sitemap: `${SITE.url}/sitemap.xml` };
}
