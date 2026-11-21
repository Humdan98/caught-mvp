import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="num mt-8 text-sm text-muted">404</p>
      <h1 className="mt-1 text-xl font-semibold">Nobody here by that name.</h1>
      <p className="mt-2 text-sm text-muted">Check the handle in the bio link and try again.</p>
      <Link href="/" className="mt-6 text-sm font-medium underline underline-offset-4">
        Go to Caught
      </Link>
    </main>
  );
}
