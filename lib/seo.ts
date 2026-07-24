import type { Metadata } from "next";

const baseUrl = "https://tyroneperez.com";

export function publicMetadata(title: string, description: string, path: string, image?: { url: string; width?: number | null; height?: number | null; alt?: string | null }): Metadata {
  const canonical = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const socialImage = image ? { url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt ?? title } : { url: "/og.png", width: 1792, height: 934, alt: "Tyrone Perez — Music Production & Photography" };
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
      images: [socialImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage.url] },
  };
}
