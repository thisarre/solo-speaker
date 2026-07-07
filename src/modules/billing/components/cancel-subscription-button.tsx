"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

type Props = {
  isWithin14Days: boolean;
  periodEnd: string | null;
};

export function CancelSubscriptionButton({ isWithin14Days, periodEnd }: Props) {
  const { messages, locale } = useI18n();
  const router = useRouter();
  const copy = messages.billing;
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endDate = periodEnd
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "long" }).format(
        new Date(periodEnd)
      )
    : null;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Unknown error");
      }
      setShowModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const modalBody = isWithin14Days
    ? copy.cancelModalBodyImmediate
    : copy.cancelModalBodyScheduled.replace("{date}", endDate ?? "");

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        type="button"
        variant="ghost"
        size="sm"
        className="border-[color-mix(in_oklab,var(--danger)_30%,var(--border))] text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_6%,transparent)]"
      >
        {copy.cancelButton}
      </Button>

      {showModal ? (
        <ConfirmDialog
          body={modalBody}
          cancelLabel={copy.cancelModalAbort}
          title={copy.cancelModalTitle}
          onClose={() => {
            if (!loading) setShowModal(false);
          }}
          confirm={
            <Button
              onClick={handleConfirm}
              type="button"
              variant="ghost"
              disabled={loading}
              className="border-[color-mix(in_oklab,var(--danger)_30%,var(--border))] text-[var(--danger)] hover:bg-[color-mix(in_oklab,var(--danger)_6%,transparent)]"
            >
              {loading ? copy.canceling : copy.cancelModalConfirm}
            </Button>
          }
        />
      ) : null}

      {error ? <p className="mt-2 text-[12.5px] text-[var(--danger)]">{error}</p> : null}
    </>
  );
}
