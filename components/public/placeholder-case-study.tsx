import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import type { PortfolioItem } from "@/content/public-site";
import {
  photographyCaseStudyMediaSlotId,
  type PhotographyCaseStudyMediaPosition,
  type PhotographyCaseStudySlug,
} from "@/lib/photography-case-studies";

export function PlaceholderCaseStudy({
  item,
  editableProjectMedia = false,
}: {
  item: PortfolioItem;
  editableProjectMedia?: boolean;
}) {
  const slug = item.slug as PhotographyCaseStudySlug;
  const mediaSlot = (position: PhotographyCaseStudyMediaPosition) =>
    editableProjectMedia ? photographyCaseStudyMediaSlotId(slug, position) : undefined;

  return (
    <main id="main-content" className={`project-page project-page--${item.mediaType}`}>
      <section className="project-hero">
        <div className="public-container">
          <Link href="/portfolio" className="public-text-link project-back">Back to portfolio</Link>
          <div className="project-hero__copy">
            <p className="public-kicker">{item.category} · Placeholder case study</p>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
          </div>
          <MediaPlaceholder
            item={item}
            slotId={mediaSlot("project-media")}
            slotLabel={`${item.title} project image`}
          />
        </div>
      </section>
      <section className="project-story public-section">
        <div className="public-container project-story__grid">
          <div>
            <p className="public-kicker">Project story</p>
            <h2>A place for the work behind the work.</h2>
          </div>
          <div>
            <p>{item.longDescription}</p>
            <dl>
              <div><dt>Discipline</dt><dd>{item.category}</dd></div>
              <div><dt>Media</dt><dd>{item.mediaType === "audio" ? "Audio project" : "Image gallery"}</dd></div>
              <div><dt>Client / Artist</dt><dd>{item.client}</dd></div>
              <div><dt>Status</dt><dd>Replace before launch</dd></div>
            </dl>
          </div>
        </div>
      </section>
      <section className="project-support public-section">
        <div className="public-container">
          <p className="public-kicker">Supporting media</p>
          <div className="project-support__grid">
            <MediaPlaceholder
              item={{ ...item, format: "square" }}
              slotId={mediaSlot("supporting-media-1")}
              slotLabel={`${item.title} supporting media 1`}
            />
            <MediaPlaceholder
              item={{ ...item, format: "landscape" }}
              slotId={mediaSlot("supporting-media-2")}
              slotLabel={`${item.title} supporting media 2`}
            />
          </div>
          <p className="replacement-note">Replace these blocks with approved supporting media and descriptive alt text.</p>
        </div>
      </section>
      <CtaBanner heading={`Have a ${item.category.toLowerCase()} project in mind?`} />
    </main>
  );
}
