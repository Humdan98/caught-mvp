"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "./button";

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "secondary",
  className,
}: {
  value: string;
  label?: string;
  size?: "sm" | "md";
  variant?: "secondary" | "ghost" | "primary";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    // `value` may be a path; make it absolute on the client.
    const text = value.startsWith("/") ? `${window.location.origin}${value}` : value;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API is blocked in some in-app browsers; fall back to a hidden textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button type="button" onClick={copy} className={buttonClass(variant, size, className)} aria-live="polite">
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? "Copied" : label}
    </button>
  );
}
