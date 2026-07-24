"use client";

import { useState } from "react";

type IntrinsicImageProps = {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  className?: string;
  wrapperClassName?: string;
  sizes?: string;
  srcSet?: string;
  priority?: boolean;
  draggable?: boolean;
  missingLabel?: string;
};

/**
 * The single Natural-mode image primitive used by the CMS and public site.
 * Its shell and image remain in normal flow; crop geometry belongs exclusively
 * to an explicitly selected Manual Crop container.
 */
export function IntrinsicImage({
  src,
  alt,
  width,
  height,
  className,
  wrapperClassName,
  sizes,
  srcSet,
  priority = false,
  draggable = false,
  missingLabel = "Image unavailable",
}: IntrinsicImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`intrinsic-media${wrapperClassName ? ` ${wrapperClassName}` : ""}${failed ? " intrinsic-media--missing" : ""}`}
      data-media-status={failed ? "missing" : "available"}
    >
      {/* A regular intrinsic image is required so its decoded ratio drives layout. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={className}
        src={src}
        srcSet={srcSet || undefined}
        sizes={sizes}
        alt={alt}
        width={width ?? undefined}
        height={height ?? undefined}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={draggable}
        onLoad={() => setFailed(false)}
        onError={() => setFailed(true)}
      />
      {failed && <span className="intrinsic-media__fallback" role="img" aria-label={missingLabel}>{missingLabel}</span>}
    </span>
  );
}
