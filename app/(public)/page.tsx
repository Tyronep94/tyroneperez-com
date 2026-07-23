import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import { SectionHeading } from "@/components/public/section-heading";
import { homeContent, musicContent, photographyContent, portfolioItems, publicSite } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Tyrone Perez — Music Production & Photography",
  "A thoughtful creative practice for music production and photography.",
  "/",
);

export default function HomePage() {
  const selected = portfolioItems.filter((item) => item.featured).slice(0, 3);
  const featuredServices = [...musicContent.services.slice(0, 2), ...photographyContent.categories.slice(0, 2)];

  return (
    <main id="main-content">
      <section className="home-hero">
        <div className="public-container home-hero__inner">
          <p className="public-kicker home-hero__kicker">{homeContent.heroKicker}</p>
          <h1>{publicSite.brand}</h1>
          <div className="home-hero__footer">
            <p>{publicSite.descriptor}</p>
            <p className="home-hero__line">{publicSite.line}</p>
            <p>{homeContent.heroSupport}</p>
          </div>
        </div>
        <div className="home-hero__rule" aria-hidden="true"><i /><span>TP / 01</span></div>
      </section>

      <section className="pathway-section">
        <div className="public-container">
          <SectionHeading kicker="Choose a direction" title={homeContent.selectorHeading} />
          <div className="pathway-grid">
            {homeContent.paths.map((path, index) => (
              <Link href={path.href} className={`pathway pathway--${path.mood}`} key={path.href}>
                <span className="pathway__number">{String(index + 1).padStart(2, "0")}</span>
                <div className="pathway__visual" aria-hidden="true">
                  <i /><i /><i /><i /><i />
                </div>
                <div className="pathway__copy">
                  <p>{path.line}</p>
                  <h2>{path.label}</h2>
                  <span>{path.detail}</span>
                </div>
                <b aria-hidden="true">Explore ↗</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="selected-work public-section">
        <div className="public-container">
          <SectionHeading kicker="Portfolio preview" title={homeContent.selectedHeading} body={homeContent.selectedIntro} />
          <div className="selected-work__grid">
            {selected.map((item) => (
              <article key={item.slug}>
                <Link href={`/portfolio/${item.slug}`}>
                  <MediaPlaceholder item={item} />
                  <div className="work-caption">
                    <p>{item.category}</p>
                    <h3>{item.title}</h3>
                    <span aria-hidden="true">View project ↗</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          <Link href="/portfolio" className="public-text-link selected-work__all">View the full portfolio</Link>
        </div>
      </section>

      <section className="public-introduction public-section">
        <div className="public-container public-introduction__grid">
          <div>
            <p className="public-kicker">{homeContent.introKicker}</p>
            <h2>{homeContent.introHeading}</h2>
          </div>
          <div>
            <p>{homeContent.introBody}</p>
            <p className="replacement-note">{homeContent.introNote}</p>
            <Link href="/about" className="public-text-link">More about the approach</Link>
          </div>
        </div>
      </section>

      <section className="featured-services public-section">
        <div className="public-container">
          <SectionHeading kicker="Services" title={homeContent.servicesHeading} />
          <div className="featured-services__list">
            {featuredServices.map((service, index) => (
              <article key={service.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
          <div className="public-actions">
            <Link className="public-button" href="/music">Explore music</Link>
            <Link className="public-button public-button--outline" href="/photography">Explore photography</Link>
          </div>
        </div>
      </section>

      <CtaBanner heading={homeContent.ctaHeading} body={homeContent.ctaBody} />
    </main>
  );
}
