"use client";

import type { PortfolioItem } from "@/content/public-site";
import { useWebsitePageDocument } from "@/components/public/page-runtime";

export function MediaPlaceholder({
  item,
  label = true,
  slotId,
  slotLabel,
}: {
  item: Pick<PortfolioItem, "title" | "mediaType" | "format" | "palette">;
  label?: boolean;
  slotId?: string;
  slotLabel?: string;
}) {
  const document = useWebsitePageDocument();
  const override = slotId ? document?.slots[slotId] : undefined;
  const asset = override?.asset;
  const placeholderLabel = `${item.title} ${item.mediaType} placeholder; replace with approved project media`;

  return (
    <div
      className={`editorial-media media-${item.mediaType} format-${item.format} palette-${item.palette}`}
      data-page-media-slot={slotId}
      data-page-media-label={slotId ? slotLabel || `${item.title} project image` : undefined}
      data-page-media-type={slotId ? "image" : undefined}
      data-page-media-managed={slotId ? "true" : undefined}
      role={asset?.public_url ? undefined : "img"}
      aria-label={asset?.public_url ? undefined : placeholderLabel}
    >
      {asset?.public_url ? (
        // The managed slot renders the original object without cropping.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="editorial-media__image"
          src={asset.public_url}
          alt={override?.alt || asset.alt_text || `${item.title} project image`}
          width={asset.width ?? undefined}
          height={asset.height ?? undefined}
        />
      ) : (
        <>
          <div className="editorial-media__mark" aria-hidden="true">
            {item.mediaType === "audio" ? <><i /><i /><i /><i /><i /><i /><i /></> : <><i /><b /></>}
          </div>
          {label && <span>Project media placeholder</span>}
        </>
      )}
    </div>
  );
}
