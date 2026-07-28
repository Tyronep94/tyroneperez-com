"use client";

import { useWebsitePageDocument } from "@/components/public/page-runtime";

export const featuredSoundImageSlotId = "music.featured-sound.image";

const defaultImage = {
  src: "/images/home-hero.png",
  alt: "Music producer listening in a dark studio",
  width: 1672,
  height: 941,
};

export function FeaturedSoundImage() {
  const document = useWebsitePageDocument();
  const override = document?.slots[featuredSoundImageSlotId];
  const asset = override?.asset;
  const image = asset?.public_url
    ? {
        src: asset.public_url,
        alt: override?.alt || asset.alt_text || defaultImage.alt,
        width: asset.width ?? undefined,
        height: asset.height ?? undefined,
      }
    : defaultImage;

  return (
    <div
      className="music-project-grid__image"
      data-media-container
      data-page-media-slot={featuredSoundImageSlotId}
      data-page-media-label="Featured Sound image"
      data-page-media-type="image"
      data-page-media-managed="true"
    >
      {/* The CMS replacement and the template placeholder share the same public runtime. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
      />
    </div>
  );
}
