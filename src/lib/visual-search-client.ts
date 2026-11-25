"use client";

// ========================================================
// Camera search, in the browser. Apple's MobileCLIP-S0 (≈12 MB, downloaded
// once then cached by the browser) turns a photo into 512 numbers; the
// server only compares those numbers with the catalogue (pgvector), so the
// shop's server never runs the model.
// Shop photos are indexed the same way, in the admin's browser.
// ========================================================

export const MODEL_ID = "Xenova/mobileclip_s0";
/** Stored with each product's embedding: a new model re-indexes every photo. */
export const MODEL_TAG = "mobileclip_s0";

type Embedder = (image: Blob) => Promise<number[]>;
let loading: Promise<Embedder> | null = null;

export function loadEmbedder(): Promise<Embedder> {
  loading ??= (async () => {
    const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false;
    const [processor, model] = await Promise.all([
      AutoProcessor.from_pretrained(MODEL_ID),
      CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: "q8" }),
    ]);
    return async (image: Blob) => {
      const raw = await RawImage.fromBlob(image);
      const { image_embeds } = await model(await processor(raw));
      const v = Array.from(image_embeds.data as Float32Array);
      const norm = Math.hypot(...v) || 1;
      return v.map((x) => Number((x / norm).toFixed(6)));
    };
  })().catch((err) => {
    loading = null; // retry next time
    throw err;
  });
  return loading;
}

export async function embedBlob(image: Blob) {
  return (await loadEmbedder())(image);
}
