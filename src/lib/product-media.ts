// Product photo / video uploads, sent straight from the admin's browser to
// Supabase Storage. Going through a server action would hit Next.js' request
// size limits (1MB for server actions, 10MB through the proxy) — phone photos
// and videos are bigger. Storage RLS only lets admins write these buckets.
import { createClient } from "@/lib/supabase/client";
import { detectImage, detectVideo } from "@/lib/file-signature";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Supabase's per-file upload limit on the free plan. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type MediaError = "notImage" | "heic" | "imageTooLarge" | "notVideo" | "videoTooLarge" | "failed";
export type MediaResult = { url: string } | { error: MediaError; detail?: string };

/** iPhone photos (HEIC/HEIF): browsers can't display them, so they're refused with a clear message. */
async function isHeic(file: Blob) {
  const b = new Uint8Array(await file.slice(4, 12).arrayBuffer());
  const tag = String.fromCharCode(...b);
  return tag.startsWith("ftyp") && ["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(tag.slice(4));
}

async function upload(bucket: "product-images" | "product-videos", file: File, ext: string, contentType: string): Promise<MediaResult> {
  const supabase = createClient();
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false, contentType });
  if (error) return { error: "failed", detail: error.message };
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}

export async function uploadProductImage(file: File): Promise<MediaResult> {
  if (file.size > MAX_IMAGE_BYTES) return { error: "imageTooLarge" };
  const image = await detectImage(file);
  if (!image) return { error: (await isHeic(file)) ? "heic" : "notImage" };
  return upload("product-images", file, image.ext, image.mime);
}

export async function uploadProductVideoFile(file: File): Promise<MediaResult> {
  if (file.size > MAX_VIDEO_BYTES) return { error: "videoTooLarge" };
  const video = await detectVideo(file);
  if (!video) return { error: "notVideo" };
  return upload("product-videos", file, video.ext, video.mime);
}
