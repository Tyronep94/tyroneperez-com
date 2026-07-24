import type { ReactNode } from "react";
import type { RichTextNode } from "@/types/cms";

const safeHref = (value: unknown) => {
  if (typeof value !== "string") return "#";
  return /^(https?:|mailto:|tel:|\/|#)/i.test(value) ? value : "#";
};

function renderNode(node: RichTextNode, key: string): ReactNode {
  if (node.type === "text") {
    let value: ReactNode = node.text ?? "";
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === "bold") value = <strong key={`${key}-b-${index}`}>{value}</strong>;
      if (mark.type === "italic") value = <em key={`${key}-i-${index}`}>{value}</em>;
      if (mark.type === "code") value = <code key={`${key}-c-${index}`}>{value}</code>;
      if (mark.type === "link") value = <a key={`${key}-a-${index}`} href={safeHref(mark.attrs?.href)} rel="noreferrer">{value}</a>;
    }
    return value;
  }

  const children = (node.content ?? []).map((child, index) => renderNode(child, `${key}-${index}`));
  switch (node.type) {
    case "doc": return <>{children}</>;
    case "paragraph": return <p>{children}</p>;
    case "heading": {
      const level = Math.min(3, Math.max(2, Number(node.attrs?.level ?? 2)));
      return level === 3 ? <h3>{children}</h3> : <h2>{children}</h2>;
    }
    case "bulletList": return <ul>{children}</ul>;
    case "orderedList": return <ol>{children}</ol>;
    case "listItem": return <li>{children}</li>;
    case "blockquote": return <blockquote>{children}</blockquote>;
    case "horizontalRule": return <hr />;
    case "codeBlock": return <pre><code>{children}</code></pre>;
    case "hardBreak": return <br />;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      if (!src) return null;
      // Rich editor images can be external or Supabase-hosted, so a native image is intentional.
      // eslint-disable-next-line @next/next/no-img-element
      return <figure><img src={src} alt={typeof node.attrs?.alt === "string" ? node.attrs.alt : ""} loading="lazy" /></figure>;
    }
    case "youtube": {
      const src = safeHref(node.attrs?.src);
      if (src === "#") return null;
      return <div className="rich-embed"><iframe src={src} title="Embedded YouTube video" loading="lazy" allowFullScreen /></div>;
    }
    default: return <>{children}</>;
  }
}

export function RichContent({ document }: { document: RichTextNode }) {
  return <div className="rich-content">{renderNode(document, "root")}</div>;
}
