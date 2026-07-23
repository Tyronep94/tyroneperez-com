import type { Metadata } from "next";

const baseUrl = "https://tyroneperez.com";

export function publicMetadata(title: string, description: string, path: string): Metadata {
  const canonical = `${baseUrl}${path}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Tyrone Perez Creative",
      type: "website",
      images: [{ url: "/og.png", width: 1792, height: 934, alt: "Tyrone Perez — Music Production & Photography" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}
