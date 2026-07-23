import type { PortfolioItem } from "@/content/public-site";

export function MediaPlaceholder({
  item,
  label = true,
}: {
  item: Pick<PortfolioItem, "title" | "mediaType" | "format" | "palette">;
  label?: boolean;
}) {
  return (
    <div
      className={`editorial-media media-${item.mediaType} format-${item.format} palette-${item.palette}`}
      role="img"
      aria-label={`${item.title} ${item.mediaType} placeholder; replace with approved project media`}
    >
      <div className="editorial-media__mark" aria-hidden="true">
        {item.mediaType === "audio" ? <><i /><i /><i /><i /><i /><i /><i /></> : <><i /><b /></>}
      </div>
      {label && <span>Project media placeholder</span>}
    </div>
  );
}
