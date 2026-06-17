"use client";

import Link from "next/link";
import { FileText, Home, LogOut, Plus, Search, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

function getNavItems(talkCount: number) {
  return [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/talks", label: "Talks", icon: FileText, count: talkCount },
    { href: "/talks/new", label: "Nouveau talk", icon: Plus },
    { href: "/settings", label: "Réglages", icon: Settings }
  ];
}

function isActiveNavItem(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/talks/new") return pathname === "/talks/new";
  if (href === "/talks") return pathname === "/talks" || (pathname.startsWith("/talks/") && pathname !== "/talks/new");
  if (href === "/settings") return pathname === "/settings";
  return pathname === href;
}

export function Sidebar({ talkCount, userName }: { talkCount: number; userName: string }) {
  const pathname = usePathname();
  const navItems = getNavItems(talkCount);

  return (
    <>
      <aside className="hidden w-[64px] shrink-0 flex-col border-r border-line bg-panel px-2 pb-4 pt-[18px] md:flex lg:w-[228px] lg:px-3">
        <div className="flex justify-center pb-4 lg:block lg:px-2">
          <Logo compact />
        </div>
        <div className="mb-[18px] hidden items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-[12.5px] text-faint lg:flex">
          <Search className="size-4" />
          <span>Search</span>
          <span className="ml-auto rounded-[5px] bg-panel px-1.5 py-0.5 font-mono text-[10.5px]">⌘K</span>
        </div>
        <p className="hidden px-2 pb-2 font-mono text-[10px] uppercase tracking-[.12em] text-faint lg:block">Studio</p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveNavItem(pathname, item.href);
            return (
              <Link
                aria-label={item.label}
                className={`flex h-9 items-center justify-center gap-2.5 rounded-lg px-2 text-[13.5px] transition lg:justify-start lg:py-2 ${
                  active ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "text-mute hover:bg-surface/70 hover:text-ink"
                }`}
                href={item.href}
                key={`${item.href}-${item.label}`}
                title={item.label}
              >
                <Icon className="size-4 opacity-85" />
                <span className="hidden lg:inline">{item.label}</span>
                {item.count ? <span className="ml-auto hidden font-mono text-[11px] text-faint lg:inline">{item.count}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-line pt-3">
          <div className="mb-3 flex justify-center lg:justify-start lg:px-2">
            <ThemeToggle className="w-[92px] lg:w-[96px]" />
          </div>
          <div className="flex items-center justify-center gap-2.5 lg:justify-start lg:px-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-accent-bg text-[11px] font-semibold text-accent-ink">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="m-0 truncate text-[12.5px] font-medium">{userName}</p>
              <p className="m-0 truncate text-[11px] text-faint">Studio owner</p>
            </div>
            <Link aria-label="Logout" className="ml-auto hidden size-7 items-center justify-center rounded-md text-faint transition hover:bg-surface hover:text-ink lg:flex" href="/logout">
              <LogOut className="size-4" />
            </Link>
          </div>
        </div>
        <div className="mt-2 flex justify-center lg:hidden">
          <Link aria-label="Logout" className="flex size-8 items-center justify-center rounded-[8px] text-faint transition hover:bg-surface hover:text-ink" href="/logout">
            <LogOut className="size-4" />
          </Link>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex h-14 items-center justify-between gap-1 rounded-[14px] border border-line bg-panel/96 px-2 shadow-[0_12px_40px_rgba(20,20,25,.18)] backdrop-blur md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveNavItem(pathname, item.href);
          return (
            <Link
              aria-label={item.label}
              className={`flex size-10 items-center justify-center rounded-[10px] transition ${
                active ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,20,25,.08)]" : "text-mute hover:bg-surface/70 hover:text-ink"
              }`}
              href={item.href}
              key={`mobile-${item.href}-${item.label}`}
              title={item.label}
            >
              <Icon className="size-4" />
            </Link>
          );
        })}
        <ThemeToggle className="w-[92px]" />
        <Link aria-label="Logout" className="flex size-10 items-center justify-center rounded-[10px] text-mute transition hover:bg-surface/70 hover:text-ink" href="/logout">
          <LogOut className="size-4" />
        </Link>
      </nav>
    </>
  );
}
