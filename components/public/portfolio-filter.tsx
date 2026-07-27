"use client";

import { useState } from "react";
import Link from "next/link";
import type { PortfolioItem } from "@/content/public-site";
import { CmsImage } from "@/components/cms/cms-image";
import { TemplateImage } from "@/components/public/template-image";
import { MediaPlaceholder } from "./media-placeholder";
import { PortfolioAudioPlayer } from "./portfolio-audio-player";
import { useWebsitePageDocument } from "./page-runtime";
import { websiteSlotAudioMedia } from "@/types/website-editor";

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
  const pageDocument = useWebsitePageDocument();
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
        {visible.map((item) => {
          const itemIndex = items.findIndex((candidate) => candidate.slug === item.slug);
          const mediaSlotId = `portfolio.media.${String(itemIndex + 1).padStart(2, "0")}`;
          const override = pageDocument?.slots[mediaSlotId];
          const overrideAudio = websiteSlotAudioMedia(override);
          const audioMedia = overrideAudio ?? (override?.media_type ? undefined : item.audioMedia);
          const mediaType = override?.media_type ?? audioMedia?.media_type ?? "image";
          const imageAsset = override?.media_type === "image" || (!override?.media_type && override?.asset)
            ? override.asset
            : item.coverAsset;
          const artworkAsset = overrideAudio ? override?.artwork_asset : item.audioArtworkAsset;
          const audioAsset = overrideAudio ? override?.audio_asset : item.audioAsset;
          const media = (
            <div
              className={`portfolio-index-item__media portfolio-index-item__media--${mediaType}`}
              data-media-container
              data-page-media-slot={mediaSlotId}
              data-page-media-type={mediaType}
              data-page-media-label={`${item.title} · ${mediaType === "spotify" ? "Spotify Player" : mediaType === "uploaded_audio" ? "Uploaded Audio" : "Image"}`}
            >
              {audioMedia ? <>
                {artworkAsset && <CmsImage asset={artworkAsset} className="portfolio-index-item__image portfolio-index-item__artwork" sizes="(max-width: 760px) calc(100vw - 40px), 50vw" />}
                <PortfolioAudioPlayer media={audioMedia} audioAsset={audioAsset} className="portfolio-audio-card--index" />
              </> : imageAsset
                ? <CmsImage asset={imageAsset} className="portfolio-index-item__image" sizes="(max-width: 760px) calc(100vw - 40px), 50vw" />
                : portfolioTemplateImages[item.slug]
                  ? <TemplateImage {...portfolioTemplateImages[item.slug]} className="portfolio-index-item__image" />
                  : <MediaPlaceholder item={item} />}
            </div>
          );
          return <article className={`portfolio-index-item portfolio-format-${item.format}`} key={item.slug}>
            {mediaType === "image"
              ? <Link href={`/portfolio/${item.slug}`} aria-label={`View ${item.title}`} data-page-link-target data-page-slot-id={`portfolio.card.${item.slug}.link`}>{media}</Link>
              : <>{media}<Link className="portfolio-index-item__media-destination" href={`/portfolio/${item.slug}`} data-page-link-target data-page-slot-id={`portfolio.card.${item.slug}.link`}>View project</Link></>}
              <div className="portfolio-index-item__copy">
                <div>
                  <p data-page-editor-ignore>{item.category} · {mediaType === "uploaded_audio" ? "Audio" : mediaType === "spotify" ? "Spotify" : "Image"}</p>
                  <h2 data-page-content-target>{item.title}</h2>
                </div>
                <Link
                  className="portfolio-index-item__external-link"
                  href={`/portfolio/${item.slug}`}
                  aria-label={`View ${item.title}`}
                  data-page-link-target
                  data-page-slot-id={`portfolio.card.${item.slug}.link`}
                >
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <p className="portfolio-index-item__description" data-page-content-target>{item.description}</p>
          </article>
        })}
      </div>
    </>
  );
}
