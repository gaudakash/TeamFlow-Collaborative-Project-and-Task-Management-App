import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // We intentionally do NOT block /app here. A page blocked by robots.txt can't be crawled,
    // so search engines would never see its "noindex" tag. /app is kept out of search results
    // by the noindex meta tag (and logged-out crawlers are redirected to /login anyway).
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
