"use client";

import { useState } from "react";
import Link from "next/link";
import type { PortfolioItem } from "@/content/public-site";
import { CmsImage } from "@/components/cms/cms-image";
import { TemplateImage } from "@/components/public/template-image";
import { MediaPlaceholder } from "./media-placeholder";

const filters = ["All", "Photography", "Music"] as const;
const portfolioTemplateImages: Record<string, { src: string; alt: string; width: number; height: number }> = {
  "graduation-in-motion": {
    src: "/images/home-photography.png",
    alt: "Couple photographed at a coastal overlook",
    width: 1672,
    height: 941,
  },
  "quiet-confidence": {
    src: "/images/photography-portrait.png",
    alt: "Editorial portrait in a modern architectural setting",
    width: 1536,
    height: 1024,
  },
  "gathered-together": {
    src: "/images/photography-worship.png",
    alt: "Documentary photograph of a worship gathering",
    width: 1672,
    height: 941,
  },
};

export function PortfolioFilter({ items }: { items: PortfolioItem[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = filter === "All" ? items : items.filter((item) => item.category === filter);

  return (
    <>
      <div className="portfolio-filters" role="group" aria-label="Filter portfolio projects">
        {filters.map((option) => (
          <button
            key={option}
            type="button"
            className={filter === option ? "is-active" : ""}
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="portfolio-index-grid" aria-live="polite">
        {visible.map((item) => (
          <article className={`portfolio-index-item portfolio-format-${item.format}`} key={item.slug}>
            <Link href={`/portfolio/${item.slug}`} aria-label={`View ${item.title}`} data-media-container>
              {item.coverAsset
                ? <CmsImage asset={item.coverAsset} className="portfolio-index-item__image" sizes="(max-width: 760px) calc(100vw - 40px), 50vw" />
                : portfolioTemplateImages[item.slug]
                  ? <TemplateImage {...portfolioTemplateImages[item.slug]} className="portfolio-index-item__image" />
                : <MediaPlaceholder item={item} />}
              <div className="portfolio-index-item__copy">
                <div>
                  <p>{item.category} · {item.mediaType}</p>
                  <h2>{item.title}</h2>
                </div>
                <span aria-hidden="true">↗</span>
              </div>
              <p className="portfolio-index-item__description">{item.description}</p>
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
