"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  WebsitePageDocument,
  WebsitePageKey,
  WebsiteSlotOverride,
  WebsiteSlotType,
} from "@/types/website-editor";

export type DiscoveredWebsiteSlot = {
  id: string;
  type: WebsiteSlotType;
  label: string;
  text: string;
  href?: string;
  src?: string;
  alt?: string;
};

type OriginalElementState = {
  text: string;
  directText: string[];
  leaf: boolean;
  style: string | null;
  href: string | null;
  src: string | null;
  srcset: string | null;
  alt: string | null;
};

function slotType(element: HTMLElement): WebsiteSlotType {
  if (element instanceof HTMLImageElement) return "media";
  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLButtonElement) return "button";
  return "text";
}

function editableText(element: HTMLElement) {
  if (element instanceof HTMLAnchorElement || element instanceof HTMLButtonElement) {
    return [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
  }
  return element.innerText.trim();
}

function applyText(element: HTMLElement, text: string) {
  if (element.children.length === 0) {
    element.textContent = text;
    return;
  }
  const textNodes = [...element.childNodes].filter(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
  );
  if (!textNodes.length) return;
  const lines = text.split(/\r?\n/);
  textNodes.forEach((node, index) => {
    node.textContent = index === 0
      ? lines[0]
      : lines[index] ?? (index === textNodes.length - 1 ? lines.slice(index).join("\n") : "");
  });
}

function applyOverride(element: HTMLElement, override?: WebsiteSlotOverride) {
  if (!override) return;
  if (override.type === "media" && element instanceof HTMLImageElement) {
    const src = override.asset?.variants?.large?.url ?? override.asset?.public_url;
    if (src) {
      element.src = src;
      element.removeAttribute("srcset");
    }
    if (override.alt !== undefined) element.alt = override.alt;
  } else {
    if (override.text !== undefined) applyText(element, override.text);
    if (override.href !== undefined && element instanceof HTMLAnchorElement) element.href = override.href;
  }
  if (override.layout) {
    Object.assign(element.style, {
      width: override.layout.width ?? "",
      maxWidth: override.layout.maxWidth ?? "",
      marginTop: override.layout.marginTop ?? "",
      marginBottom: override.layout.marginBottom ?? "",
      padding: override.layout.padding ?? "",
      textAlign: override.layout.textAlign ?? "",
      objectFit: override.layout.objectFit ?? "",
      objectPosition: override.layout.objectPosition ?? "",
    });
  }
}

function captureOriginalState(element: HTMLElement): OriginalElementState {
  return {
    text: element.textContent ?? "",
    directText: [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? ""),
    leaf: element.children.length === 0,
    style: element.getAttribute("style"),
    href: element.getAttribute("href"),
    src: element.getAttribute("src"),
    srcset: element.getAttribute("srcset"),
    alt: element.getAttribute("alt"),
  };
}

function restoreOriginalState(element: HTMLElement, original: OriginalElementState) {
  if (original.style === null) element.removeAttribute("style");
  else element.setAttribute("style", original.style);

  if (element instanceof HTMLImageElement) {
    for (const [name, value] of [["src", original.src], ["srcset", original.srcset], ["alt", original.alt]] as const) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
    return;
  }

  if (element instanceof HTMLAnchorElement) {
    if (original.href === null) element.removeAttribute("href");
    else element.setAttribute("href", original.href);
  }

  if (original.leaf) {
    element.textContent = original.text;
    return;
  }
  const directTextNodes = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE);
  directTextNodes.forEach((node, index) => {
    node.textContent = original.directText[index] ?? "";
  });
}

export function PageRuntime({
  pageKey,
  document,
  editing = false,
  selectedId = null,
  onSelect,
  children,
}: {
  pageKey: WebsitePageKey;
  document: WebsitePageDocument;
  editing?: boolean;
  selectedId?: string | null;
  onSelect?: (slot: DiscoveredWebsiteSlot) => void;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const originalStates = useRef(new WeakMap<HTMLElement, OriginalElementState>());
  const [hovered, setHovered] = useState<{
    id: string;
    label: string;
    left: number;
    top: number;
  } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const counters: Record<WebsiteSlotType, number> = { text: 0, link: 0, button: 0, media: 0 };
    const elements = [...root.querySelectorAll<HTMLElement>("h1,h2,h3,p,a[href],button,img")];
    for (const element of elements) {
      if (element.closest("[data-page-editor-ignore]")) continue;
      const type = slotType(element);
      const index = counters[type]++;
      const id = `${pageKey}.${type}.${String(index + 1).padStart(2, "0")}`;
      element.dataset.pageSlot = id;
      element.dataset.pageSlotType = type;
      if (editing) {
        element.dataset.pageEditable = "true";
        if (!element.hasAttribute("tabindex")) element.tabIndex = 0;
      }
      let original = originalStates.current.get(element);
      if (!original) {
        original = captureOriginalState(element);
        originalStates.current.set(element, original);
      }
      restoreOriginalState(element, original);
      applyOverride(element, document.slots[id]);
      element.classList.toggle("is-page-slot-selected", selectedId === id);
    }
  }, [document, editing, pageKey, selectedId]);

  return (
    <div
      ref={rootRef}
      className={`website-page-runtime${editing ? " website-page-runtime--editing" : ""}`}
      data-page-key={pageKey}
      onPointerOver={editing ? (event) => {
        const element = (event.target as Element | null)?.closest<HTMLElement>("[data-page-slot]");
        const root = rootRef.current;
        if (!element || !root) return;
        const type = element.dataset.pageSlotType as WebsiteSlotType;
        const bounds = element.getBoundingClientRect();
        const rootBounds = root.getBoundingClientRect();
        setHovered({
          id: element.dataset.pageSlot!,
          label: type === "media" ? "Edit Photo" : type === "text" ? "Edit Text" : type === "link" ? "Edit Link" : "Edit Button",
          left: Math.max(8, bounds.left - rootBounds.left + 8),
          top: Math.max(8, bounds.top - rootBounds.top + 8),
        });
      } : undefined}
      onPointerLeave={editing ? () => setHovered(null) : undefined}
      onClickCapture={editing ? (event) => {
        const element = (event.target as Element | null)?.closest<HTMLElement>("[data-page-slot]");
        if (!element) return;
        event.preventDefault();
        event.stopPropagation();
        const type = element.dataset.pageSlotType as WebsiteSlotType;
        onSelect?.({
          id: element.dataset.pageSlot!,
          type,
          label: type === "media"
            ? (element as HTMLImageElement).alt || "Image"
            : editableText(element).slice(0, 80) || `${type} slot`,
          text: editableText(element),
          href: element instanceof HTMLAnchorElement ? element.getAttribute("href") ?? "" : undefined,
          src: element instanceof HTMLImageElement ? element.currentSrc || element.src : undefined,
          alt: element instanceof HTMLImageElement ? element.alt : undefined,
        });
      } : undefined}
      onKeyDownCapture={editing ? (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const element = (event.target as Element | null)?.closest<HTMLElement>("[data-page-slot]");
        if (!element) return;
        event.preventDefault();
        element.click();
      } : undefined}
    >
      {children}
      {editing && hovered && (
        <span
          className="website-page-slot-affordance"
          data-page-editor-ignore
          data-slot={hovered.id}
          style={{ left: hovered.left, top: hovered.top }}
        >
          {hovered.label}
        </span>
      )}
    </div>
  );
}
