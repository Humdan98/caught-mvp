"use client";

import { ActionForm } from "@/components/ui/action-form";
import { BellRing, Check } from "lucide-react";
import { useActionState, useState } from "react";
import { notifyMe, type NotifyState } from "@/app/[handle]/actions";
import { buttonClass } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function NotifyForm({ productId, number, soldOut }: { productId: string; number: number; soldOut: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<NotifyState, FormData>(notifyMe, { ok: false });
  const cta = soldOut ? "Text me when it's back" : "Text me when it's on sale";

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-ink/15 bg-sheet px-4 py-3 animate-fade-up" role="status">
        <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-sm">
          You&apos;re on the list for <span className="num font-semibold">#{number}</span>. We&apos;ll{" "}
          {state.contactType === "email" ? "email" : "text"} you once, then never again.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("ghost", "md", "w-full")}>
        <BellRing className="size-4" aria-hidden />
        {cta}
      </button>
    );
  }

  return (
    <ActionForm dispatch={action} pending={pending} className="space-y-2 animate-fade-up">
      <input type="hidden" name="productId" value={productId} />
      <label htmlFor={`contact-${productId}`} className="block text-sm font-medium">
        {cta}
      </label>
      <div className="flex gap-2">
        <input
          id={`contact-${productId}`}
          name="contact"
          required
          autoFocus
          autoComplete="email"
          placeholder="Phone or email"
          aria-invalid={!!state.error}
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-sheet px-3 text-[16px] placeholder:text-faint focus:border-ink focus:outline-none aria-[invalid=true]:border-danger"
        />
        <SubmitButton size="md" className="h-11">Notify me</SubmitButton>
      </div>
      {state.error ? (
        <p className="text-[13px] text-danger" role="alert">{state.error}</p>
      ) : (
        <p className="text-[12px] text-muted">One message about #{number}. No account, no spam.</p>
      )}
    </ActionForm>
  );
}
