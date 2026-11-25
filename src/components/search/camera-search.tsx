"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Camera, ImageUp, Loader2, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { NotFoundChat } from "@/components/search/not-found-chat";
import { OPEN_CHAT_EVENT } from "@/components/chat/chat-widget";
import { embedBlob, loadEmbedder } from "@/lib/visual-search-client";

type Result = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  moq: number;
  similarity: number;
};

type ErrorCode = "not_image" | "too_large" | "rate_limited" | "unavailable" | "generic";

/** CLIP reads 224 px images: sending more only costs upload time on mobile data. */
const MAX_SIDE = 384;

/** Shrinks the photo in the browser (a 4 MB phone photo becomes ~25 KB) before upload. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file; // format the browser can't decode: let the server try
  }
}

/** Starts downloading the photo model (≈12 MB, cached afterwards) before the first photo. */
function warmUp() {
  loadEmbedder().catch(() => {});
}

/** Camera icon (for the search bar) that opens the photo search dialog. */
export function CameraSearchButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={t.discovery.camera.button}
        title={t.discovery.camera.button}
        onMouseEnter={warmUp}
        onFocus={warmUp}
        onTouchStart={warmUp}
        onClick={() => {
          warmUp();
          setOpen(true);
        }}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary hover:text-brand",
          className
        )}
      >
        <Camera className="h-[18px] w-[18px]" />
      </button>
      {open && createPortal(<CameraSearchDialog onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function CameraSearchDialog({ onClose }: { onClose: () => void }) {
  const { t, format } = useI18n();
  const C = t.discovery.camera;
  const { formatPrice } = useCurrency();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "searching" | "done">("idle");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<ErrorCode | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // "Chat with us" from the no-match panel: get out of the way of the chat.
    window.addEventListener(OPEN_CHAT_EVENT, onClose);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Straight to the camera / photo picker.
    inputRef.current?.click();
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_CHAT_EVENT, onClose);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function search(file: File) {
    setError(null);
    setResults([]);
    setPreview(URL.createObjectURL(file));
    setState("searching");
    try {
      // The photo never leaves the device: only its 512-number description does.
      const embedding = await embedBlob(await shrink(file));
      const res = await fetch("/api/search/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding }),
      });
      const json = (await res.json().catch(() => ({}))) as { results?: Result[]; error?: ErrorCode };
      if (!res.ok) {
        setError(json.error && json.error in C.errors ? json.error : "generic");
        setState("idle");
        return;
      }
      setResults(json.results ?? []);
      setState("done");
    } catch {
      setError("generic");
      setState("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={C.title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] bg-surface shadow-[var(--shadow-dropdown)] sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
            <Camera className="h-5 w-5 text-brand" />
            {C.title}
          </h2>
          <button type="button" onClick={onClose} aria-label={C.close} className="rounded-full p-2 text-text-secondary hover:bg-surface-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) search(file);
            }}
          />

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-secondary">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageUp className="h-10 w-10 text-text-disabled" />
              )}
              {state === "searching" && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
                  <Loader2 className="h-7 w-7 animate-spin text-brand" />
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-text-secondary">{state === "searching" ? C.searching : C.lead}</p>
              {error && (
                <p role="alert" className="mt-3 rounded-[12px] bg-error/10 p-3 text-sm text-error">
                  {C.errors[error]}
                </p>
              )}
              <button
                type="button"
                disabled={state === "searching"}
                onClick={() => inputRef.current?.click()}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-[var(--radius-button)] bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                {preview ? C.another : C.take}
              </button>
            </div>
          </div>

          {state === "done" &&
            (results.length > 0 ? (
              <div className="mt-6">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-disabled">{C.results}</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {results.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/products/${r.slug}`}
                        onClick={onClose}
                        className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-shadow hover:shadow-md"
                      >
                        <div className="relative aspect-square bg-surface-secondary">
                          {r.image && <Image src={r.image} alt={r.name} fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover" />}
                          <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold text-navy">
                            {format(C.match, { n: Math.round(r.similarity * 100) })}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="line-clamp-2 text-sm font-medium text-text-primary group-hover:text-brand">{r.name}</p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {r.price > 0 && <span className="font-semibold text-navy">{format(C.from, { price: formatPrice(r.price) })}</span>}
                            {r.price > 0 && " · "}
                            {format(C.moq, { n: r.moq })}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <NotFoundChat className="mt-6 py-6" />
              </div>
            ) : (
              <NotFoundChat className="mt-6" />
            ))}
        </div>
      </div>
    </div>
  );
}
