import type { MetadataRoute } from "next";

const BASE = "https://smartagri.cloudcoesis.com";

/**
 * Generates /sitemap.xml. Only public, crawlable pages are listed —
 * authenticated dashboard routes are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["", "/features", "/how-it-works", "/about", "/supervisors"];

  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
