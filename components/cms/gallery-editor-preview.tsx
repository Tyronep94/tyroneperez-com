"use client";

import { useEffect, useRef, type DragEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { GalleryPage } from "@/components/public/gallery-page";
import type { ContentEntry, GalleryLayout, GallerySettings } from "@/types/cms";

type Props = {
  entry: ContentEntry;
  layout: GalleryLayout;
  settings: GallerySettings;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropPhoto: (sectionId: string, beforeId?: string) => void;
  onDragPhoto: (id: string) => void;
  onDragSection: (id: string) => void;
  onPhotoMetrics?: (metrics: {
    width: number;
    height: number;
    clipped: boolean;
    anchorLeft: number;
    anchorTop: number;
  } | null) => void;
  repositioningId?: string | null;
  onManualReposition?: (id: string, manualCrop: { zoom: number; x: number; y: number }) => void;
};

function elementTarget(target: EventTarget | null) {
  return target instanceof Element ? target : null;
}

export function GalleryEditorPreview({
  entry,
  layout,
  settings,
  selectedId,
  onSelect,
  onDropPhoto,
  onDragPhoto,
  onDragSection,
  onPhotoMetrics,
  repositioningId = null,
  onManualReposition,
}: Props) {
  const interactionRoot = useRef<HTMLDivElement>(null);
  const repositionSession = useRef<{
    id: string;
    x: number;
    y: number;
    zoom: number;
    photo: HTMLElement;
  } | null>(null);

  useEffect(() => {
    const images = interactionRoot.current?.querySelectorAll<HTMLImageElement>(".gallery-photo img");
    images?.forEach((image) => {
      image.draggable = true;
    });
  }, [layout]);

  useEffect(() => {
    if (!selectedId || !onPhotoMetrics) {
      onPhotoMetrics?.(null);
      return;
    }
    const update = () => {
      const photo = [...document.querySelectorAll<HTMLElement>("[data-gallery-photo-id]")]
        .find((element) => element.dataset.galleryPhotoId === selectedId);
      const image = photo?.querySelector("img");
      const frame = photo?.querySelector<HTMLElement>(".gallery-photo__frame");
      if (!image || !frame) return onPhotoMetrics(null);
      const imageRect = image.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const canvasRect = interactionRoot.current?.closest<HTMLElement>(".visual-editor__canvas")?.getBoundingClientRect();
      const style = getComputedStyle(frame);
      const clipped = style.overflow === "hidden" && (
        imageRect.top < frameRect.top - 0.5 || imageRect.bottom > frameRect.bottom + 0.5 ||
        imageRect.left < frameRect.left - 0.5 || imageRect.right > frameRect.right + 0.5
      );
      onPhotoMetrics({
        width: Math.round(imageRect.width),
        height: Math.round(imageRect.height),
        clipped,
        anchorLeft: canvasRect
          ? Math.max(190, Math.min(canvasRect.width - 190, frameRect.left - canvasRect.left + frameRect.width / 2))
          : frameRect.left + frameRect.width / 2,
        anchorTop: canvasRect ? Math.max(54, frameRect.top - canvasRect.top + 12) : frameRect.top,
      });
    };
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    const preview = document.querySelector(".visual-preview-page");
    if (preview) observer.observe(preview);
    preview?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      preview?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [layout, onPhotoMetrics, selectedId]);

  const selectTarget = (target: EventTarget | null) => {
    const photo = elementTarget(target)?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (photo?.dataset.galleryPhotoId) onSelect(photo.dataset.galleryPhotoId);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    const target = elementTarget(event.target);
    const photo = target?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (photo?.dataset.galleryPhotoId) {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      onDragPhoto(photo.dataset.galleryPhotoId);
      return;
    }
    const section = target?.closest<HTMLElement>("[data-gallery-section-id]");
    if (section?.dataset.gallerySectionId) {
      event.dataTransfer.effectAllowed = "move";
      onDragSection(section.dataset.gallerySectionId);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const target = elementTarget(event.target);
    const photo = target?.closest<HTMLElement>("[data-gallery-photo-id]");
    const section = target?.closest<HTMLElement>("[data-gallery-section-id]");
    const sectionId = photo?.dataset.gallerySectionId ?? section?.dataset.gallerySectionId;
    if (!sectionId) return;
    onDropPhoto(sectionId, photo?.dataset.galleryPhotoId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const photo = elementTarget(event.target)?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (!photo?.dataset.galleryPhotoId) return;
    event.preventDefault();
    onSelect(photo.dataset.galleryPhotoId);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!repositioningId) return;
    const photo = elementTarget(event.target)?.closest<HTMLElement>("[data-gallery-photo-id]");
    if (photo?.dataset.galleryPhotoId !== repositioningId || photo.dataset.fitMode !== "manual") return;
    const selected = layout.sections.flatMap((section) => section.type === "images" ? section.items : [])
      .find((item) => item.id === repositioningId);
    if (!selected) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    repositionSession.current = {
      id: repositioningId,
      x: event.clientX,
      y: event.clientY,
      zoom: selected.manualCrop?.zoom ?? 1,
      photo,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const session = repositionSession.current;
    if (!session) return;
    const rect = session.photo.getBoundingClientRect();
    const selected = layout.sections.flatMap((section) => section.type === "images" ? section.items : [])
      .find((item) => item.id === session.id);
    const x = Math.max(-100, Math.min(100, (selected?.manualCrop?.x ?? 0) + ((event.clientX - session.x) / Math.max(1, rect.width)) * 100));
    const y = Math.max(-100, Math.min(100, (selected?.manualCrop?.y ?? 0) + ((event.clientY - session.y) / Math.max(1, rect.height)) * 100));
    session.x = event.clientX;
    session.y = event.clientY;
    onManualReposition?.(session.id, { zoom: session.zoom, x, y });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!repositionSession.current) return;
    repositionSession.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={interactionRoot}
      className={`gallery-editor-interactions${repositioningId ? " is-repositioning" : ""}`}
      onClick={(event: MouseEvent<HTMLDivElement>) => selectTarget(event.target)}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <GalleryPage entry={entry} layout={layout} settings={settings} editing selectedId={selectedId} />
    </div>
  );
}
