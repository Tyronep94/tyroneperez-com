import type { SupabaseClient } from "@supabase/supabase-js";
import type { MediaAsset } from "@/types/cms";
import type { WebsitePageDocument, WebsitePageKey } from "@/types/website-editor";

export type MediaIntegrityIssue = {
  pageKey: WebsitePageKey;
  slotId: string;
  assetId: string;
  filename: string;
  storagePath: string;
  reason: "missing_record" | "missing_object";
};

export function websiteDocumentMediaReferences(document: WebsitePageDocument) {
  return Object.entries(document.slots).flatMap(([slotId, slot]) => [
    slot.assetId && { slotId, assetId: slot.assetId, filename: slot.asset?.filename ?? "Unknown asset", storagePath: slot.asset?.storage_path ?? "" },
    slot.audio_asset_id && { slotId, assetId: slot.audio_asset_id, filename: slot.audio_asset?.filename ?? "Unknown audio asset", storagePath: slot.audio_asset?.storage_path ?? "" },
    slot.artwork_asset_id && { slotId, assetId: slot.artwork_asset_id, filename: slot.artwork_asset?.filename ?? "Unknown artwork asset", storagePath: slot.artwork_asset?.storage_path ?? "" },
  ].filter((reference): reference is { slotId: string; assetId: string; filename: string; storagePath: string } => Boolean(reference)));
}

export async function storageObjectExists(supabase: SupabaseClient, storagePath: string) {
  const normalized = storagePath.replace(/^\/+/, "");
  const split = normalized.lastIndexOf("/");
  const directory = split === -1 ? "" : normalized.slice(0, split);
  const filename = split === -1 ? normalized : normalized.slice(split + 1);
  if (!filename) return false;
  const { data, error } = await supabase.storage.from("cms-media").list(directory, {
    limit: 100,
    search: filename,
  });
  if (error) return false;
  return (data ?? []).some((object) => object.name === filename);
}

export async function inspectWebsiteDocumentMedia(
  supabase: SupabaseClient,
  document: WebsitePageDocument,
): Promise<MediaIntegrityIssue[]> {
  const references = websiteDocumentMediaReferences(document);
  if (!references.length) return [];
  const ids = [...new Set(references.map((reference) => reference.assetId))];
  const { data } = await supabase.from("media_assets").select("id,filename,storage_path").in("id", ids);
  const records = new Map(((data ?? []) as Pick<MediaAsset, "id" | "filename" | "storage_path">[]).map((asset) => [asset.id, asset]));
  const existence = new Map<string, boolean>();
  await Promise.all([...records.values()].map(async (asset) => {
    existence.set(asset.id, await storageObjectExists(supabase, asset.storage_path));
  }));
  const issues: MediaIntegrityIssue[] = [];
  for (const reference of references) {
    const record = records.get(reference.assetId);
    if (!record) {
      issues.push({
        pageKey: document.pageKey,
        slotId: reference.slotId,
        assetId: reference.assetId,
        filename: reference.filename,
        storagePath: reference.storagePath,
        reason: "missing_record",
      });
      continue;
    }
    if (existence.get(record.id)) continue;
    issues.push({
      pageKey: document.pageKey,
      slotId: reference.slotId,
      assetId: record.id,
      filename: record.filename,
      storagePath: record.storage_path,
      reason: "missing_object",
    });
  }
  return issues;
}

export async function auditMediaObjectRecords(
  supabase: SupabaseClient,
  assets: MediaAsset[],
  maxAgeMs = 10 * 60 * 1000,
) {
  const now = Date.now();
  const results = new Map<string, Pick<MediaAsset, "object_status" | "object_checked_at">>();
  await Promise.all(assets.map(async (asset) => {
    const checkedAt = asset.object_checked_at ? new Date(asset.object_checked_at).getTime() : 0;
    if (asset.object_status && asset.object_status !== "unknown" && now - checkedAt < maxAgeMs) {
      results.set(asset.id, { object_status: asset.object_status, object_checked_at: asset.object_checked_at });
      return;
    }
    const exists = await storageObjectExists(supabase, asset.storage_path);
    const objectStatus = exists ? "available" as const : "missing" as const;
    const objectCheckedAt = new Date().toISOString();
    results.set(asset.id, { object_status: objectStatus, object_checked_at: objectCheckedAt });
    await supabase.from("media_assets").update({
      object_status: objectStatus,
      object_checked_at: objectCheckedAt,
    }).eq("id", asset.id);
  }));
  return assets.map((asset) => ({ ...asset, ...results.get(asset.id) }));
}
