import Image from "next/image";
import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { PageRuntime } from "@/components/public/page-runtime";
import { ServiceList } from "@/components/public/service-list";
import { photographyContent, portfolioItems } from "@/content/public-site";
import { getPublishedWebsitePage } from "@/lib/database/website-pages";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Photography",
  "Graduation, portrait, branding, church event, couples, and family photography by Tyrone Perez.",
  "/photography",
);

export function PhotographyPageView() {
  const photoWork = portfolioItems.filter((item) => item.category === "Photography").slice(0, 3);
  const galleryImages = [
    { src: "/images/home-photography.png", alt: "Couple photographed at a coastal overlook" },
    { src: "/images/photography-portrait.png", alt: "Editorial portrait in a modern architectural setting" },
    { src: "/images/photography-worship.png", alt: "Documentary photograph of a worship gathering" },
  ];

  return (
    <main id="main-content" className="photo-page">
      <section className="service-page-hero service-page-hero--photo">
        <div className="public-container service-page-hero__grid">
          <div className="service-page-hero__copy">
            <p className="public-kicker">{photographyContent.kicker}</p>
            <h1>Honest images. Lasting stories.</h1>
            <p>{photographyContent.intro}</p>
            <Link href="/start?type=photography" className="home-outline-link">
              Start a photo project <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="service-page-hero__media">
            <Image
              src="/images/home-photography.png"
              alt="Couple photographed at a coastal overlook"
              fill
              priority
              loading="eager"
              sizes="(max-width: 880px) calc(100vw - 64px), (max-width: 1360px) 52vw, 680px"
            />
          </div>
        </div>
      </section>

      <section className="service-introduction">
        <div className="public-container service-introduction__grid">
          <p className="public-kicker">The approach</p>
          <p>Calm direction, honest connection, and room for moments to unfold naturally.</p>
        </div>
      </section>

      <section className="service-page-section photo-services">
        <div className="public-container">
          <header className="service-section-heading">
            <p className="public-kicker">Sessions and coverage</p>
            <h2>{photographyContent.categoriesHeading}</h2>
          </header>
          <ServiceList services={photographyContent.categories} tone="photo" />
        </div>
      </section>

      <section className="service-gallery service-page-section">
        <div className="public-container">
          <header className="service-section-heading service-section-heading--split">
            <div>
              <p className="public-kicker">Selected frames</p>
              <h2>{photographyContent.portfolioHeading}</h2>
            </div>
            <Link href="/portfolio" className="service-inline-link">View portfolio <span aria-hidden="true">→</span></Link>
          </header>
          <div className="service-gallery__grid">
            {photoWork.map((item, index) => (
              <Link href={`/portfolio/${item.slug}`} key={item.slug} className="service-gallery__item">
                <div className="service-gallery__image">
                  <Image
                    src={galleryImages[index].src}
                    alt={galleryImages[index].alt}
                    fill
                    sizes="(max-width: 620px) calc(100vw - 30px), (max-width: 1360px) 32vw, 416px"
                  />
                </div>
                <div>
                  <p>{item.description}</p>
                  <h3>{item.title}</h3>
                  <span aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="service-process service-page-section">
        <div className="public-container">
          <header className="service-section-heading">
            <p className="public-kicker">The session</p>
            <h2>Prepared enough to feel easy.</h2>
          </header>
          <div className="process-grid">
            {photographyContent.process.map((item) => (
              <article key={item.step}><span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p></article>
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
            {photographyContent.faqs.map((faq) => (
              <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>
            ))}
          </div>
        </div>
      </section>
      <CtaBanner heading={photographyContent.ctaHeading} />
    </main>
  );
}

export default async function PhotographyPage() {
  const document = await getPublishedWebsitePage("photography");
  return <PageRuntime pageKey="photography" document={document}><PhotographyPageView /></PageRuntime>;
}
