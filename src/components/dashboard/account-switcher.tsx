"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { switchAccount } from "@/app/dashboard/_actions/account";
import { cn } from "@/components/ui/cn";

type Account = { id: string; handle: string; displayName: string; avatarUrl: string | null };

function Avatar({ a, size = 28 }: { a: Account; size?: number }) {
  return (
    <span className="shrink-0 overflow-hidden rounded-full border border-line bg-paper-2" style={{ width: size, height: size }}>
      {a.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-[12px] font-semibold text-muted">{a.displayName[0]}</span>
      )}
    </span>
  );
}

export function AccountSwitcher({ accounts, activeId }: { accounts: Account[]; activeId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = accounts.find((a) => a.id === activeId) ?? accounts[0];

  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-sheet px-2 py-1.5 text-left hover:border-ink/30"
      >
        <Avatar a={active} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{active.displayName}</span>
          <span className="num block truncate text-[11.5px] text-muted">@{active.handle}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted" aria-hidden />
      </button>
      {open && (
        <div className="absolute top-full right-0 left-0 z-40 mt-1 min-w-56 overflow-hidden rounded-xl border border-line bg-sheet shadow-[0_8px_24px_-12px_rgba(20,20,19,0.25)] animate-fade-up">
          <p className="label px-3 pt-2.5 pb-1">Accounts</p>
          {accounts.map((a) => (
            <form key={a.id} action={switchAccount}>
              <input type="hidden" name="creatorId" value={a.id} />
              <input type="hidden" name="returnTo" value={pathname.match(/^\/dashboard\/\w+\/.+/) ? "/dashboard" : pathname} />
              <button type="submit" className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-ink/[0.04]")}>
                <Avatar a={a} size={24} />
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {a.displayName} <span className="num text-muted">@{a.handle}</span>
                </span>
                {a.id === active.id && <Check className="size-4" aria-hidden />}
              </button>
            </form>
          ))}
          <div className="rule" />
          <Link href="/dashboard/accounts/new" className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] hover:bg-ink/[0.04]" onClick={() => setOpen(false)}>
            <Plus className="size-4" aria-hidden /> Add an account
          </Link>
        </div>
      )}
    </div>
  );
}
