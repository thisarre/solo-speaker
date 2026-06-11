import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 font-mono text-[10px] uppercase tracking-[.12em] text-faint">{eyebrow}</p> : null}
        <h1 className="m-0 text-2xl font-semibold tracking-[0]">{title}</h1>
        {description ? <p className="mt-1 text-[13px] text-mute">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
