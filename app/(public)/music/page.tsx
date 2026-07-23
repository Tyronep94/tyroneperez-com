import Link from "next/link";
import { CtaBanner } from "@/components/public/cta-banner";
import { MediaPlaceholder } from "@/components/public/media-placeholder";
import { SectionHeading } from "@/components/public/section-heading";
import { ServiceList } from "@/components/public/service-list";
import { musicContent, portfolioItems } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Music Production",
  "Recording, mixing, mastering, full-song production, and worship playback editing with Tyrone Perez.",
  "/music",
);

export default function MusicPage() {
  const musicWork = portfolioItems.filter((item) => item.category === "Music").slice(0, 3);
  return (
    <main id="main-content" className="music-page">
      <section className="discipline-hero discipline-hero--music">
        <div className="public-container discipline-hero__grid">
          <div>
            <p className="public-kicker">{musicContent.kicker}</p>
            <h1>{musicContent.heading}</h1>
          </div>
          <div className="music-hero-visual" aria-label="Abstract studio waveform placeholder" role="img">
            {Array.from({ length: 15 }, (_, index) => <i key={index} />)}
            <span>Studio media to be added</span>
          </div>
          <p className="discipline-hero__intro">{musicContent.intro}</p>
        </div>
      </section>

      <section className="discipline-bio discipline-bio--dark">
        <div className="public-container discipline-bio__grid">
          <p className="public-kicker">Behind the sound</p>
          <div>
            <h2>A production perspective, in Tyrone’s own words.</h2>
            <p>{musicContent.biography}</p>
            <p className="replacement-note replacement-note--dark">{musicContent.biographyNote}</p>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-container">
          <SectionHeading kicker="Ways to work together" title={musicContent.servicesHeading} body={musicContent.servicesIntro} />
          <ServiceList services={musicContent.services} tone="music" />
        </div>
      </section>

      <section className="music-featured public-section">
        <div className="public-container">
          <SectionHeading kicker="Portfolio" title={musicContent.featuredHeading} body={musicContent.featuredIntro} invert />
          <div className="audio-study-grid">
            {musicWork.map((item) => (
              <article key={item.slug}>
                <MediaPlaceholder item={item} />
                <div>
                  <p>{item.client}</p>
                  <h3>{item.title}</h3>
                  <button type="button" disabled aria-label={`Audio for ${item.title} will be added later`}>
                    <span aria-hidden="true">▶</span> Audio coming later
                  </button>
                  <Link href={`/portfolio/${item.slug}`} className="public-text-link public-text-link--light">Project notes</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="process-section public-section">
        <div className="public-container">
          <SectionHeading kicker="The process" title="A clear path from idea to finish." />
          <div className="process-grid">
            {musicContent.process.map((item) => (
              <article key={item.step}>
                <span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-section public-section">
        <div className="public-container faq-grid">
          <SectionHeading kicker="Good to know" title="Frequently asked questions" />
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
