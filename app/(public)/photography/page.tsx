import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import { SectionHeading } from "@/components/public/section-heading";
import { ServiceList } from "@/components/public/service-list";
import { photographyContent, portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Photography",
  "Graduation, portrait, branding, church event, couples, and family photography by Tyrone Perez.",
  "/photography",
);

export default function PhotographyPage() {
  const photoWork = portfolioItems.filter((item) => item.category === "Photography");
  return (
    <main id="main-content" className="photo-page">
      <section className="discipline-hero discipline-hero--photo">
        <div className="public-container photo-hero__grid">
          <div className="photo-hero__copy">
            <p className="public-kicker">{photographyContent.kicker}</p>
            <h1>{photographyContent.heading}</h1>
            <p>{photographyContent.intro}</p>
          </div>
          <div className="photo-hero__media">
            <MediaPlaceholder item={{ title: "Photography hero", mediaType: "image", format: "portrait", palette: "clay" }} />
            <p>Replace with a signature portrait</p>
          </div>
        </div>
      </section>

      <section className="discipline-bio">
        <div className="public-container discipline-bio__grid">
          <p className="public-kicker">Behind the camera</p>
          <div>
            <h2>Photographs begin with how a moment feels.</h2>
            <p>{photographyContent.biography}</p>
            <p className="replacement-note">{photographyContent.biographyNote}</p>
          </div>
        </div>
      </section>

      <section className="public-section photo-services">
        <div className="public-container">
          <SectionHeading kicker="Sessions and coverage" title={photographyContent.categoriesHeading} />
          <ServiceList services={photographyContent.categories} tone="photo" />
        </div>
      </section>

      <section className="photo-gallery public-section">
        <div className="public-container">
          <SectionHeading kicker="Portfolio" title={photographyContent.portfolioHeading} body={photographyContent.portfolioIntro} />
          <div className="photo-gallery__grid">
            {photoWork.map((item) => (
              <Link href={`/portfolio/${item.slug}`} key={item.slug} className={`photo-gallery__item photo-gallery__item--${item.format}`}>
                <MediaPlaceholder item={item} />
                <div><p>{item.description}</p><h3>{item.title}</h3><span>View story ↗</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="process-section public-section">
        <div className="public-container">
          <SectionHeading kicker="The session" title="Prepared enough to feel easy." />
          <div className="process-grid">
            {photographyContent.process.map((item) => (
              <article key={item.step}><span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-section public-section">
        <div className="public-container faq-grid">
          <SectionHeading kicker="Good to know" title="Frequently asked questions" />
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
