import { IntrinsicImage } from "@/components/media/intrinsic-image";
import type { MediaAsset } from "@/types/cms";

export function CmsImage({ asset, className, sizes = "100vw", priority = false }: { asset: MediaAsset; className?: string; sizes?: string; priority?: boolean }) {
  const candidates = ["thumbnail", "medium", "large"] as const;
  const srcSet = candidates.map(key => {
    const variant = asset.variants?.[key];
    if (!variant?.url || !variant.width) return null;
    return `${variant.url} ${variant.width}w`;
  }).filter(Boolean).join(", ");
  return <IntrinsicImage className={className} src={asset.public_url} srcSet={srcSet} sizes={sizes} width={asset.width} height={asset.height} alt={asset.alt_text ?? asset.filename} priority={priority} missingLabel={`${asset.filename} is unavailable`} />;
}
