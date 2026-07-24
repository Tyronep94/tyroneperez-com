import Link from "next/link";
import { PageRuntime } from "@/components/public/page-runtime";
import { contactContent, publicSite } from "@/content/public-site";
import { getPublishedWebsitePage } from "@/lib/database/website-pages";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Contact",
  "Contact Tyrone Perez about music production, photography, or a creative collaboration.",
  "/contact",
);

export function ContactPageView() {
  return (
    <main id="main-content">
      <section className="contact-page">
        <div className="public-container contact-page__grid">
          <div className="contact-page__intro">
            <p className="public-kicker">{contactContent.kicker}</p>
            <h1>{contactContent.heading}</h1>
            <p>{contactContent.intro}</p>
            <a className="contact-email" href={`mailto:${publicSite.email}`}>{publicSite.email}</a>
            <p className="replacement-note">{publicSite.contactNote}</p>
          </div>
          <div className="contact-routes">
            <p className="public-kicker">Choose a direction</p>
            {contactContent.routes.map((route, index) => (
              <Link href={route.href} key={route.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h2>{route.label}</h2><p>{route.body}</p></div>
                <b aria-hidden="true">↗</b>
              </Link>
            ))}
          </div>
          <div className="contact-meta">
            <div><p className="footer-label">Response</p><p>{contactContent.responseTime}</p><p className="replacement-note">{contactContent.responseNote}</p></div>
            <div><p className="footer-label">Social</p>{publicSite.socials.map((social) => <a href={social.href} key={social.label}>{social.label} <span className="placeholder-tag">Placeholder</span></a>)}</div>
            <Link href="/start" className="public-button">Start Your Project</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function ContactPage() {
  const document = await getPublishedWebsitePage("contact");
  return <PageRuntime pageKey="contact" document={document}><ContactPageView /></PageRuntime>;
}
