#!/usr/bin/env tsx
/**
 * Applies the Solo Speaker branded "Confirm signup" email template to Supabase
 * via the Management API.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL     — already in .env (used to derive project ref)
 *   SUPABASE_MANAGEMENT_API_TOKEN — personal access token from app.supabase.com/account/tokens
 *
 * Usage:
 *   SUPABASE_MANAGEMENT_API_TOKEN=sbp_xxx tsx scripts/apply-email-templates.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const MANAGEMENT_TOKEN = process.env.SUPABASE_MANAGEMENT_API_TOKEN ?? "";

if (!SUPABASE_URL || !MANAGEMENT_TOKEN) {
  console.error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_MANAGEMENT_API_TOKEN are required."
  );
  process.exit(1);
}

// Extract project ref from https://<ref>.supabase.co
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
if (!projectRef || projectRef === "your-project-ref") {
  console.error("NEXT_PUBLIC_SUPABASE_URL does not look like a valid Supabase URL.");
  process.exit(1);
}

const SHELL = (heading: string, body: string, cta: string, footnote: string) => `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
          <tr><td style="padding:32px 32px 0 32px;">
            <img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;">
          </td></tr>
          <tr><td style="padding:24px 32px 0 32px;">
            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">${heading}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 0 32px;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">${body}</p>
          </td></tr>
          <tr><td style="padding:24px 32px 0 32px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">${cta}</a>
          </td></tr>
          <tr><td style="padding:18px 32px 0 32px;">
            <p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
              <a href="{{ .ConfirmationURL }}" style="color:#5957e8;word-break:break-all;">{{ .ConfirmationURL }}</a>
            </p>
          </td></tr>
          <tr><td style="padding:20px 32px 32px 32px;">
            <p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">${footnote}<br>— L'équipe Solo Speaker</p>
          </td></tr>
        </table>
        <p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
      </td></tr>
    </table>
  </body>
</html>`;

const CONFIRM_SIGNUP_HTML = SHELL(
  "Bienvenue sur Solo Speaker 👋",
  "Merci de votre inscription ! Confirmez votre adresse email pour activer votre compte et commencer à préparer vos prises de parole.",
  "Confirmer mon adresse",
  "Vous n'avez pas créé de compte ? Vous pouvez ignorer cet email."
);

const payload = {
  // Sender identity
  smtp_sender_name: "Solo Speaker",
  smtp_admin_email: "contact@solospeaker.com",
  // Confirm signup template
  mailer_subjects_confirmation: "Confirmez votre adresse — Solo Speaker",
  mailer_templates_confirmation_content: CONFIRM_SIGNUP_HTML,
};

const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

console.log(`Applying email templates to project: ${projectRef}`);

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${MANAGEMENT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`API error ${res.status}: ${text}`);
  process.exit(1);
}

console.log("✓ Confirm signup template applied.");
console.log("✓ Sender set to: Solo Speaker <contact@solospeaker.com>");
console.log("");
console.log(
  "Note: SMTP must be configured in Authentication → SMTP Settings for the sender address to take effect."
);
