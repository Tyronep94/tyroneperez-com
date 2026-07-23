import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import "./public-site.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${geist.variable} public-site`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
