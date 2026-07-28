"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
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
  mediaType?: WebsiteSlotOverride["media_type"];
};

const WebsitePageDocumentContext = createContext<WebsitePageDocument | null>(null);
const WebsitePageEditingContext = createContext(false);

export function useWebsitePageDocument() {
  return useContext(WebsitePageDocumentContext);
}

export function useWebsitePageEditing() {
  return useContext(WebsitePageEditingContext);
}

type OriginalElementState = {
  text: string;
  directText: string[];
  leaf: boolean;
  style: string | null;
  href: string | null;
  src: string | null;
  srcset: string | null;
  alt: string | null;
  width: string | null;
  height: string | null;
};

function slotType(element: HTMLElement): WebsiteSlotType {
  if (element.dataset.pageMediaSlot) return "media";
  if (element instanceof HTMLImageElement) return "media";
  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLButtonElement) return "button";
  return "text";
}

function editableSlotElement(target: EventTarget | null) {
  const element = target as Element | null;
  return element?.closest<HTMLElement>("[data-page-media-slot]")
    ?? element?.closest<HTMLElement>("[data-page-link-target]")
    ?? element?.closest<HTMLElement>("[data-page-content-target]")
    ?? element?.closest<HTMLElement>("[data-page-slot]")
    ?? null;
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

function applyNaturalImageGeometry(
  image: HTMLImageElement,
  frame: HTMLElement,
  dimensions?: { width: number; height: number },
) {
  frame.classList.remove("page-photo-frame--manual");
  frame.classList.add("page-photo-frame--natural");
  frame.dataset.pagePhotoDisplay = "natural";
  frame.style.setProperty("height", "auto", "important");
  frame.style.setProperty("min-height", "0", "important");
  frame.style.setProperty("max-height", "none", "important");
  frame.style.setProperty("aspect-ratio", "auto", "important");
  frame.style.setProperty("overflow", "visible", "important");
  if (dimensions) {
    image.width = dimensions.width;
    image.height = dimensions.height;
  }
  const syncIntrinsicDimensions = () => {
    if (frame.dataset.pagePhotoDisplay === "natural" && image.naturalWidth && image.naturalHeight) {
      image.width = image.naturalWidth;
      image.height = image.naturalHeight;
    }
  };
  if (image.complete) syncIntrinsicDimensions();
  else image.addEventListener("load", syncIntrinsicDimensions, { once: true });
}

function applyNaturalContainer(container?: HTMLElement | null) {
  if (!container) return;
  container.classList.remove("page-media-container--manual");
  container.classList.add("page-media-container--natural");
  container.dataset.pagePhotoDisplay = "natural";
  container.style.setProperty("height", "auto", "important");
  container.style.setProperty("min-height", "0", "important");
  container.style.setProperty("max-height", "none", "important");
  container.style.setProperty("aspect-ratio", "auto", "important");
  container.style.setProperty("overflow", "visible", "important");
}

function applyOverride(element: HTMLElement, override?: WebsiteSlotOverride, mediaContainer?: HTMLElement | null) {
  if (!override) {
    if (element instanceof HTMLImageElement && element.parentElement) {
      applyNaturalImageGeometry(element, element.parentElement);
      applyNaturalContainer(mediaContainer);
    }
    return;
  }
  if (override.type === "media" && element instanceof HTMLImageElement) {
    // Use the original public object so a replacement never inherits a
    // fixed-size or cropped derivative from the template/image provider.
    const src = override.asset?.public_url;
    if (src) {
      element.src = src;
      element.removeAttribute("srcset");
    }
    if (override.asset?.width) element.width = override.asset.width;
    if (override.asset?.height) element.height = override.asset.height;
    if (override.alt !== undefined) element.alt = override.alt;
  } else {
    if (override.text !== undefined) applyText(element, override.text);
    if (override.href !== undefined && element instanceof HTMLAnchorElement) element.href = override.href;
  }
  if (override.layout || (override.type === "media" && element instanceof HTMLImageElement)) {
    const layout = override.layout ?? {};
    const displayMode = layout.objectFit === "manual" ? "manual" : "natural";
    const frame = element.parentElement;
    if (element instanceof HTMLImageElement && frame) {
      frame.classList.remove("page-photo-frame--natural", "page-photo-frame--manual");
      if (displayMode === "natural") {
        applyNaturalImageGeometry(
          element,
          frame,
          override.asset?.width && override.asset.height
            ? { width: override.asset.width, height: override.asset.height }
            : undefined,
        );
        applyNaturalContainer(mediaContainer);
      } else {
        frame.classList.add("page-photo-frame--manual");
        frame.dataset.pagePhotoDisplay = "manual";
        if (mediaContainer) {
          mediaContainer.classList.remove("page-media-container--natural");
          mediaContainer.classList.add("page-media-container--manual");
          mediaContainer.dataset.pagePhotoDisplay = "manual";
        }
      }
    }
    Object.assign(element.style, {
      width: layout.width ?? "",
      maxWidth: layout.maxWidth ?? "",
      marginTop: layout.marginTop ?? "",
      marginBottom: layout.marginBottom ?? "",
      padding: layout.padding ?? "",
      textAlign: layout.textAlign ?? "",
      objectFit: "contain",
      objectPosition: "center",
      transform: displayMode === "manual"
        ? `translate(${layout.manualX ?? 0}%, ${layout.manualY ?? 0}%) scale(${layout.manualZoom ?? 1})`
        : "",
      transformOrigin: displayMode === "manual" ? "center" : "",
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
    width: element.getAttribute("width"),
    height: element.getAttribute("height"),
  };
}

function restoreOriginalState(element: HTMLElement, original: OriginalElementState) {
  if (original.style === null) element.removeAttribute("style");
  else element.setAttribute("style", original.style);

  if (element instanceof HTMLImageElement) {
    for (const [name, value] of [["src", original.src], ["srcset", original.srcset], ["alt", original.alt], ["width", original.width], ["height", original.height]] as const) {
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
  slotNamespace,
  document,
  editing = false,
  selectedId = null,
  onSelect,
  onManualCropPosition,
  children,
}: {
  pageKey: WebsitePageKey;
  slotNamespace?: string;
  document: WebsitePageDocument;
  editing?: boolean;
  selectedId?: string | null;
  onSelect?: (slot: DiscoveredWebsiteSlot) => void;
  onManualCropPosition?: (position: { manualX: number; manualY: number }) => void;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const originalStates = useRef(new WeakMap<HTMLElement, OriginalElementState>());
  const originalFrameStyles = useRef(new WeakMap<HTMLElement, string | null>());
  const originalMediaContainerStyles = useRef(new WeakMap<HTMLElement, string | null>());
  const [hovered, setHovered] = useState<{
    id: string;
    label: string;
    left: number;
    top: number;
  } | null>(null);
  const manualDrag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    element: HTMLImageElement;
  } | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const counters: Record<WebsiteSlotType, number> = { text: 0, link: 0, button: 0, media: 0 };
    const elements = [...root.querySelectorAll<HTMLElement>("[data-page-media-slot],h1,h2,h3,p,a[href],button,img")]
      .filter((element) => {
        const mediaSlot = element.closest<HTMLElement>("[data-page-media-slot]");
        return !mediaSlot || mediaSlot === element;
      });
    for (const element of elements) {
      if (element.closest("[data-page-editor-ignore]")) continue;
      const type = slotType(element);
      const index = counters[type]++;
      const id = element.dataset.pageMediaSlot ?? element.dataset.pageSlotId ?? `${slotNamespace ?? pageKey}.${type}.${String(index + 1).padStart(2, "0")}`;
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
      if (element.dataset.pageMediaSlot) {
        const image = element.querySelector<HTMLImageElement>("img");
        const override = document.slots[id];
        const componentManagesMedia = element.dataset.pageMediaManaged === "true";
        if (!componentManagesMedia && image && override?.media_type !== "spotify" && override?.media_type !== "uploaded_audio") {
          applyOverride(image, override, element);
        }
        const layout = override?.layout;
        Object.assign(element.style, {
          width: layout?.width ?? "",
          maxWidth: layout?.maxWidth ?? "",
          marginTop: layout?.marginTop ?? "",
          marginBottom: layout?.marginBottom ?? "",
          padding: layout?.padding ?? "",
          textAlign: layout?.textAlign ?? "",
        });
      } else if (element instanceof HTMLImageElement && element.parentElement) {
        const frame = element.parentElement;
        if (!originalFrameStyles.current.has(frame)) {
          originalFrameStyles.current.set(frame, frame.getAttribute("style"));
        }
        const originalFrameStyle = originalFrameStyles.current.get(frame);
        if (originalFrameStyle === null) frame.removeAttribute("style");
        else if (originalFrameStyle !== undefined) frame.setAttribute("style", originalFrameStyle);
        frame.classList.remove("page-photo-frame--natural", "page-photo-frame--manual");
        delete frame.dataset.pagePhotoDisplay;
        const mediaContainer = element.closest<HTMLElement>("[data-media-container]");
        if (mediaContainer) {
          if (!originalMediaContainerStyles.current.has(mediaContainer)) {
            originalMediaContainerStyles.current.set(mediaContainer, mediaContainer.getAttribute("style"));
          }
          const originalContainerStyle = originalMediaContainerStyles.current.get(mediaContainer);
          if (originalContainerStyle === null) mediaContainer.removeAttribute("style");
          else if (originalContainerStyle !== undefined) mediaContainer.setAttribute("style", originalContainerStyle);
          mediaContainer.classList.remove("page-media-container--natural", "page-media-container--manual");
          delete mediaContainer.dataset.pagePhotoDisplay;
        }
        applyOverride(element, document.slots[id], mediaContainer);
      } else {
        applyOverride(element, document.slots[id]);
      }
      element.classList.toggle("is-page-slot-selected", selectedId === id);
    }
  }, [document, editing, pageKey, selectedId, slotNamespace]);

  return (
    <div
      ref={rootRef}
      className={`website-page-runtime${editing ? " website-page-runtime--editing" : ""}`}
      data-page-key={pageKey}
      onPointerOver={editing ? (event) => {
        const element = editableSlotElement(event.target);
        const root = rootRef.current;
        if (!element || !root) return;
        const type = element.dataset.pageSlotType as WebsiteSlotType;
        const bounds = element.getBoundingClientRect();
        const rootBounds = root.getBoundingClientRect();
        setHovered({
          id: element.dataset.pageSlot!,
          label: type === "media" ? "Change Media" : type === "text" ? "Edit Text" : type === "link" ? "Edit Link" : "Edit Button",
          left: Math.max(8, bounds.left - rootBounds.left + 8),
          top: Math.max(8, bounds.top - rootBounds.top + 8),
        });
      } : undefined}
      onPointerLeave={editing ? () => setHovered(null) : undefined}
      onClickCapture={editing ? (event) => {
        const element = editableSlotElement(event.target);
        if (!element) return;
        event.preventDefault();
        event.stopPropagation();
        const type = element.dataset.pageSlotType as WebsiteSlotType;
        onSelect?.({
          id: element.dataset.pageSlot!,
          type,
          label: type === "media"
            ? element.dataset.pageMediaLabel || "Portfolio media"
            : editableText(element).slice(0, 80) || `${type} slot`,
          text: editableText(element),
          href: element instanceof HTMLAnchorElement ? element.getAttribute("href") ?? "" : undefined,
          src: element instanceof HTMLImageElement ? element.currentSrc || element.src : element.querySelector<HTMLImageElement>("img")?.currentSrc,
          alt: element instanceof HTMLImageElement ? element.alt : element.querySelector<HTMLImageElement>("img")?.alt,
          mediaType: (element.dataset.pageMediaType as WebsiteSlotOverride["media_type"] | undefined) ?? (element.dataset.pageMediaSlot ? "image" : undefined),
        });
      } : undefined}
      onPointerDown={editing ? (event) => {
        const element = (event.target as Element | null)?.closest<HTMLImageElement>("img");
        const elementSlot = element?.closest<HTMLElement>("[data-page-media-slot]")?.dataset.pageMediaSlot ?? element?.dataset.pageSlot;
        if (!element || elementSlot !== selectedId || element.parentElement?.dataset.pagePhotoDisplay !== "manual") return;
        const layout = document.slots[selectedId]?.layout;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        manualDrag.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          startX: layout?.manualX ?? 0,
          startY: layout?.manualY ?? 0,
          element,
        };
      } : undefined}
      onPointerMove={editing ? (event) => {
        const drag = manualDrag.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const bounds = drag.element.parentElement?.getBoundingClientRect();
        if (!bounds) return;
        onManualCropPosition?.({
          manualX: Math.max(-100, Math.min(100, drag.startX + ((event.clientX - drag.x) / Math.max(1, bounds.width)) * 100)),
          manualY: Math.max(-100, Math.min(100, drag.startY + ((event.clientY - drag.y) / Math.max(1, bounds.height)) * 100)),
        });
      } : undefined}
      onPointerUp={editing ? (event) => {
        if (manualDrag.current?.pointerId !== event.pointerId) return;
        manualDrag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      } : undefined}
      onPointerCancel={editing ? () => { manualDrag.current = null; } : undefined}
      onKeyDownCapture={editing ? (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const element = editableSlotElement(event.target);
        if (!element) return;
        event.preventDefault();
        element.click();
      } : undefined}
    >
      <WebsitePageDocumentContext.Provider value={document}>
        <WebsitePageEditingContext.Provider value={editing}>{children}</WebsitePageEditingContext.Provider>
      </WebsitePageDocumentContext.Provider>
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
