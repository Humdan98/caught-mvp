import Link from "next/link";
import { Logo } from "@/components/logo";

export function StoreFooter() {
  return (
    <footer className="mt-auto border-t border-line px-5 py-6 text-center">
      <Link href="/" className="inline-flex flex-col items-center gap-1 text-muted hover:text-ink">
        <Logo className="text-[14px]" />
        <span className="text-[12px]">Nothing slips.</span>
      </Link>
    </footer>
  );
}
