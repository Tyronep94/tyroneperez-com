import Image from "next/image";
import Link from "next/link";
import { homeContent } from "@/content/public-site";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata(
  "Tyrone Perez — Music Production & Photography",
  "A thoughtful creative practice for music production and photography.",
  "/",
);

export default function HomePage() {
  return (
    <main id="main-content" className="home-page">
      <div className="public-container home-page__frame">
        <section className="home-hero" aria-labelledby="home-hero-title">
          <Image
            className="home-hero__image"
            src="/images/home-hero.png"
            alt="Music producer working quietly in a dark studio"
            fill
            priority
            sizes="(max-width: 620px) calc(100vw - 30px), (max-width: 1360px) calc(100vw - 64px), 1280px"
          />
          <div className="home-hero__copy">
            <p className="public-kicker">{homeContent.heroKicker}</p>
            <h1 id="home-hero-title">
              Music. Photography.
              <br />
              Sound. Image. Story.
            </h1>
            <Link href="/portfolio" className="home-outline-link">
              Explore work <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="home-features" aria-label="Creative disciplines">
          {homeContent.paths.map((path) => {
            const isMusic = path.mood === "music";

            return (
              <Link
                href={path.href}
                className={`home-feature home-feature--${path.mood}`}
                key={path.href}
              >
                <Image
                  className="home-feature__image"
                  src={isMusic ? "/images/home-music.png" : "/images/home-photography.png"}
                  alt={
                    isMusic
                      ? "Producer seated at a music studio workstation"
                      : "Couple photographed at a coastal overlook"
                  }
                  fill
                  sizes="(max-width: 620px) calc(100vw - 30px), (max-width: 1360px) calc((100vw - 80px) / 2), 632px"
                />
                <div className="home-feature__label">
                  <h2>{path.label}</h2>
                  <span aria-hidden="true">→</span>
                  <i aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="home-about">
          <div className="home-about__copy">
            <p className="public-kicker">About</p>
            <h2>
              A blend of music and photography
              <br />
              to capture what matters.
            </h2>
            <Link href="/about" className="home-inline-link">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
          <Link href="/start" className="home-outline-link home-about__cta">
            Start a project <span aria-hidden="true">→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
