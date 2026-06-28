import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  if (!cached) {
    const port = Number(process.env.SMTP_PORT?.trim() || 465);
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user, pass }
    });
  }
  return cached;
}

/**
 * Best-effort transactional email. Never throws and never blocks a core flow
 * (signup, Stripe webhook, cron): if SMTP isn't configured or the send fails,
 * it logs and returns { sent: false }.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ sent: boolean }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP not configured — skipping send to", to);
    return { sent: false };
  }

  const fromEmail = process.env.EMAIL_FROM?.trim() || process.env.SMTP_USER!.trim();
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "Solo Speaker";

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html
    });
    return { sent: true };
  } catch (error) {
    console.error("[email] send failed:", error instanceof Error ? error.message : error);
    return { sent: false };
  }
}
