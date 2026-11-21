"use client";

import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-8 text-xl font-semibold">Something went wrong.</h1>
      <p className="mt-2 text-sm text-muted">It&apos;s on our side. Try again in a moment.</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
      {error.digest && <p className="num mt-4 text-[11px] text-faint">Ref {error.digest}</p>}
    </main>
  );
}
