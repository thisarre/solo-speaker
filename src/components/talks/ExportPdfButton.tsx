"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ExportPdfButtonProps = {
  talkId: string;
  title: string;
};

function fileNameFromTitle(title: string) {
  return `${title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "talk"}.pdf`;
}

export function ExportPdfButton({ talkId, title }: ExportPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function exportPdf() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/talks/${talkId}/export/pdf`, {
        credentials: "same-origin"
      });

      if (!response.ok) {
        let message = "Export PDF impossible.";
        try {
          const payload = (await response.json()) as { error?: string };
          message = payload.error || message;
        } catch {
          // Keep the generic message when the response is not JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileNameFromTitle(title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Export PDF impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button disabled={loading} leftIcon={<Download />} onClick={exportPdf} size="sm" type="button" variant="ghost">
        {loading ? "Export..." : "Exporter PDF"}
      </Button>
      {error ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-20 m-0 w-56 rounded-[8px] border border-[color-mix(in_oklab,var(--danger)_32%,var(--line))] bg-background px-2.5 py-2 text-[12px] leading-5 text-[var(--danger)] shadow-studio">
          {error}
        </p>
      ) : null}
    </div>
  );
}
