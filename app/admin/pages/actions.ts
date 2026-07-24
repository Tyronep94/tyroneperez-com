"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import type { MediaAsset } from "@/types/cms";
import { websitePageMeta, websitePageKeys, type WebsitePageDocument, type WebsitePageKey } from "@/types/website-editor";

const cssValue = z.string().max(80).regex(/^[a-z0-9.%(),\s+\-/]*$/i).optional();
const layoutSchema = z.object({
  width: cssValue,
  maxWidth: cssValue,
  marginTop: cssValue,
  marginBottom: cssValue,
  padding: cssValue,
  textAlign: z.enum(["left", "center", "right"]).optional(),
  objectFit: z.enum(["contain", "cover"]).optional(),
  objectPosition: z.string().max(40).regex(/^[a-z0-9.%\s-]*$/i).optional(),
}).optional();
const slotSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(["text", "link", "button", "media"]),
  text: z.string().max(10000).optional(),
  href: z.string().max(1000).optional(),
  assetId: z.string().uuid().optional(),
  alt: z.string().max(1000).optional(),
  layout: layoutSchema,
});
const documentSchema = z.object({
  version: z.literal(1),
  pageKey: z.enum(websitePageKeys),
  slots: z.record(z.string(), slotSchema),
});

function safeHref(value?: string) {
  if (!value) return value;
  return /^(\/(?!\/)|#|mailto:|tel:|https:\/\/)/i.test(value) ? value : undefined;
}

async function validateDocument(pageKey: WebsitePageKey, input: WebsitePageDocument) {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success || parsed.data.pageKey !== pageKey) {
    return { error: "The page draft is invalid." } as const;
  }
  const assetIds = [...new Set(Object.values(parsed.data.slots).flatMap((slot) => slot.assetId ? [slot.assetId] : []))];
  const { supabase } = await requireAdmin();
  const { data, error } = assetIds.length
    ? await supabase.from("media_assets").select("*").in("id", assetIds)
    : { data: [], error: null };
  if (error) return { error: error.message } as const;
  const assets = new Map(((data ?? []) as MediaAsset[]).map((asset) => [asset.id, asset]));
  if (assetIds.some((id) => !assets.has(id))) return { error: "A selected media asset no longer exists." } as const;
  const slots = Object.fromEntries(Object.entries(parsed.data.slots).map(([id, slot]) => [id, {
    ...slot,
    href: safeHref(slot.href),
    asset: slot.assetId ? assets.get(slot.assetId) : undefined,
  }]));
  return { document: { ...parsed.data, slots } as WebsitePageDocument } as const;
}

export async function saveWebsitePageDraft(pageKey: WebsitePageKey, input: WebsitePageDocument) {
  const validation = await validateDocument(pageKey, input);
  if ("error" in validation) return { ok: false, message: validation.error };
  const { admin, supabase } = await requireAdmin();
  const { error } = await supabase.from("website_page_drafts").upsert({
    page_key: pageKey,
    document: validation.document,
    updated_by: admin.id,
  });
  revalidatePath(`/admin/pages/${pageKey}`);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function publishWebsitePage(pageKey: WebsitePageKey, input: WebsitePageDocument) {
  const validation = await validateDocument(pageKey, input);
  if ("error" in validation) return { ok: false, message: validation.error };
  const { admin, supabase } = await requireAdmin();
  const current = await supabase.from("website_page_publications").select("version").eq("page_key", pageKey).maybeSingle();
  const { error } = await supabase.from("website_page_publications").upsert({
    page_key: pageKey,
    document: validation.document,
    version: (current.data?.version ?? 0) + 1,
    published_by: admin.id,
    published_at: new Date().toISOString(),
  });
  if (!error) {
    await supabase.from("website_page_drafts").upsert({
      page_key: pageKey,
      document: validation.document,
      updated_by: admin.id,
    });
    revalidatePath(websitePageMeta[pageKey].path);
    revalidatePath(`/admin/pages/${pageKey}`);
  }
  return error ? { ok: false, message: error.message } : { ok: true };
}
