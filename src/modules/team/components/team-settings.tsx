"use client";

import { useState, useTransition } from "react";
import { Users, Mail, Copy, Check, Trash2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

type Invitation = {
  id: string;
  email: string;
  status: "pending" | "active" | "revoked";
  invited_at: string;
  accepted_at: string | null;
  joinUrl?: string;
};

type Props = {
  teamId: string;
  maxSeats: number;
  invitations: Invitation[];
};

export function TeamSettings({ maxSeats, invitations: initial }: Props) {
  const [invitations, setInvitations] = useState(initial.filter(i => i.status !== "revoked"));
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { messages } = useI18n();
  const copy = messages.team;

  const usedSeats = invitations.length + 1; // +1 for the team owner
  const remainingSeats = maxSeats - usedSeats;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json() as { error?: string; id?: string; joinUrl?: string; emailSent?: boolean; emailError?: string | null };
      if (!res.ok) { setError(data.error ?? copy.genericError); return; }
      setEmail("");
      if (data.emailError) {
        setError(copy.emailFailedManual.replace("{error}", String(data.emailError)));
      }
      setInvitations(prev => [
        ...prev.filter(i => i.email !== email),
        { id: data.id ?? crypto.randomUUID(), email, status: "pending", invited_at: new Date().toISOString(), accepted_at: null, joinUrl: data.joinUrl }
      ]);
    });
  }

  async function handleResend(email: string) {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json() as { error?: string; id?: string; joinUrl?: string; emailSent?: boolean; emailError?: string | null };
      if (!res.ok) { setError(data.error ?? copy.resendError); return; }
      if (data.emailError) {
        setError(copy.emailFailedBelow.replace("{error}", String(data.emailError)));
      }
      setInvitations(prev => prev.map(i =>
        i.email === email ? { ...i, joinUrl: data.joinUrl, invited_at: new Date().toISOString() } : i
      ));
    });
  }

  async function handleRevoke(invitationId: string) {
    startTransition(async () => {
      const res = await fetch("/api/team/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId })
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? copy.revokeError);
        return;
      }
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    });
  }

  function handleCopy(joinUrl: string, id: string) {
    void navigator.clipboard.writeText(joinUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-accent/10">
            <Users className="size-4 text-accent" />
          </div>
          <div>
            <p className="text-[13px] font-[550] text-foreground">{copy.title}</p>
            <p className="text-[12px] text-faint">{copy.seatsUsed.replace("{used}", String(usedSeats)).replace("{max}", String(maxSeats))}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: maxSeats }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-6 rounded-full transition-colors ${i < usedSeats ? "bg-accent" : "bg-panel"}`}
            />
          ))}
        </div>
      </div>

      {/* Invite form */}
      {remainingSeats > 0 ? (
        <form onSubmit={handleInvite} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              className="h-9 w-full rounded-[8px] border border-border bg-surface pl-9 pr-3 text-[13px] text-foreground placeholder:text-faint focus:border-accent focus:outline-none"
              disabled={isPending}
              onChange={e => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              required
              type="email"
              value={email}
            />
          </div>
          <Button disabled={isPending || !email} size="sm" type="submit" variant="accent">
            {copy.invite}
          </Button>
        </form>
      ) : (
        <div className="rounded-[10px] border border-border bg-panel px-4 py-3 text-[13px] text-faint">
          {copy.seatLimit.replace("{max}", String(maxSeats))}
        </div>
      )}

      {error ? <p className="text-[12px] text-[var(--danger)]">{error}</p> : null}

      {/* Member list */}
      <div className="space-y-2">
        {invitations.map((inv) => (
          <div key={inv.id} className="rounded-[10px] border border-border bg-panel">
            <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[12px] font-[600] uppercase text-accent">
              {inv.email[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-[500] text-foreground">{inv.email}</p>
              <p className="flex items-center gap-1 text-[11px] text-faint">
                {inv.status === "active" ? (
                  <><Check className="size-3 text-green-500" /> {copy.memberActive}</>
                ) : (
                  <><Clock className="size-3" /> {copy.invitationSent}</>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {inv.status === "pending" ? (
                <>
                  <button
                    className="flex size-7 items-center justify-center rounded-[6px] text-faint transition hover:bg-surface hover:text-foreground disabled:opacity-40"
                    disabled={isPending}
                    onClick={() => handleResend(inv.email)}
                    title={copy.resendTitle}
                    type="button"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                  {inv.joinUrl ? (
                    <button
                      className="flex size-7 items-center justify-center rounded-[6px] text-faint transition hover:bg-surface hover:text-foreground"
                      onClick={() => handleCopy(inv.joinUrl!, inv.id)}
                      title={copy.copyLinkTitle}
                      type="button"
                    >
                      {copiedId === inv.id ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                    </button>
                  ) : null}
                </>
              ) : null}
              <button
                className="flex size-7 items-center justify-center rounded-[6px] text-faint transition hover:bg-surface hover:text-[var(--danger)]"
                onClick={() => handleRevoke(inv.id)}
                title={copy.removeTitle}
                type="button"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
            </div>
            {inv.status === "pending" && inv.joinUrl ? (
              <div className="flex items-center gap-2 border-t border-border px-4 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-faint">{inv.joinUrl}</span>
                <button
                  className="shrink-0 text-[11px] font-[550] text-accent hover:underline"
                  onClick={() => handleCopy(inv.joinUrl!, inv.id)}
                  type="button"
                >
                  {copiedId === inv.id ? copy.copied : copy.copy}
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {invitations.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border px-4 py-6 text-center text-[13px] text-faint">
            {copy.empty}
          </div>
        ) : null}
      </div>
    </div>
  );
}
