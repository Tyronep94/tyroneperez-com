import { PortfolioFilter } from "@/components/public/portfolio-filter";
import { portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Portfolio",
  "Selected music production and photography projects from Tyrone Perez Creative.",
  "/portfolio",
);

export default function PortfolioPage() {
  const items = [...portfolioItems].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <main id="main-content">
      <section className="index-hero">
        <div className="public-container index-hero__grid">
          <p className="public-kicker">Selected work</p>
          <h1>Sound and image,<br />held together.</h1>
          <p>
            A curated structure for finished projects. Every study is clearly labeled placeholder content
            and will be replaced with approved media, credits, and stories.
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
