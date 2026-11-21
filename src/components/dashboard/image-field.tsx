"use client";

import { ImagePlus, Link2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { inputClass } from "@/components/ui/field";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // keep in sync with MAX_UPLOAD_BYTES in lib/uploads.ts

/**
 * Upload an image or paste an image URL. Submits `${name}File` and `${name}Url`.
 * The server prefers the uploaded file (see resolveImageField).
 */
export function ImageField({
  name,
  label,
  defaultUrl,
  error,
  aspect = "square",
}: {
  name: string;
  label: string;
  defaultUrl?: string | null;
  error?: string;
  aspect?: "square" | "portrait" | "round";
}) {
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [tooBig, setTooBig] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Checked here too: on Vercel an oversized post is rejected before our server code runs.
    if (f.size > MAX_IMAGE_BYTES) {
      e.target.value = "";
      setTooBig(true);
      return;
    }
    setTooBig(false);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(f);
    setPreview(objectUrl.current);
  }

  function clear() {
    if (fileRef.current) fileRef.current.value = "";
    setUrl("");
    setPreview(null);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden border border-line bg-paper-2",
            aspect === "square" && "size-28 rounded-xl",
            aspect === "portrait" && "h-36 w-20 rounded-lg",
            aspect === "round" && "size-20 rounded-full",
          )}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-faint">
              <ImagePlus className="size-6" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("upload");
                fileRef.current?.click();
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink/20 px-2.5 text-[13px] hover:border-ink/50"
            >
              <ImagePlus className="size-3.5" aria-hidden /> Upload
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] hover:bg-ink/5",
                mode === "url" && "bg-ink/[0.06]",
              )}
            >
              <Link2 className="size-3.5" aria-hidden /> Paste URL
            </button>
            {preview && (
              <button type="button" onClick={clear} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-muted hover:bg-ink/5">
                <X className="size-3.5" aria-hidden /> Remove
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" name={`${name}File`} accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={onFile} tabIndex={-1} />
          <input
            name={`${name}Url`}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreview(e.target.value || null);
            }}
            placeholder="https://…"
            className={cn(inputClass, "h-9 text-[13px]", mode !== "url" && "hidden")}
            aria-invalid={!!error}
          />
          {tooBig || error ? (
            <p className="text-[13px] text-danger" role="alert">{tooBig ? "Image must be under 4 MB" : error}</p>
          ) : (
            <p className="text-[12px] text-muted">JPG, PNG, WebP or GIF, up to 4 MB.</p>
          )}
        </div>
      </div>
    </div>
  );
}
