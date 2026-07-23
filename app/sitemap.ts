import type { MetadataRoute } from "next";
import { portfolioItems } from "@/content/public-site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tyroneperez.com";
  const staticRoutes = ["", "/music", "/photography", "/portfolio", "/about", "/contact", "/start"];
  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/start" ? 0.9 : 0.8,
    })),
    ...portfolioItems.map((item) => ({
      url: `${base}/portfolio/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: item.featured ? 0.8 : 0.7,
    })),
  ];
}
