"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { publicSite } from "@/content/public-site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link href="/" className="wordmark" aria-label="Tyrone Perez Creative, home">
          <span>Tyrone Perez</span>
          <small>Music · Photography</small>
        </Link>
        <nav className="desktop-public-nav" aria-label="Primary navigation">
          {publicSite.nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={active(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <Link href="/start" className="public-nav-cta">Start Your Project</Link>
        </nav>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-public-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden="true">{open ? "Close" : "Menu"}</span>
        </button>
      </div>
      <nav
        id="mobile-public-nav"
        className={`mobile-public-nav${open ? " is-open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        {publicSite.nav.map((item, index) => (
          <Link key={item.href} href={item.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
          </Link>
        ))}
        <Link href="/start" className="public-nav-cta" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>Start Your Project</Link>
      </nav>
    </header>
  );
}
