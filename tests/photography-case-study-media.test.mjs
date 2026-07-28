import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  photographyCaseStudyEditors,
  photographyCaseStudyMediaSlotId,
  photographyCaseStudyMediaPositions,
  photographyCaseStudySlotNamespace,
} from "../lib/photography-case-studies.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("photography case studies use stable isolated project-media slots", () => {
  const primarySlotIds = photographyCaseStudyEditors.map((item) => photographyCaseStudyMediaSlotId(item.slug));
  assert.deepEqual(primarySlotIds, [
    "photography.case-study.graduation-in-motion.project-media",
    "photography.case-study.quiet-confidence.project-media",
    "photography.case-study.gathered-together.project-media",
  ]);
  const allSlotIds = photographyCaseStudyEditors.flatMap((item) =>
    photographyCaseStudyMediaPositions.map((position) =>
      photographyCaseStudyMediaSlotId(item.slug, position)));
  assert.equal(new Set(allSlotIds).size, 9);
  assert.ok(allSlotIds.includes("photography.case-study.graduation-in-motion.supporting-media-1"));
  assert.ok(allSlotIds.includes("photography.case-study.graduation-in-motion.supporting-media-2"));
});

test("case-study text slots receive a slug namespace instead of landing-page positions", () => {
  assert.equal(
    photographyCaseStudySlotNamespace("quiet-confidence"),
    "photography.case-study.quiet-confidence",
  );
});

test("managed case-study media shares the image inspector and public publication document", async () => {
  const [placeholder, caseStudy, editor, publicRoute] = await Promise.all([
    read("components/public/media-placeholder.tsx"),
    read("components/public/placeholder-case-study.tsx"),
    read("components/cms/website-page-editor.tsx"),
    read("app/(public)/portfolio/[slug]/page.tsx"),
  ]);
  assert.match(placeholder, /data-page-media-managed=\{slotId \? "true"/);
  assert.match(placeholder, /editorial-media--asset/);
  assert.match(placeholder, /editorial-media--\$\{displayMode\}/);
  assert.match(placeholder, /positionX/);
  assert.match(placeholder, /positionY/);
  assert.match(caseStudy, /supporting-media-1/);
  assert.match(caseStudy, /supporting-media-2/);
  assert.match(editor, /selectedIsPhotographyCaseStudyImage/);
  assert.match(editor, /imageOnly=\{selectedIsFeaturedSoundImage \|\| selectedIsAboutPortrait \|\| selectedIsPhotographyCaseStudyImage\}/);
  assert.match(publicRoute, /getPublishedWebsitePage\("photography"\)/);
  assert.match(publicRoute, /editableProjectMedia/);
});

test("Fit and Layer modes persist through the website document and drive the managed image", async () => {
  const [actions, editor, placeholder, styles] = await Promise.all([
    read("app/admin/pages/actions.ts"),
    read("components/cms/website-page-editor.tsx"),
    read("components/public/media-placeholder.tsx"),
    read("app/(public)/public-site.css"),
  ]);
  assert.match(actions, /displayMode: z\.enum\(\["fit", "layer"\]\)/);
  assert.match(actions, /positionX: z\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(actions, /zoom: z\.number\(\)\.min\(1\)\.max\(4\)/);
  assert.match(editor, /Fit Mode/);
  assert.match(editor, /Layer Mode/);
  assert.match(editor, /aria-label="Zoom in"/);
  assert.match(editor, /Reset Position/);
  assert.match(placeholder, /objectPosition: `\$\{positionX\}% \$\{positionY\}%`/);
  assert.match(placeholder, /transform: `scale\(\$\{zoom\}\)`/);
  assert.match(styles, /\.editorial-media\.editorial-media--fit/);
  assert.match(styles, /height: auto/);
  assert.match(styles, /\.editorial-media\.editorial-media--layer/);
  assert.match(styles, /object-fit: cover/);
});
