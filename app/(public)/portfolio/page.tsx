import { PortfolioFilter } from "@/components/public/portfolio-filter";
import { portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";
import { getPublicCollections, getPublishedPortfolio } from "@/lib/database/cms";
import type { PortfolioItem } from "@/content/public-site";

export const metadata = publicMetadata(
  "Portfolio",
  "Selected music production and photography projects from Tyrone Perez Creative.",
  "/portfolio",
);

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [cms, collections] = await Promise.all([getPublishedPortfolio(), getPublicCollections()]);
  const cmsItems: PortfolioItem[] = cms.map((item, index) => ({
    slug: item.slug,
    title: item.title,
    category: item.category?.toLowerCase() === "music" ? "Music" : "Photography",
    description: item.excerpt ?? "",
    longDescription: item.excerpt ?? "",
    mediaType: item.kind === "song" || item.kind === "album" ? "audio" : "image",
    client: "",
    featured: item.featured,
    sortOrder: item.pinned ? -100 + index : index,
    format: "landscape",
    palette: "noir",
  }));
  const cmsSlugs = new Set(cmsItems.map(item => item.slug));
  const items = [...cmsItems, ...portfolioItems.filter(item => !cmsSlugs.has(item.slug))].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <main id="main-content">
      <section className="index-hero">
        <div className="public-container index-hero__grid">
          <p className="public-kicker">Selected work</p>
          <h1>Sound and image,<br />held together.</h1>
          <p>
            A curated collection of music production and photography—finished work, quiet details, and
            the stories held between them.
          </p>
        </div>
      </section>
      <section className="portfolio-index public-section">
        <div className="public-container">
          {collections.length > 0 && <nav className="portfolio-collections" aria-label="Portfolio collections">{collections.map(collection=><a href={`/portfolio/collection/${collection.slug}`} key={collection.id}>{collection.name}</a>)}</nav>}
          <PortfolioFilter items={items} />
        </div>
      </section>
    </main>
  );
}
