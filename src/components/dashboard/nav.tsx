"use client";

import { BarChart3, Bell, Clapperboard, Package, Receipt, UserRound } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

export const NAV = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/videos", label: "Videos", icon: Clapperboard },
  { href: "/dashboard/signups", label: "Sign-ups", icon: Bell },
  { href: "/dashboard/sales", label: "Sales", icon: Receipt },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
] as const;

/** Tap feedback while the next dashboard page loads. */
function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <span aria-hidden className="ml-auto size-1.5 animate-pulse rounded-full bg-current" /> : null;
}

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] transition-colors",
            isActive(pathname, href) ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/[0.06]",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
          <Pending />
        </Link>
      ))}
    </nav>
  );
}

/** Bottom tab bar on phones — creators manage their page from their phone too. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-6">
        {NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px]",
                isActive(pathname, href) ? "text-ink" : "text-faint",
              )}
            >
              <Icon className="size-[18px]" aria-hidden strokeWidth={isActive(pathname, href) ? 2.2 : 1.8} />
              <span className="relative">
                {label}
                <span className="absolute top-1/2 -right-2.5 -translate-y-1/2">
                  <Pending />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
