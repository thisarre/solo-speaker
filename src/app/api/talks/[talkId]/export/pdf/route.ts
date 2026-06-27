import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { formatDuration, sectionSeconds } from "@/lib/utils";
import { mapTalk, type TalkWithSectionsRow } from "@/modules/talks/mappers";
import { talkTypeLabels } from "@/types/talk";

type ExportPdfRouteProps = {
  params: Promise<{ talkId: string }>;
};

type PdfContext = {
  bold: PDFFont;
  cursorY: number;
  doc: PDFDocument;
  font: PDFFont;
  mono: PDFFont;
  page: PDFPage;
  pageNumber: number;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const pageSize: [number, number] = [595.28, 841.89];
const margin = 54;
const footerY = 32;
const ink = rgb(0.08, 0.08, 0.09);
const muted = rgb(0.38, 0.38, 0.42);
const faint = rgb(0.62, 0.62, 0.66);
const line = rgb(0.86, 0.86, 0.88);

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeFileName(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "talk"
  );
}

function safePdfText(value: string) {
  return value
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\t\n\r -~À-ÿ€ŒœŸŠšŽž]/g, "?");
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const words = safePdfText(text).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function addPage(context: PdfContext) {
  const page = context.doc.addPage(pageSize);
  context.page = page;
  context.cursorY = page.getHeight() - margin;
  context.pageNumber += 1;
  drawFooter(context);
}

function ensureSpace(context: PdfContext, height: number) {
  if (context.cursorY - height < footerY + 26) {
    addPage(context);
  }
}

function drawFooter(context: PdfContext) {
  const width = context.page.getWidth();
  context.page.drawLine({
    start: { x: margin, y: footerY + 16 },
    end: { x: width - margin, y: footerY + 16 },
    thickness: 0.6,
    color: line
  });
  context.page.drawText(`Solo Speaker · ${context.pageNumber}`, {
    x: margin,
    y: footerY,
    size: 8,
    font: context.mono,
    color: faint
  });
}

function drawTextBlock(
  context: PdfContext,
  text: string,
  options: {
    color?: ReturnType<typeof rgb>;
    font?: PDFFont;
    lineHeight?: number;
    maxWidth?: number;
    size: number;
    spacingAfter?: number;
  }
) {
  const font = options.font ?? context.font;
  const lineHeight = options.lineHeight ?? options.size * 1.45;
  const maxWidth = options.maxWidth ?? context.page.getWidth() - margin * 2;
  const paragraphs = safePdfText(text).split(/\n{2,}/);

  for (const paragraph of paragraphs) {
    const lines = wrapText(paragraph, font, options.size, maxWidth);
    ensureSpace(context, lines.length * lineHeight + (options.spacingAfter ?? 0));

    for (const lineText of lines) {
      context.page.drawText(lineText, {
        x: margin,
        y: context.cursorY,
        size: options.size,
        font,
        color: options.color ?? ink
      });
      context.cursorY -= lineHeight;
    }

    context.cursorY -= lineHeight * 0.35;
  }

  context.cursorY -= options.spacingAfter ?? 0;
}

function drawMetaRow(context: PdfContext, label: string, value: string) {
  if (!value.trim()) return;
  ensureSpace(context, 18);
  context.page.drawText(safePdfText(label), {
    x: margin,
    y: context.cursorY,
    size: 9,
    font: context.mono,
    color: faint
  });
  context.page.drawText(safePdfText(value), {
    x: margin + 120,
    y: context.cursorY,
    size: 10,
    font: context.font,
    color: muted
  });
  context.cursorY -= 17;
}

function drawTrialWatermark(doc: PDFDocument, font: PDFFont) {
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText("SOLO SPEAKER · ESSAI", {
      x: width * 0.12,
      y: height * 0.46,
      size: 40,
      font,
      color: rgb(0.82, 0.82, 0.86),
      rotate: degrees(32),
      opacity: 0.4
    });
  }
}

function findBrief(talk: ReturnType<typeof mapTalk>) {
  return talk.sections.find((section) => /^(brief|objectif)/i.test(section.heading.trim()))?.body.trim() ?? "";
}

export async function GET(_request: Request, { params }: ExportPdfRouteProps) {
  const { talkId } = await params;
  if (!uuidPattern.test(talkId)) {
    return jsonError("Talk introuvable.", 404);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Session requise pour exporter ce talk.", 401);
  }

  const { data, error } = await supabase
    .from("talks")
    .select("*, talk_sections(*)")
    .eq("id", talkId)
    .eq("user_id", user.id)
    .order("position", { referencedTable: "talk_sections", ascending: true })
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Talk introuvable.", 404);
  }

  const { data: profile } = await supabase.from("profiles").select("billing_plan").eq("id", user.id).maybeSingle();
  const isTrial = (profile?.billing_plan ?? "trial") === "trial";

  const talk = mapTalk(data as TalkWithSectionsRow);
  const estimatedSeconds = talk.sections.reduce((total, section) => total + sectionSeconds(section.heading, section.body), 0);
  const exportDate = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date());

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const context: PdfContext = {
    bold,
    cursorY: 0,
    doc,
    font,
    mono,
    page: doc.addPage(pageSize),
    pageNumber: 1
  };
  context.cursorY = context.page.getHeight() - margin;
  drawFooter(context);

  drawTextBlock(context, talk.title || "Sans titre", {
    font: bold,
    size: 24,
    lineHeight: 30,
    spacingAfter: 10
  });

  drawMetaRow(context, "Type", talkTypeLabels[talk.type]);
  drawMetaRow(context, "Audience", talk.audience || "Non précisée");
  drawMetaRow(context, "Durée cible", `${talk.durationMinutes} min`);
  drawMetaRow(context, "Durée estimée", formatDuration(estimatedSeconds));
  drawMetaRow(context, "Export", exportDate);

  const brief = findBrief(talk);
  if (brief) {
    context.cursorY -= 10;
    drawTextBlock(context, "Objectif / brief", {
      font: bold,
      size: 12,
      lineHeight: 16,
      spacingAfter: 1
    });
    drawTextBlock(context, brief, {
      color: muted,
      size: 10,
      lineHeight: 15,
      spacingAfter: 12
    });
  }

  context.cursorY -= 12;
  drawTextBlock(context, "Sections", {
    font: bold,
    size: 15,
    lineHeight: 20,
    spacingAfter: 3
  });

  if (!talk.sections.length) {
    drawTextBlock(context, "Aucune section.", {
      color: muted,
      size: 11,
      lineHeight: 16
    });
  }

  for (const [index, section] of talk.sections.entries()) {
    ensureSpace(context, 76);
    context.page.drawLine({
      start: { x: margin, y: context.cursorY + 8 },
      end: { x: context.page.getWidth() - margin, y: context.cursorY + 8 },
      thickness: 0.6,
      color: line
    });
    context.cursorY -= 12;
    drawTextBlock(context, `${index + 1}. ${section.heading || "Sans titre"}`, {
      font: bold,
      size: 13,
      lineHeight: 17,
      spacingAfter: 1
    });
    drawTextBlock(context, section.body || "(section vide)", {
      color: ink,
      size: 10.5,
      lineHeight: 15.5,
      spacingAfter: 8
    });
  }

  if (isTrial) {
    drawTrialWatermark(doc, bold);
  }

  doc.setTitle(talk.title || "Talk");
  doc.setSubject("Solo Speaker Talk Export");
  doc.setCreator("Solo Speaker");
  doc.setProducer("Solo Speaker");
  doc.setCreationDate(new Date());

  const bytes = await doc.save();
  const fileName = `${sanitizeFileName(talk.title)}.pdf`;

  getPostHogClient().capture({
    distinctId: user.id,
    event: "talk_exported_pdf",
    properties: { talk_type: talk.type, section_count: talk.sections.length, estimated_seconds: estimatedSeconds }
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
