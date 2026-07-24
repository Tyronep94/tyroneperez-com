import { CtaBanner } from "@/components/public/cta-banner";
import { PageRuntime } from "@/components/public/page-runtime";
import { aboutContent } from "@/content/public-site";
import { getPublishedWebsitePage } from "@/lib/database/website-pages";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "About",
  "Meet Tyrone Perez and learn about the approach behind his music production and photography practice.",
  "/about",
);

export function AboutPageView() {
  return (
    <main id="main-content">
      <section className="about-hero">
        <div className="public-container about-hero__grid">
          <div>
            <p className="public-kicker">{aboutContent.kicker}</p>
            <h1>{aboutContent.heading}</h1>
          </div>
          <div className="about-portrait" role="img" aria-label="Portrait of Tyrone Perez placeholder; replace with an approved personal portrait">
            <div aria-hidden="true"><i /><i /></div>
            <span>Replace with Tyrone’s portrait</span>
          </div>
          <div className="about-hero__intro">
            <p>{aboutContent.introduction}</p>
            <p className="replacement-note">{aboutContent.introductionNote}</p>
          </div>
        </div>
      </section>

      <section className="about-background public-section">
        <div className="public-container public-introduction__grid">
          <div><p className="public-kicker">The path here</p><h2>{aboutContent.backgroundHeading}</h2></div>
          <div>
            <p>{aboutContent.background}</p>
            <p className="replacement-note">{aboutContent.backgroundNote}</p>
          </div>
        </div>
      </section>

      <section className="about-disciplines">
        <div className="about-discipline about-discipline--music">
          <p className="public-kicker">01 / Sound</p>
          <h2>{aboutContent.disciplines[0].title}</h2>
          <p>{aboutContent.disciplines[0].body}</p>
        </div>
        <div className="about-discipline about-discipline--photo">
          <p className="public-kicker">02 / Image</p>
          <h2>{aboutContent.disciplines[1].title}</h2>
          <p>{aboutContent.disciplines[1].body}</p>
        </div>
      </section>

      <section className="about-values public-section">
        <div className="public-container">
          <div className="public-introduction__grid">
            <div><p className="public-kicker">Approach and values</p><h2>How the work gets made.</h2></div>
            <div className="values-grid">
              {aboutContent.values.map((value, index) => (
                <article key={value.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{value.title}</h3><p>{value.body}</p></article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <CtaBanner heading={aboutContent.ctaHeading} />
    </main>
  );
}

export default async function AboutPage() {
  const document = await getPublishedWebsitePage("about");
  return <PageRuntime pageKey="about" document={document}><AboutPageView /></PageRuntime>;
}
