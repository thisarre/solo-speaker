import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-border bg-panel px-5 py-10 text-center text-muted">
      {icon ? <div className="flex size-9 items-center justify-center rounded-[8px] bg-surface text-faint [&_svg]:size-5">{icon}</div> : null}
      <b className="text-sm font-semibold text-foreground">{title}</b>
      <span className="max-w-[38ch] text-[13px] leading-5">{description}</span>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
