import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import { portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return portfolioItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = portfolioItems.find((entry) => entry.slug === slug);
  if (!item) return {};
  return publicMetadata(item.title, item.description, `/portfolio/${item.slug}`);
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { slug } = await params;
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
