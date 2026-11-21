"use client";

import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/dashboard/_actions/result";
import { saveVideo } from "@/app/dashboard/_actions/videos";
import { buttonClass } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageField } from "./image-field";

export type VideoFormValues = {
  id?: string;
  tiktokUrl: string;
  caption: string;
  thumbnailUrl: string | null;
  productId: string;
};

export function VideoForm({
  initial,
  products,
}: {
  initial: VideoFormValues;
  products: { id: string; number: number; name: string; status: string; isVisible: boolean }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveVideo, {});
  const e = state.errors ?? {};
  return (
    <ActionForm dispatch={action} pending={pending} className="max-w-2xl space-y-5" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <FormError message={state.message} />
      <section className="sheet space-y-5 p-5">
        <Field label="TikTok video link" htmlFor="tiktokUrl" error={e.tiktokUrl}>
          <Input id="tiktokUrl" name="tiktokUrl" type="url" defaultValue={initial.tiktokUrl} placeholder="https://www.tiktok.com/@you/video/…" aria-invalid={!!e.tiktokUrl} required />
        </Field>
        <Field label="Caption" htmlFor="caption" error={e.caption} hint="Shown under the thumbnail. Viewers recognise the video by it.">
          <Textarea id="caption" name="caption" defaultValue={initial.caption} rows={2} maxLength={300} aria-invalid={!!e.caption} required />
        </Field>
        <ImageField name="thumbnail" label="Thumbnail" defaultUrl={initial.thumbnailUrl} error={e.thumbnailUrl} aspect="portrait" />
        <Field label="Product in this video" htmlFor="productId" error={e.productId} hint="Tapping the video on your page opens this product.">
          <Select id="productId" name="productId" defaultValue={initial.productId} aria-invalid={!!e.productId}>
            <option value="">No product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.name}
                {p.status === "SOLD_OUT" ? " (sold out — viewers see its backup)" : ""}
                {!p.isVisible ? " (hidden)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </section>
      <div className="flex gap-2">
        <SubmitButton size="lg" pendingText="Saving…">
          {initial.id ? "Save changes" : "Add video"}
        </SubmitButton>
        <Link href="/dashboard/videos" className={buttonClass("ghost", "lg")}>
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}
