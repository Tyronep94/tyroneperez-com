import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Tyrone Perez Creative", template: "%s | Tyrone Perez Creative" },
  description: "Music production and photography by Tyrone Perez.",
  metadataBase: new URL("https://tyroneperez.com"),
  openGraph: {
    title: "Tyrone Perez",
    description: "Music Production & Photography",
    url: "https://tyroneperez.com",
    siteName: "Tyrone Perez Creative",
    images: [{ url: "/og.png", width: 1792, height: 934, alt: "Tyrone Perez — Music Production & Photography" }],
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Tyrone Perez", description: "Music Production & Photography", images: ["/og.png"] },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f6f4ef" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
