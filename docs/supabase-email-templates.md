# Supabase Auth — branded email templates (Solo Speaker)

Paste these into **Supabase Dashboard → Authentication → Email Templates**.
Each section gives the **Subject** and the **Message body (HTML)** to paste for that template type.

Brand tokens used: accent `#6e6cf7`, accent-ink `#5957e8`, ink `#17171b`, muted `#6f6f7a`,
faint `#a8a8b2`, border `#e8e8ec`, bg `#fafafb`. Logo:
`https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png`.

Supabase variables available: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .SiteURL }}`, `{{ .Email }}`.

Also set, under **Authentication → SMTP Settings**:
- **Sender email**: `contact@solospeaker.com`
- **Sender name**: `Solo Speaker`  ← fixes the "Supabase Auth" sender

---

## Shared shell

Every template below uses the same shell — only the heading, paragraph, button label and
footnote change (marked `‹HEADING›`, `‹BODY›`, `‹CTA›`, `‹FOOTNOTE›`).

```html
<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
          <tr><td style="padding:32px 32px 0 32px;">
            <img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;">
          </td></tr>
          <tr><td style="padding:24px 32px 0 32px;">
            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">‹HEADING›</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 0 32px;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">‹BODY›</p>
          </td></tr>
          <tr><td style="padding:24px 32px 0 32px;">
            <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">‹CTA›</a>
          </td></tr>
          <tr><td style="padding:18px 32px 0 32px;">
            <p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
              <a href="{{ .ConfirmationURL }}" style="color:#5957e8;word-break:break-all;">{{ .ConfirmationURL }}</a>
            </p>
          </td></tr>
          <tr><td style="padding:20px 32px 32px 32px;">
            <p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">‹FOOTNOTE›<br>— L'équipe Solo Speaker</p>
          </td></tr>
        </table>
        <p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
      </td></tr>
    </table>
  </body>
</html>
```

---

## 1. Reset password (Recovery)
**Subject:** `Réinitialisez votre mot de passe Solo Speaker`
- ‹HEADING› → `Réinitialisez votre mot de passe`
- ‹BODY› → `Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans 1 heure.`
- ‹CTA› → `Choisir un nouveau mot de passe`
- ‹FOOTNOTE› → `Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, votre mot de passe reste inchangé.`

## 2. Confirm signup
**Subject:** `Confirmez votre adresse — Solo Speaker`
- ‹HEADING› → `Bienvenue sur Solo Speaker 👋`
- ‹BODY› → `Merci de votre inscription ! Confirmez votre adresse email pour activer votre compte et commencer à préparer vos prises de parole.`
- ‹CTA› → `Confirmer mon adresse`
- ‹FOOTNOTE› → `Vous n'avez pas créé de compte ? Vous pouvez ignorer cet email.`

## 3. Magic Link
**Subject:** `Votre lien de connexion Solo Speaker`
- ‹HEADING› → `Connexion à Solo Speaker`
- ‹BODY› → `Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien à usage unique expire rapidement.`
- ‹CTA› → `Me connecter`
- ‹FOOTNOTE› → `Vous n'avez pas demandé ce lien ? Ignorez cet email.`

## 4. Invite user (team)
**Subject:** `Vous êtes invité·e sur Solo Speaker`
- ‹HEADING› → `Rejoignez votre équipe sur Solo Speaker`
- ‹BODY› → `Vous avez été invité·e à rejoindre une équipe sur Solo Speaker. Acceptez l'invitation pour accéder à l'espace partagé.`
- ‹CTA› → `Accepter l'invitation`
- ‹FOOTNOTE› → `Si vous ne connaissez pas l'expéditeur, ignorez cet email.`

## 5. Change email address
**Subject:** `Confirmez votre nouvelle adresse — Solo Speaker`
- ‹HEADING› → `Confirmez votre nouvelle adresse`
- ‹BODY› → `Confirmez ce changement d'adresse email pour votre compte Solo Speaker.`
- ‹CTA› → `Confirmer le changement`
- ‹FOOTNOTE› → `Vous n'êtes pas à l'origine de ce changement ? Contactez-nous immédiatement à contact@solospeaker.com.`
</content>
