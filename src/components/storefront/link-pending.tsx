"use client";

import { useLinkStatus } from "next/link";

/**
 * Instant feedback on tap while the product page loads. Must sit inside a <Link>;
 * the Link needs `relative`. (A route-level loading.tsx would hide the page from no-JS clients.)
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <span aria-hidden className="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-[inherit] bg-paper/55" />;
}
