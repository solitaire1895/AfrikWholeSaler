// Detects a file's real type from its first bytes, so an upload can't pass
// itself off as an image or video by its name or the browser's MIME type.

export type DetectedFile = { ext: string; mime: string };

const IMAGE: { ext: string; mime: string; test: (b: Uint8Array) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v) },
  { ext: "gif", mime: "image/gif", test: (b) => ascii(b, 0, 4) === "GIF8" },
  { ext: "webp", mime: "image/webp", test: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  // AVIF / HEIC: ISO-BMFF "ftyp" box with an image brand
  { ext: "avif", mime: "image/avif", test: (b) => ascii(b, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 12)) },
];

const VIDEO: { ext: string; mime: string; test: (b: Uint8Array) => boolean }[] = [
  { ext: "webm", mime: "video/webm", test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  { ext: "mov", mime: "video/quicktime", test: (b) => ascii(b, 4, 8) === "ftyp" && ascii(b, 8, 10) === "qt" },
  { ext: "mp4", mime: "video/mp4", test: (b) => ascii(b, 4, 8) === "ftyp" && !["avif", "avis"].includes(ascii(b, 8, 12)) },
];

function ascii(b: Uint8Array, from: number, to: number) {
  return String.fromCharCode(...b.slice(from, to));
}

async function head(file: Blob): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, 16).arrayBuffer());
}

export async function detectImage(file: Blob): Promise<DetectedFile | null> {
  const b = await head(file);
  return IMAGE.find((t) => t.test(b)) ?? null;
}

export async function detectVideo(file: Blob): Promise<DetectedFile | null> {
  const b = await head(file);
  return VIDEO.find((t) => t.test(b)) ?? null;
}
