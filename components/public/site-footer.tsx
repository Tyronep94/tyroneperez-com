import Link from "next/link";
import { publicSite } from "@/content/public-site";

export function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="public-container public-footer__top">
        <div>
          <p className="public-footer__brand">{publicSite.brand}</p>
          <p>{publicSite.descriptor}</p>
        </div>
        <div className="public-footer__links">
          <div>
            <p className="footer-label">Explore</p>
            {publicSite.nav.slice(1).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </div>
          <div>
            <p className="footer-label">Connect</p>
            <a href={`mailto:${publicSite.email}`}>{publicSite.email}</a>
            {publicSite.socials.map((social) => <a key={social.label} href={social.href}>{social.label} <span className="placeholder-tag">Placeholder</span></a>)}
          </div>
        </div>
      </div>
      <div className="public-container public-footer__bottom">
        <p>© Tyrone Perez Creative</p>
        <p>Sound. Image. Story.</p>
        <Link href="/login">Admin login</Link>
      </div>
    </footer>
  );
}
