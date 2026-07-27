import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import { portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";
import { getPublishedGallery, getPublishedPortfolioEntry } from "@/lib/database/cms";
import { RichContent } from "@/components/cms/rich-content";
import { CmsImage } from "@/components/cms/cms-image";
import { GalleryPage } from "@/components/public/gallery-page";
import { PortfolioAudioPlayer } from "@/components/public/portfolio-audio-player";
import { portfolioAudioMedia } from "@/types/cms";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export function generateStaticParams() {
  return portfolioItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cmsItem = await getPublishedPortfolioEntry(slug);
  if (cmsItem) return publicMetadata(cmsItem.seo_title || cmsItem.title, cmsItem.seo_description || cmsItem.excerpt || "", cmsItem.canonical_url || `/portfolio/${cmsItem.slug}`, cmsItem.og_asset ? { url: cmsItem.og_asset.public_url, width: cmsItem.og_asset.width, height: cmsItem.og_asset.height, alt: cmsItem.og_asset.alt_text } : undefined);
  const item = portfolioItems.find((entry) => entry.slug === slug);
  if (!item) return {};
  return publicMetadata(item.title, item.description, `/portfolio/${item.slug}`);
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const cmsItem = await getPublishedPortfolioEntry(slug);
  if (cmsItem) {
    const gallery = await getPublishedGallery(cmsItem.id);
    if (gallery) return <GalleryPage entry={cmsItem} layout={gallery.layout} settings={gallery.settings} />;
    const audio = portfolioAudioMedia(cmsItem);
    const mediaType = audio || cmsItem.kind === "album" || cmsItem.kind === "song" ? "audio" : "image";
    return <main id="main-content" className={`project-page project-page--${mediaType}`}>
      <section className="project-hero"><div className="public-container"><Link href="/portfolio" className="public-text-link project-back">Back to portfolio</Link><div className="project-hero__copy"><p className="public-kicker">{cmsItem.category || "Selected work"}</p><h1>{cmsItem.title}</h1>{cmsItem.excerpt && <p>{cmsItem.excerpt}</p>}</div>{cmsItem.audio_artwork_asset || cmsItem.cover_asset ? <CmsImage asset={(cmsItem.audio_artwork_asset || cmsItem.cover_asset)!} className="cms-project-cover" sizes="(max-width: 1320px) calc(100vw - 40px), 1280px" priority /> : !audio && <MediaPlaceholder item={{title:cmsItem.title,mediaType,format:"wide",palette:"noir"}} />}{audio && <PortfolioAudioPlayer media={audio} audioAsset={cmsItem.audio_asset} className="portfolio-audio-card--detail" />}</div></section>
      <section className="project-story public-section"><div className="public-container project-story__grid"><div><p className="public-kicker">Project story</p><h2>The work behind the work.</h2></div><RichContent document={cmsItem.content} /></div></section>
      <CtaBanner heading={`Have a ${(cmsItem.category || "creative").toLowerCase()} project in mind?`} />
    </main>;
  }
  const item = portfolioItems.find((entry) => entry.slug === slug);
  if (!item) notFound();

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
          <MediaPlaceholder item={item} />
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
            <MediaPlaceholder item={{ ...item, format: "square" }} />
            <MediaPlaceholder item={{ ...item, format: "landscape" }} />
          </div>
          <p className="replacement-note">Replace these blocks with approved supporting media and descriptive alt text.</p>
        </div>
      </section>
      <CtaBanner heading={`Have a ${item.category.toLowerCase()} project in mind?`} />
    </main>
  );
}
