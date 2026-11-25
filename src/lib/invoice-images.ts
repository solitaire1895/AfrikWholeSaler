import "server-only";

/**
 * Product photo → small JPEG for the invoice PDF (pdf-lib embeds only JPEG
 * and PNG; shop photos are often WebP). Returns null if the photo can't be
 * fetched in time, so the invoice never waits long or fails because of it.
 */
export async function invoiceThumbnail(url: string | null | undefined): Promise<Uint8Array | null> {
  if (!url || !/^https:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const { default: sharp } = await import("sharp");
    const jpeg = await sharp(input).rotate().resize(120, 120, { fit: "cover" }).flatten({ background: "#ffffff" }).jpeg({ quality: 80 }).toBuffer();
    return new Uint8Array(jpeg);
  } catch {
    return null;
  }
}
