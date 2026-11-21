"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useActionFormPending } from "./action-form";
import { buttonClass } from "./button";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const status = useFormStatus();
  const actionFormPending = useActionFormPending();
  const pending = actionFormPending ?? status.pending;
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonClass(variant, size, className)}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
