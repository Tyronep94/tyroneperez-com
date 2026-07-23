import Link from "next/link";
import { startContent } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Start Your Project",
  "The guided project inquiry for Tyrone Perez Creative is coming next.",
  "/start",
);

export default async function StartPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  return (
    <main id="main-content">
      <section className="start-page">
        <div className="public-container start-page__inner">
          <p className="public-kicker">{startContent.kicker}</p>
          <h1>{startContent.heading}</h1>
          <p className="start-page__body">{startContent.body}</p>
          <p>{startContent.expectation}</p>
          <div className="start-options">
            {startContent.options.map((option, index) => (
              <article className={type === option.type ? "is-selected" : ""} key={option.type}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{option.title}</h2>
                <p>{option.body}</p>
                <p className="coming-label">{type === option.type ? "Selected preview · " : ""}Guided inquiry coming in Phase 2.2</p>
              </article>
            ))}
          </div>
          <div className="public-actions">
            <Link className="public-button" href="/contact">Contact Tyrone</Link>
            <Link className="public-text-link" href="/">Return home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
