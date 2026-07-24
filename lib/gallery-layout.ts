import type { GalleryLayout, GalleryPhoto, GalleryPhotoSize, GallerySlotDimensions } from "@/types/cms";

export function galleryPhotoOrientation(photo: Pick<GalleryPhoto, "asset" | "emphasis">) {
  const { width, height } = photo.asset;
  if (width && height) return height > width ? "portrait" : "landscape";
  return photo.emphasis === "portrait" ? "portrait" : "landscape";
}

export function defaultGalleryPhotoSize(photo: Pick<GalleryPhoto, "asset" | "emphasis">): GalleryPhotoSize {
  return galleryPhotoOrientation(photo) === "portrait" ? "medium" : "large";
}

function defaultSlotDimensions(photo: GalleryPhoto, size: GalleryPhotoSize): GallerySlotDimensions {
  const source = photo.referenceAsset ?? photo.asset;
  const orientation = source.width && source.height
    ? source.height > source.width ? "portrait" : "landscape"
    : galleryPhotoOrientation(photo);
  const desktop = orientation === "portrait"
    ? { small: "320px", medium: "460px", large: "620px", full: "100%" }
    : { small: "460px", medium: "620px", large: "780px", full: "100%" };
  const tablet = { small: "42cqw", medium: "60cqw", large: "78cqw", full: "100%" };
  const mobile = { small: "58%", medium: "76%", large: "92%", full: "100%" };
  const aspectRatio = source.width && source.height
    ? source.width / source.height
    : orientation === "portrait" ? 2 / 3 : 3 / 2;
  return {
    desktopWidth: desktop[size],
    tabletWidth: tablet[size],
    mobileWidth: mobile[size],
    aspectRatio,
  };
}

export function normalizeGalleryPhoto(
  photo: GalleryPhoto,
  options: { slotNumber?: number; templateMode?: boolean } = {},
): GalleryPhoto & { size: GalleryPhotoSize } {
  const legacySize: GalleryPhotoSize | undefined = photo.width === "full"
    ? "full"
    : photo.width === "third"
      ? "small"
      : photo.width === "half"
        ? defaultGalleryPhotoSize(photo)
        : undefined;
  const cropIsExplicit = photo.crop === "cover" && photo.cropIntent === "explicit";
  const size = photo.size ?? legacySize ?? defaultGalleryPhotoSize(photo);
  const templateLocked = photo.templateLocked ?? options.templateMode ?? true;
  const referenceAsset = photo.referenceAsset ?? photo.asset;
  const referenceAssetId = photo.referenceAssetId ?? referenceAsset.id;
  const replacementAsset = photo.replacementAssetId
    ? photo.replacementAsset ?? (photo.assetId === photo.replacementAssetId ? photo.asset : null)
    : null;
  const activeAsset = replacementAsset ?? referenceAsset;
  return {
    ...photo,
    assetId: activeAsset.id,
    asset: activeAsset,
    size,
    crop: cropIsExplicit ? "cover" : "natural",
    cropIntent: cropIsExplicit ? "explicit" : undefined,
    alignment: photo.alignment ?? "center",
    focalPoint: photo.focalPoint ?? { x: 50, y: 50 },
    slotId: photo.slotId ?? `gallery-${photo.id}`,
    slotLabel: photo.slotLabel ?? `Gallery ${String(options.slotNumber ?? 1).padStart(2, "0")}`,
    templateLocked,
    referenceAssetId,
    referenceAsset,
    replacementAssetId: photo.replacementAssetId ?? null,
    replacementAsset,
    fitMode: photo.fitMode ?? "contain",
    slotDimensions: photo.slotDimensions ?? defaultSlotDimensions({ ...photo, referenceAsset }, size),
  };
}

export function normalizeGalleryLayout(layout: GalleryLayout): GalleryLayout {
  let slotNumber = 0;
  const templateMode = layout.mode !== "freeform";
  return {
    ...layout,
    mode: layout.mode ?? "template",
    sections: layout.sections.map((section) => section.type === "images"
      ? { ...section, items: section.items.map((photo) => {
        slotNumber += 1;
        return normalizeGalleryPhoto(photo, { slotNumber, templateMode });
      }) }
      : section),
  };
}
