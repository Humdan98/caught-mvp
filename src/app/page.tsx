import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5">
      <nav className="flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          {session ? (
            <ButtonLink href="/dashboard" size="sm">
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Claim your handle
              </ButtonLink>
            </>
          )}
        </div>
      </nav>

      <section className="grid flex-1 items-center gap-12 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div>
          <p className="label">For TikTok Shop affiliates</p>
          <h1 className="mt-3 text-5xl leading-[1.02] font-semibold tracking-tight md:text-6xl">Nothing slips.</h1>
          <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-2">
            Every product you promote gets a number. Say “it&apos;s <span className="num font-semibold">#47</span> in my bio.”
            Viewers type 47, tap buy, and you get the credit, whether they buy on TikTok Shop, Amazon or the brand&apos;s site.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/mayafinds" size="lg">
              See a creator page <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink href={session ? "/dashboard" : "/login"} variant="secondary" size="lg">
              Creator dashboard
            </ButtonLink>
          </div>
          <p className="mt-4 text-[13px] text-muted">
            Demo login: <span className="num text-ink-2">demo@caughtshop.com</span> /{" "}
            <span className="num text-ink-2">caught-demo</span>
          </p>
        </div>

        {/* The whole product, as a receipt. */}
        <div className="sheet torn-bottom mx-auto w-full max-w-sm rounded-b-none px-6 pt-6 pb-9" aria-hidden>
          <div className="flex items-center justify-between">
            <Logo className="text-[15px]" />
            <span className="label">Example</span>
          </div>
          <div className="rule my-4" />
          <ul className="num space-y-2.5 text-[14px]">
            <li className="flex justify-between">
              <span className="text-muted">Viewer typed</span>
              <span>47</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Found</span>
              <span>#47 Tinted Lip Oil</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Time to buy button</span>
              <span>2.1s</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Bought on</span>
              <span>Amazon</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Order</span>
              <span>$14.00</span>
            </li>
          </ul>
          <div className="rule my-4" />
          <p className="num flex justify-between text-[17px] font-semibold">
            <span>Caught</span>
            <span className="text-money">$2.80 from #47</span>
          </p>
          <p className="mt-6 text-center text-[11px] tracking-[0.2em] text-faint uppercase">Nothing slips</p>
        </div>
      </section>

      <section className="grid gap-6 border-t border-line py-10 text-[14px] md:grid-cols-3">
        {[
          ["Link?? comments", "The basket didn't show. Now the answer is a number they can type."],
          ["Pulled links & sold out", "The video keeps its views. Your page sends them to a backup you chose."],
          ["Amazon spillover", "Viewers who'd rather buy on Amazon still buy through you."],
        ].map(([title, body]) => (
          <div key={title}>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-muted">{body}</p>
          </div>
        ))}
      </section>

      <footer className="flex items-center justify-between border-t border-line py-6 text-[12px] text-muted">
        <span>Caught · sandbox build</span>
        <Link href="/signup" className="hover:text-ink">
          Claim your handle →
        </Link>
      </footer>
    </main>
  );
}
