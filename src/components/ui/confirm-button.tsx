"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "./button";

/**
 * Two-step destructive submit: first tap arms it, second tap submits.
 * Must be rendered inside a <form>. Avoids window.confirm, which some in-app browsers block.
 */
export function ConfirmButton({
  children,
  confirmText = "Tap again to confirm",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  confirmText?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type={armed ? "submit" : "button"}
      disabled={pending}
      onClick={(e) => {
        if (!armed) {
          e.preventDefault();
          setArmed(true);
        }
      }}
      className={buttonClass(armed ? "primary" : "danger", size, [className, armed && "!bg-danger"].filter(Boolean).join(" "))}
    >
      {pending ? "Working…" : armed ? confirmText : children}
    </button>
  );
}
