import Link from "next/link";
import { BarChart3, FileText, Home, LogOut, Plus, Search, Settings } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { logout } from "@/modules/auth/actions";

function getNavItems(talkCount: number) {
  return [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/talks", label: "Talks", icon: FileText, count: talkCount },
    { href: "/talks/new", label: "Nouveau talk", icon: Plus },
    { href: "/dashboard", label: "Progression", icon: BarChart3 },
    { href: "/dashboard", label: "Réglages", icon: Settings }
  ];
}

export function Sidebar({ talkCount, userName }: { talkCount: number; userName: string }) {
  return (
    <aside className="hidden w-[228px] shrink-0 flex-col border-r border-line bg-panel px-3 pb-4 pt-[18px] lg:flex">
      <div className="px-2 pb-4">
        <Logo />
      </div>
      <div className="mb-[18px] flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-[12.5px] text-faint">
        <Search className="size-4" />
        <span>Search</span>
        <span className="ml-auto rounded-[5px] bg-panel px-1.5 py-0.5 font-mono text-[10.5px]">⌘K</span>
      </div>
      <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[.12em] text-faint">Studio</p>
      <nav className="flex flex-col gap-0.5">
        {getNavItems(talkCount).map((item, index) => {
          const Icon = item.icon;
          const active = index === 1;
          return (
            <Link
              className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13.5px] transition ${
                active ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(20,20,25,.05)]" : "text-mute hover:bg-surface/70 hover:text-ink"
              }`}
              href={item.href}
              key={`${item.href}-${item.label}`}
            >
              <Icon className="size-4 opacity-85" />
              <span>{item.label}</span>
              {item.count ? <span className="ml-auto font-mono text-[11px] text-faint">{item.count}</span> : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-line px-2 pt-3">
        <div className="flex size-6 items-center justify-center rounded-full bg-accent-bg text-[11px] font-semibold text-accent-ink">
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="m-0 truncate text-[12.5px] font-medium">{userName}</p>
          <p className="m-0 truncate text-[11px] text-faint">Studio owner</p>
        </div>
        <form action={logout} className="ml-auto">
          <button aria-label="Logout" className="flex size-7 items-center justify-center rounded-md text-faint transition hover:bg-surface hover:text-ink">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
