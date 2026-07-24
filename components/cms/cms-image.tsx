import type { MediaAsset } from "@/types/cms";

export function CmsImage({ asset, className, sizes = "100vw", priority = false }: { asset: MediaAsset; className?: string; sizes?: string; priority?: boolean }) {
  const candidates = ["thumbnail", "medium", "large"] as const;
  const srcSet = candidates.map(key => {
    const variant = asset.variants?.[key];
    return variant?.url ? `${variant.url} ${variant.width}w` : null;
  }).filter(Boolean).join(", ");
  // Supabase render URLs provide the generated variants; srcSet lets the browser choose responsively.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={asset.public_url} srcSet={srcSet || undefined} sizes={sizes} width={asset.width ?? undefined} height={asset.height ?? undefined} alt={asset.alt_text ?? ""} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} draggable={false} />;
}
