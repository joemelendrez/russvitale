import { SITE } from "@/data/site";

export default function robots() {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE.url}/sitemap.xml` };
}
