import Link from "next/link";
import type { Service } from "@/content/public-site";

export function ServiceList({ services, tone }: { services: Service[]; tone: "music" | "photo" }) {
  return (
    <div className={`service-list service-list--${tone}`}>
      {services.map((service, index) => (
        <article className="service-entry" key={service.title}>
          <p className="service-entry__number">{String(index + 1).padStart(2, "0")}</p>
          <div className="service-entry__copy">
            <h3>{service.title}</h3>
            <p className="service-entry__description">{service.description}</p>
          </div>
          <Link
            href={`/start?type=${tone === "music" ? "music" : "photography"}`}
            className="service-entry__link"
            aria-label={`Discuss ${service.title}`}
          >
            <span>Discuss</span> <b aria-hidden="true">→</b>
          </Link>
        </article>
      ))}
    </div>
  );
}
