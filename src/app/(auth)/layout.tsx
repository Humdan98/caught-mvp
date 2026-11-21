import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-10">
      <Link href="/" aria-label="Caught home">
        <Logo />
      </Link>
      <div className="mt-10 w-full max-w-sm">{children}</div>
    </main>
  );
}
