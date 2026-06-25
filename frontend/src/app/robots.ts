import type { MetadataRoute } from "next";

const BASE = "https://smartagri.cloudcoesis.com";

/**
 * Generates /robots.txt. Allows crawling the public landing page but
 * blocks private/authenticated areas and API routes from indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/admin",
        "/settings",
        "/analytics",
        "/sensor_Live",
        "/ai_advisor",
        "/weather",
        "/history",
        "/onboarding",
        "/jwtSetup",
        "/login",
        "/verify-email",
        "/api/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
