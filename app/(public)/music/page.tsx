import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { PageRuntime } from "@/components/public/page-runtime";
import { TemplateImage } from "@/components/public/template-image";
import { ServiceList } from "@/components/public/service-list";
import { musicContent, portfolioItems } from "@/content/public-site";
import { getPublishedWebsitePage } from "@/lib/database/website-pages";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Music Production",
  "Recording, mixing, mastering, full-song production, and worship playback editing with Tyrone Perez.",
  "/music",
);

export function MusicPageView() {
  const musicWork = portfolioItems.filter((item) => item.category === "Music").slice(0, 3);
  return (
    <main id="main-content" className="music-page">
      <section className="service-page-hero service-page-hero--music">
        <div className="public-container service-page-hero__grid">
          <div className="service-page-hero__copy">
            <p className="public-kicker">{musicContent.kicker}</p>
            <h1>Sound with intention.</h1>
            <p>{musicContent.intro}</p>
            <Link href="/start?type=music" className="home-outline-link">
              Start a music project <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="service-page-hero__media" data-media-container>
            <TemplateImage
              src="/images/home-music.png"
              alt="Producer seated at a music studio workstation"
              width={1672}
              height={941}
              priority
            />
          </div>
        </div>
      </section>

      <section className="service-introduction">
        <div className="public-container service-introduction__grid">
          <p className="public-kicker">The work</p>
          <p>Recording, production, and finishing shaped around the song—not a formula.</p>
        </div>
      </section>

      <section className="service-page-section">
        <div className="public-container">
          <header className="service-section-heading">
            <p className="public-kicker">Services offered</p>
            <h2>{musicContent.servicesHeading}</h2>
          </header>
          <ServiceList services={musicContent.services} tone="music" />
        </div>
      </section>

      <section className="service-showcase service-page-section">
        <div className="public-container">
          <header className="service-section-heading service-section-heading--split">
            <div>
              <p className="public-kicker">Selected sound</p>
              <h2>{musicContent.featuredHeading}</h2>
            </div>
            <Link href="/portfolio" className="service-inline-link">View portfolio <span aria-hidden="true">→</span></Link>
          </header>
          <div className="music-project-grid">
            <div className="music-project-grid__image" data-media-container>
              <TemplateImage
                src="/images/home-hero.png"
                alt="Music producer listening in a dark studio"
                width={1672}
                height={941}
              />
            </div>
            <div className="music-project-list">
            {musicWork.map((item) => (
              <article key={item.slug}>
                <span className="music-project-list__number">{String(item.sortOrder).padStart(2, "0")}</span>
                <div className="music-project-list__copy">
                  <p>{item.client}</p>
                  <h3>{item.title}</h3>
                </div>
                <button type="button" disabled aria-label={`Audio for ${item.title} will be added later`}>
                  <span aria-hidden="true">▶</span>
                </button>
                <Link href={`/portfolio/${item.slug}`} aria-label={`View project notes for ${item.title}`}>→</Link>
              </article>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="service-process service-page-section">
        <div className="public-container">
          <header className="service-section-heading">
            <p className="public-kicker">The process</p>
            <h2>From first listen to final delivery.</h2>
          </header>
          <div className="process-grid">
            {musicContent.process.map((item) => (
              <article key={item.step}>
                <span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="service-faq service-page-section">
        <div className="public-container service-faq__grid">
          <header className="service-section-heading">
            <p className="public-kicker">Good to know</p>
            <h2>Questions, answered simply.</h2>
          </header>
          <div>
            {musicContent.faqs.map((faq) => (
              <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner heading={musicContent.ctaHeading} />
    </main>
  );
}

export default async function MusicPage() {
  const document = await getPublishedWebsitePage("music");
  return <PageRuntime pageKey="music" document={document}><MusicPageView /></PageRuntime>;
}
