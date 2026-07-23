export function SectionHeading({
  kicker,
  title,
  body,
  invert = false,
}: {
  kicker?: string;
  title: string;
  body?: string;
  invert?: boolean;
}) {
  return (
    <header className={`public-section-heading${invert ? " is-inverted" : ""}`}>
      {kicker && <p className="public-kicker">{kicker}</p>}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </header>
  );
}
