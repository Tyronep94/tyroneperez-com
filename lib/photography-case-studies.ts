export const photographyCaseStudyEditors = [
  { slug: "graduation-in-motion", label: "Graduation in Motion" },
  { slug: "quiet-confidence", label: "Engagement" },
  { slug: "gathered-together", label: "Street Photography" },
] as const;

export type PhotographyCaseStudySlug = (typeof photographyCaseStudyEditors)[number]["slug"];

export function isPhotographyCaseStudySlug(value: string): value is PhotographyCaseStudySlug {
  return photographyCaseStudyEditors.some((item) => item.slug === value);
}

export function photographyCaseStudySlotNamespace(slug: PhotographyCaseStudySlug) {
  return `photography.case-study.${slug}`;
}

export function photographyCaseStudyMediaSlotId(slug: PhotographyCaseStudySlug) {
  return `${photographyCaseStudySlotNamespace(slug)}.project-media`;
}

export function isPhotographyCaseStudyMediaSlot(slotId?: string) {
  return photographyCaseStudyEditors.some(
    (item) => photographyCaseStudyMediaSlotId(item.slug) === slotId,
  );
}
