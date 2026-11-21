"use client";

import { useEffect } from "react";

/** Records one storefront visit per browser session per creator. */
export function VisitTracker({ creatorId }: { creatorId: string }) {
  useEffect(() => {
    const key = `caught:visit:${creatorId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage can be unavailable in some in-app browsers; count the visit anyway.
    }
    const body = JSON.stringify({ creatorId, referrer: document.referrer || undefined });
    if (!navigator.sendBeacon?.("/api/events/visit", new Blob([body], { type: "application/json" }))) {
      fetch("/api/events/visit", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  }, [creatorId]);
  return null;
}
