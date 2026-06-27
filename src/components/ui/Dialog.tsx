import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { getMessages } from "@/i18n/messages";

type DialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Dialog({ title, description, children, footer }: DialogProps) {
  const messages = getMessages("en");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_oklab,var(--ink)_32%,transparent)] p-4 backdrop-blur-sm">
      <section className="w-full max-w-[480px] rounded-[10px] border border-border bg-background p-5 shadow-studio">
        <div className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[16px] font-semibold tracking-[0] text-foreground">{title}</h2>
            {description ? <p className="mt-1 text-[13px] text-muted">{description}</p> : null}
          </div>
          <Button aria-label={messages.ui.close} size="icon" variant="quiet">
            <X className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4">{children}</div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </section>
    </div>
  );
}
