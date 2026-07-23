import Link from "next/link";
import type { Service } from "@/content/public-site";

export function ServiceList({ services, tone }: { services: Service[]; tone: "music" | "photo" }) {
  return (
    <div className={`service-list service-list--${tone}`}>
      {services.map((service, index) => (
        <article className="service-entry" key={service.title}>
          <p className="service-entry__number">{String(index + 1).padStart(2, "0")}</p>
          <div>
            <h3>{service.title}</h3>
            <p className="service-entry__description">{service.description}</p>
          </div>
          <div className="service-entry__details">
            <p><strong>Often a fit for</strong>{service.useCase}</p>
            <p><strong>Starting point</strong>{service.startingPoint}</p>
            <Link href={`/start?type=${tone === "music" ? "music" : "photography"}`} className="public-text-link">Discuss this service</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
