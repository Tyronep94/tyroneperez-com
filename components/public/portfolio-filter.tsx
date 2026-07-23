"use client";

import { useState } from "react";
import Link from "next/link";
import type { PortfolioItem } from "@/content/public-site";
import { MediaPlaceholder } from "./media-placeholder";

const filters = ["All", "Photography", "Music"] as const;

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
            <Link href={`/portfolio/${item.slug}`} aria-label={`View ${item.title}`}>
              <MediaPlaceholder item={item} />
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
