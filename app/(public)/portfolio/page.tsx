import { PortfolioFilter } from "@/components/public/portfolio-filter";
import { portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";
import { getPublishedPortfolio } from "@/lib/database/cms";
import { getPublishedWebsitePage } from "@/lib/database/website-pages";
import { PageRuntime } from "@/components/public/page-runtime";
import type { PortfolioItem } from "@/content/public-site";
import { portfolioAudioMedia } from "@/types/cms";

export const metadata = publicMetadata(
  "Portfolio",
  "Selected music production and photography projects from Tyrone Perez Creative.",
  "/portfolio",
);

export const dynamic = "force-dynamic";

export async function PortfolioPageView() {
  const cms = await getPublishedPortfolio();
  const cmsItems: PortfolioItem[] = cms.map((item, index) => ({
    slug: item.slug,
    title: item.title,
    category: item.category?.toLowerCase() === "music" ? "Music" : "Photography",
    description: item.excerpt ?? "",
    longDescription: item.excerpt ?? "",
    mediaType: Boolean(item.media_type) || item.kind === "song" || item.kind === "album" ? "audio" : "image",
    client: "",
    featured: item.featured,
    sortOrder: item.pinned ? -100 + index : index,
    format: "landscape",
    palette: "noir",
    coverAsset: item.cover_asset ?? undefined,
    audioArtworkAsset: item.audio_artwork_asset ?? undefined,
    audioAsset: item.audio_asset ?? undefined,
    audioMedia: portfolioAudioMedia(item) ?? undefined,
  }));
  const cmsSlugs = new Set(cmsItems.map(item => item.slug));
  const items = [...cmsItems, ...portfolioItems.filter(item => !cmsSlugs.has(item.slug))].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <main id="main-content">
      <section className="index-hero portfolio-index-hero">
        <div className="public-container index-hero__grid">
          <p className="public-kicker">Selected work</p>
          <h1>Sound and image, held together.</h1>
          <p>
            A curated collection of music production and photography—finished work, quiet details, and
            the stories held between them.
          </p>
        </div>
      </section>
      <section className="portfolio-index public-section">
        <div className="public-container">
          <PortfolioFilter items={items} />
        </div>
      </section>
    </main>
  );
}

export default async function PortfolioPage() {
  const document = await getPublishedWebsitePage("portfolio");
  return <PageRuntime pageKey="portfolio" document={document}><PortfolioPageView /></PageRuntime>;
}
