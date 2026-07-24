# Templates Supabase — versions PRÊTES à copier-coller (rien à modifier)

Dans Supabase → **Authentication → Emails → Templates**.
Pour chaque template : colle le **Subject**, puis colle tout le bloc **HTML** dans « Message body ». Puis **Save**.

> ⚠️ IMPORTANT : les templates 1 à 4 utilisent le lien `.../auth/verify?token_hash=...`
> (flux robuste qui marche même quand le lien est ouvert dans un autre navigateur/app mail).
> Ne remplace PAS ce lien par `{{ .ConfirmationURL }}`. Le template 5 (Invite) garde `{{ .ConfirmationURL }}`.

---

## 1. Reset Password  ⭐ (le plus important)

**Subject :**
```
Réinitialisez votre mot de passe Solo Speaker
```

**Message body :**
```html
<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
<tr><td style="padding:32px 32px 0 32px;"><img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;"></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">Réinitialisez votre mot de passe</h1></td></tr>
<tr><td style="padding:8px 32px 0 32px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans 1 heure.</p></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Choisir un nouveau mot de passe</a></td></tr>
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password" style="color:#5957e8;word-break:break-all;">{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/reset-password</a></p></td></tr>
<tr><td style="padding:20px 32px 32px 32px;"><p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email, votre mot de passe reste inchangé.<br>— L'équipe Solo Speaker</p></td></tr>
</table>
<p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
</td></tr></table></body></html>
```

---

## 2. Confirm signup

**Subject :**
```
Confirmez votre adresse — Solo Speaker
```

**Message body :**
```html
<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
<tr><td style="padding:32px 32px 0 32px;"><img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;"></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">Bienvenue sur Solo Speaker 👋</h1></td></tr>
<tr><td style="padding:8px 32px 0 32px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">Merci de votre inscription ! Confirmez votre adresse email pour activer votre compte et commencer à préparer vos prises de parole.</p></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=signup&amp;next=/dashboard" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Confirmer mon adresse</a></td></tr>
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=signup&amp;next=/dashboard" style="color:#5957e8;word-break:break-all;">{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=signup&amp;next=/dashboard</a></p></td></tr>
<tr><td style="padding:20px 32px 32px 32px;"><p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">Vous n'avez pas créé de compte ? Vous pouvez ignorer cet email.<br>— L'équipe Solo Speaker</p></td></tr>
</table>
<p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
</td></tr></table></body></html>
```

---

## 3. Magic Link

**Subject :**
```
Votre lien de connexion Solo Speaker
```

**Message body :**
```html
<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
<tr><td style="padding:32px 32px 0 32px;"><img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;"></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">Connexion à Solo Speaker</h1></td></tr>
<tr><td style="padding:8px 32px 0 32px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien à usage unique expire rapidement.</p></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=magiclink&amp;next=/dashboard" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Me connecter</a></td></tr>
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=magiclink&amp;next=/dashboard" style="color:#5957e8;word-break:break-all;">{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=magiclink&amp;next=/dashboard</a></p></td></tr>
<tr><td style="padding:20px 32px 32px 32px;"><p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">Vous n'avez pas demandé ce lien ? Ignorez cet email.<br>— L'équipe Solo Speaker</p></td></tr>
</table>
<p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
</td></tr></table></body></html>
```

---

## 4. Change Email Address

**Subject :**
```
Confirmez votre nouvelle adresse — Solo Speaker
```

**Message body :**
```html
<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
<tr><td style="padding:32px 32px 0 32px;"><img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;"></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">Confirmez votre nouvelle adresse</h1></td></tr>
<tr><td style="padding:8px 32px 0 32px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">Confirmez ce changement d'adresse email pour votre compte Solo Speaker.</p></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=email_change&amp;next=/settings" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Confirmer le changement</a></td></tr>
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><a href="{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=email_change&amp;next=/settings" style="color:#5957e8;word-break:break-all;">{{ .SiteURL }}/auth/verify?token_hash={{ .TokenHash }}&amp;type=email_change&amp;next=/settings</a></p></td></tr>
<tr><td style="padding:20px 32px 32px 32px;"><p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">Vous n'êtes pas à l'origine de ce changement ? Contactez-nous à contact@solospeaker.com.<br>— L'équipe Solo Speaker</p></td></tr>
</table>
<p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
</td></tr></table></body></html>
```

---

## 5. Invite user  (garde `{{ .ConfirmationURL }}`)

**Subject :**
```
Vous êtes invité·e sur Solo Speaker
```

**Message body :**
```html
<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;"><tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
<tr><td style="padding:32px 32px 0 32px;"><img src="https://solospeaker.com/brand/solo-speaker-logo-transparent-cropped.png" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;"></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">Rejoignez votre équipe sur Solo Speaker</h1></td></tr>
<tr><td style="padding:8px 32px 0 32px;"><p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">Vous avez été invité·e à rejoindre une équipe sur Solo Speaker. Acceptez l'invitation pour accéder à l'espace partagé.</p></td></tr>
<tr><td style="padding:24px 32px 0 32px;"><a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">Accepter l'invitation</a></td></tr>
<tr><td style="padding:18px 32px 0 32px;"><p style="margin:0;font-size:12.5px;line-height:1.6;color:#a8a8b2;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br><a href="{{ .ConfirmationURL }}" style="color:#5957e8;word-break:break-all;">{{ .ConfirmationURL }}</a></p></td></tr>
<tr><td style="padding:20px 32px 32px 32px;"><p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">Si vous ne connaissez pas l'expéditeur, ignorez cet email.<br>— L'équipe Solo Speaker</p></td></tr>
</table>
<p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="https://solospeaker.com" style="color:#a8a8b2;">solospeaker.com</a></p>
</td></tr></table></body></html>
```
