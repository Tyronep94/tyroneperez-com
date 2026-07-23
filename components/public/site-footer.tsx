import Link from "next/link";
import { publicSite } from "@/content/public-site";

export function SiteFooter() {
  const instagram = publicSite.socials.find((social) => social.label === "Instagram");

  return (
    <footer className="public-footer">
      <div className="public-container public-footer__compact">
        <p>© 2025 Tyrone Perez</p>
        <nav aria-label="Footer navigation">
          <Link href="/contact">Contact</Link>
          <a href={instagram?.href ?? "#instagram-placeholder"}>Instagram</a>
          <a href="#vimeo-placeholder">Vimeo</a>
        </nav>
      </div>
    </footer>
  );
}
