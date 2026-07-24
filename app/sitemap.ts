import type { MetadataRoute } from "next";
import { portfolioItems } from "@/content/public-site";
import { getPublicCollections, getPublishedPortfolio } from "@/lib/database/cms";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://tyroneperez.com";
  const [cmsItems, collections] = await Promise.all([getPublishedPortfolio(), getPublicCollections()]);
  const cmsSlugs = new Set(cmsItems.map(item => item.slug));
  const staticRoutes = ["", "/music", "/photography", "/portfolio", "/about", "/contact", "/start"];
  return [
    ...staticRoutes.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
      priority: path === "" ? 1 : path === "/start" ? 0.9 : 0.8,
    })),
    ...cmsItems.map((item) => ({
      url: `${base}/portfolio/${item.slug}`,
      lastModified: new Date(item.updated_at),
      changeFrequency: "monthly" as const,
      priority: item.featured ? 0.8 : 0.7,
    })),
    ...collections.map((collection) => ({
      url: `${base}/portfolio/collection/${collection.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
    ...portfolioItems.filter(item => !cmsSlugs.has(item.slug)).map((item) => ({
      url: `${base}/portfolio/${item.slug}`,
      changeFrequency: "monthly" as const,
      priority: item.featured ? 0.8 : 0.7,
    })),
  ];
}
