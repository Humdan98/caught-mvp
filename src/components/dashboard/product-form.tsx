"use client";

import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProduct } from "@/app/dashboard/_actions/products";
import type { FormState } from "@/app/dashboard/_actions/result";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ImageField } from "./image-field";

export type ProductFormValues = {
  id?: string;
  number?: number;
  name: string;
  description: string;
  price: string;
  commission: string;
  imageUrl: string | null;
  tiktokUrl: string;
  amazonUrl: string;
  brandUrl: string;
  status: "AVAILABLE" | "SOLD_OUT";
  backupProductId: string;
  isVisible: boolean;
};

export function ProductForm({
  initial,
  nextNumber,
  backupOptions,
  focusBackup,
}: {
  initial: ProductFormValues;
  nextNumber?: number;
  backupOptions: { id: string; number: number; name: string; soldOut: boolean; hidden: boolean }[];
  focusBackup?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const [status, setStatus] = useState(initial.status);
  const e = state.errors ?? {};
  const number = initial.number ?? nextNumber;

  return (
    <ActionForm dispatch={action} pending={pending} className="grid gap-8 lg:grid-cols-[1fr_280px] [&>*]:min-w-0" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="space-y-5">
        <FormError message={state.message} />

        <section className="sheet space-y-5 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="font-semibold">Product</h2>
            <span className="num text-sm text-muted">
              #{number} {initial.id ? "" : "· assigned automatically"}
            </span>
          </div>
          <Field label="Name" htmlFor="name" error={e.name}>
            <Input id="name" name="name" defaultValue={initial.name} placeholder="Tinted Lip Oil — Cherry" aria-invalid={!!e.name} required />
          </Field>
          <Field label="Description" htmlFor="description" error={e.description} hint="What you'd say about it in a video. Short is fine.">
            <Textarea id="description" name="description" defaultValue={initial.description} rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price" htmlFor="price" error={e.price}>
              <div className="relative">
                <span className="num pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">$</span>
                <Input id="price" name="price" inputMode="decimal" defaultValue={initial.price} placeholder="14.00" className="num pl-6" aria-invalid={!!e.price} required />
              </div>
            </Field>
            <Field label="Commission" htmlFor="commission" error={e.commission} hint="Used for sale estimates.">
              <div className="relative">
                <Input id="commission" name="commission" inputMode="decimal" defaultValue={initial.commission} placeholder="15" className="num pr-7" aria-invalid={!!e.commission} />
                <span className="num pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">%</span>
              </div>
            </Field>
          </div>
          <ImageField name="image" label="Image" defaultUrl={initial.imageUrl} error={e.imageUrl} />
        </section>

        <section className="sheet space-y-5 p-5">
          <div>
            <h2 className="font-semibold">Where to buy</h2>
            <p className="mt-0.5 text-[13px] text-muted">TikTok Shop is the main button. Amazon and brand site show below it if set.</p>
          </div>
          <Field label="TikTok Shop link" htmlFor="tiktokUrl" error={e.tiktokUrl}>
            <Input id="tiktokUrl" name="tiktokUrl" type="url" defaultValue={initial.tiktokUrl} placeholder="https://shop.tiktok.com/view/product/…" aria-invalid={!!e.tiktokUrl} required />
          </Field>
          <Field label="Amazon link (optional)" htmlFor="amazonUrl" error={e.amazonUrl} hint="Use your Associates link so Amazon buyers still earn you commission.">
            <Input id="amazonUrl" name="amazonUrl" type="url" defaultValue={initial.amazonUrl} placeholder="https://www.amazon.com/dp/…?tag=you-20" aria-invalid={!!e.amazonUrl} />
          </Field>
          <Field label="Brand site link (optional)" htmlFor="brandUrl" error={e.brandUrl}>
            <Input id="brandUrl" name="brandUrl" type="url" defaultValue={initial.brandUrl} placeholder="https://…" aria-invalid={!!e.brandUrl} />
          </Field>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="sheet space-y-4 p-5">
          <h2 className="font-semibold">Availability</h2>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-paper-2 p-1" role="radiogroup">
            {(["AVAILABLE", "SOLD_OUT"] as const).map((s) => (
              <label key={s} className={cn("cursor-pointer rounded-md py-2 text-center text-[13px] font-medium", status === s ? "bg-sheet shadow-sm" : "text-muted")}>
                <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                {s === "AVAILABLE" ? "Available" : "Sold out"}
              </label>
            ))}
          </div>
          {status === "SOLD_OUT" && (
            <Field
              label="Send viewers to instead"
              htmlFor="backupProductId"
              error={e.backupProductId}
              hint="Viewers see this product with its buy buttons, and a note that it's your pick."
            >
              <Select id="backupProductId" name="backupProductId" defaultValue={initial.backupProductId} autoFocus={focusBackup} aria-invalid={!!e.backupProductId}>
                <option value="">No backup (sign-ups only)</option>
                {backupOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name}
                    {p.soldOut ? " (also sold out)" : ""}
                    {p.hidden ? " (hidden — won't be shown)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="rule" />
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="isVisible" defaultChecked={initial.isVisible} className="mt-0.5 size-4 accent-ink" />
            <span>
              <span className="block text-sm font-medium">Show on my page</span>
              <span className="block text-[12px] text-muted">Hidden products can&apos;t be found by number or search.</span>
            </span>
          </label>
        </section>
        <div className="flex gap-2">
          <SubmitButton size="lg" className="flex-1" pendingText="Saving…">
            {initial.id ? "Save changes" : "Add product"}
          </SubmitButton>
          <Link href="/dashboard/products" className={buttonClass("ghost", "lg")}>
            Cancel
          </Link>
        </div>
      </aside>
    </ActionForm>
  );
}
