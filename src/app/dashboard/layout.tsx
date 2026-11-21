import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { AccountSwitcher } from "@/components/dashboard/account-switcher";
import { MobileNav, SideNav } from "@/components/dashboard/nav";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { requireCreator } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { creator, creators } = await requireCreator();
  const pageUrl = `/${creator.handle}`;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      <aside className="hidden border-r border-line md:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-5 p-4">
          <Link href="/" className="px-1 pt-1">
            <Logo />
          </Link>
          <AccountSwitcher accounts={creators} activeId={creator.id} />
          <SideNav />
          <div className="mt-auto space-y-3">
            <div className="sheet p-3">
              <p className="label">Your link</p>
              <p className="num mt-1 truncate text-[13px]">caughtshop.com/{creator.handle}</p>
              <div className="mt-2 flex gap-1.5">
                <CopyButton value={pageUrl} label="Copy" />
                <a href={pageUrl} target="_blank" rel="noopener" className={buttonClass("ghost", "sm")}>
                  Preview <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            </div>
            <form action={logout}>
              <button type="submit" className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[14px] text-muted hover:bg-ink/[0.06] hover:text-ink">
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Phone header */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur md:hidden">
        <div className="min-w-0 flex-1">
          <AccountSwitcher accounts={creators} activeId={creator.id} />
        </div>
        <a href={pageUrl} target="_blank" rel="noopener" className={buttonClass("secondary", "sm", "h-10")} aria-label="Preview your page">
          <ExternalLink className="size-4" aria-hidden />
        </a>
        <form action={logout}>
          <button type="submit" className={buttonClass("ghost", "sm", "h-10")} aria-label="Log out">
            <LogOut className="size-4" aria-hidden />
          </button>
        </form>
      </header>

      <main className="min-w-0 px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-16">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
