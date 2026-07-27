"use client";

import { useWebsitePageDocument } from "@/components/public/page-runtime";

const portraitSlotId = "about.portrait";

export function AboutPortrait() {
  const document = useWebsitePageDocument();
  const override = document?.slots[portraitSlotId];
  const asset = override?.asset;

  return (
    <div
      className="about-portrait"
      data-page-media-slot={portraitSlotId}
      data-page-media-label="About portrait"
      data-page-media-type="image"
      data-page-media-managed="true"
      role={asset?.public_url ? undefined : "img"}
      aria-label={asset?.public_url ? undefined : "Portrait of Tyrone Perez placeholder; replace with an approved personal portrait"}
    >
      {asset?.public_url ? (
        // The CMS supplies the public URL and intrinsic dimensions for this editable slot.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="about-portrait__image"
          src={asset.public_url}
          alt={override?.alt || asset.alt_text || "Portrait of Tyrone Perez"}
          width={asset.width ?? undefined}
          height={asset.height ?? undefined}
        />
      ) : (
        <>
          <div aria-hidden="true"><i /><i /></div>
          <span>Replace with Tyrone’s portrait</span>
        </>
      )}
    </div>
  );
}
