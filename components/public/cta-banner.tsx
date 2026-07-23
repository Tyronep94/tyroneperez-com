import Link from "next/link";

export function CtaBanner({ heading, body }: { heading: string; body?: string }) {
  return (
    <section className="public-cta">
      <div className="public-container public-cta__inner">
        <p className="public-kicker">Start Your Project</p>
        <h2>{heading}</h2>
        {body && <p>{body}</p>}
        <div className="public-actions">
          <Link href="/start" className="public-button public-button--light">Begin here <span aria-hidden="true">↗</span></Link>
          <Link href="/contact" className="public-text-link public-text-link--light">Contact Tyrone</Link>
        </div>
      </div>
    </section>
  );
}
