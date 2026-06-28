const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://solospeaker.com").replace(/\/+$/, "");
const LOGO = `${SITE}/brand/solo-speaker-logo-transparent-cropped.png`;

export type EmailLocale = "fr" | "en";

export function normalizeEmailLocale(value: string | null | undefined): EmailLocale {
  return value === "en" ? "en" : "fr";
}

function cleanName(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/[<>&]/g, "");
}

type LayoutInput = {
  locale: EmailLocale;
  heading: string;
  intro: string;
  bullets?: string[];
  cta?: { label: string; url: string };
  footnote: string;
};

function layout({ locale, heading, intro, bullets, cta, footnote }: LayoutInput): string {
  const signoff = locale === "en" ? "— The Solo Speaker team" : "— L'équipe Solo Speaker";
  const bulletsHtml = bullets?.length
    ? `<tr><td style="padding:14px 32px 0 32px;"><ul style="margin:0;padding-left:20px;color:#17171b;font-size:14.5px;line-height:1.75;">${bullets
        .map((b) => `<li style="margin:0 0 4px 0;">${b}</li>`)
        .join("")}</ul></td></tr>`
    : "";
  const ctaHtml = cta
    ? `<tr><td style="padding:24px 32px 0 32px;"><a href="${cta.url}" style="display:inline-block;background:#6e6cf7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:10px;">${cta.label}</a></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:#fafafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafb;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border:1px solid #e8e8ec;border-radius:16px;">
          <tr><td style="padding:32px 32px 0 32px;">
            <img src="${LOGO}" alt="Solo Speaker" height="30" style="height:30px;display:block;border:0;">
          </td></tr>
          <tr><td style="padding:24px 32px 0 32px;">
            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#17171b;font-weight:700;">${heading}</h1>
          </td></tr>
          <tr><td style="padding:8px 32px 0 32px;">
            <p style="margin:0;font-size:15px;line-height:1.6;color:#6f6f7a;">${intro}</p>
          </td></tr>
          ${bulletsHtml}
          ${ctaHtml}
          <tr><td style="padding:20px 32px 32px 32px;">
            <p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #e8e8ec;font-size:12px;line-height:1.6;color:#a8a8b2;">${footnote}<br>${signoff}</p>
          </td></tr>
        </table>
        <p style="max-width:480px;margin:16px auto 0;font-size:11px;color:#a8a8b2;text-align:center;">Solo Speaker · <a href="${SITE}" style="color:#a8a8b2;">solospeaker.com</a></p>
      </td></tr>
    </table>
  </body>
</html>`;
}

export type RenderedEmail = { subject: string; html: string };

const greet = (locale: EmailLocale, name: string, fr: string, en: string) =>
  name ? (locale === "en" ? `${en} ${name}` : `${fr} ${name}`) : locale === "en" ? en : fr;

/** Sent after onboarding — explains how the product works. */
export function renderWelcomeEmail(input: { name?: string | null; locale?: EmailLocale }): RenderedEmail {
  const locale = input.locale ?? "fr";
  const name = cleanName(input.name);
  if (locale === "en") {
    return {
      subject: "Welcome to Solo Speaker 🎤",
      html: layout({
        locale,
        heading: greet(locale, name, "", "Welcome") + " 👋",
        intro:
          "Solo Speaker turns an idea, a voice memo or a rough draft into a talk that's ready to deliver. Here's how to get the most out of it:",
        bullets: [
          "<strong>1. Create a talk</strong> — start from an idea or a brief, and the AI generates a structured outline.",
          "<strong>2. Work section by section</strong> — rewrite for the spoken word and watch the estimated duration live.",
          "<strong>3. Rehearse on the teleprompter</strong> — auto-scroll plus voice-follow that tracks your speech.",
          "<strong>4. Voice memos & PDF export</strong> — capture ideas by voice, export whenever you want."
        ],
        cta: { label: "Create my first talk", url: `${SITE}/en/talks/new` },
        footnote: "You have a 14-day trial with up to 5 talks. Questions? Just reply to this email."
      })
    };
  }
  return {
    subject: "Bienvenue sur Solo Speaker 🎤",
    html: layout({
      locale,
      heading: greet(locale, name, "Bienvenue", "Welcome") + " 👋",
      intro:
        "Solo Speaker transforme une idée, un mémo vocal ou un brouillon en une prise de parole prête à présenter. Voici comment en tirer le meilleur :",
      bullets: [
        "<strong>1. Crée une prise de parole</strong> — pars d'une idée ou d'un brief, l'IA génère un plan structuré.",
        "<strong>2. Travaille par sections</strong> — réécris à l'oral, et vois la durée estimée en direct.",
        "<strong>3. Répète au prompteur</strong> — défilement automatique et suivi vocal qui suit ta voix.",
        "<strong>4. Mémos vocaux & export PDF</strong> — capture tes idées à la voix, exporte quand tu veux."
      ],
      cta: { label: "Créer ma première prise de parole", url: `${SITE}/fr/talks/new` },
      footnote: "Tu as 14 jours d'essai avec jusqu'à 5 prises de parole. Une question ? Réponds simplement à cet email."
    })
  };
}

/** Sent when a Studio subscription becomes active. */
export function renderStudioConfirmedEmail(input: { name?: string | null; locale?: EmailLocale }): RenderedEmail {
  const locale = input.locale ?? "fr";
  const name = cleanName(input.name);
  if (locale === "en") {
    return {
      subject: "Your Studio subscription is active 🎉",
      html: layout({
        locale,
        heading: greet(locale, name, "", "Welcome to Studio,") + " 🎉",
        intro: "Your Studio subscription is active. Here's everything you unlock:",
        bullets: [
          "<strong>Unlimited</strong> talks",
          "Full AI assistant (outline generation & spoken rewrite)",
          "Voice-follow teleprompter",
          "Voice memos",
          "Global progression",
          "PDF export without watermark",
          "Priority support"
        ],
        cta: { label: "Go to the studio", url: `${SITE}/en/dashboard` },
        footnote: "You can manage or cancel your subscription anytime from your settings."
      })
    };
  }
  return {
    subject: "Ton abonnement Studio est actif 🎉",
    html: layout({
      locale,
      heading: greet(locale, name, "Bienvenue dans Studio,", "") + " 🎉",
      intro: "Ton abonnement Studio est actif. Voici tout ce que tu débloques :",
      bullets: [
        "Prises de parole <strong>illimitées</strong>",
        "Assistant IA complet (génération de plan & réécriture orale)",
        "Prompteur vocal qui suit ta voix",
        "Mémos vocaux",
        "Progression globale",
        "Export PDF sans filigrane",
        "Assistance prioritaire"
      ],
      cta: { label: "Aller au studio", url: `${SITE}/fr/dashboard` },
      footnote: "Tu peux gérer ou résilier ton abonnement à tout moment depuis tes réglages."
    })
  };
}

/** Sent when a Team subscription becomes active. */
export function renderTeamConfirmedEmail(input: { name?: string | null; locale?: EmailLocale }): RenderedEmail {
  const locale = input.locale ?? "fr";
  const name = cleanName(input.name);
  if (locale === "en") {
    return {
      subject: "Your Team subscription is active 🎉",
      html: layout({
        locale,
        heading: greet(locale, name, "", "Welcome to Team,") + " 🎉",
        intro: "Your Team subscription is active. Everything in Studio, plus:",
        bullets: [
          "Up to <strong>5 users</strong>",
          "All Studio features for every member",
          "Shared team space",
          "Onboarding and guidance"
        ],
        cta: { label: "Invite my team", url: `${SITE}/en/settings` },
        footnote: "You can manage members and the subscription anytime from your settings."
      })
    };
  }
  return {
    subject: "Ton abonnement Team est actif 🎉",
    html: layout({
      locale,
      heading: greet(locale, name, "Bienvenue dans Team,", "") + " 🎉",
      intro: "Ton abonnement Team est actif. Tout le plan Studio, et en plus :",
      bullets: [
        "Jusqu'à <strong>5 utilisateurs</strong>",
        "Toutes les fonctionnalités Studio pour chaque membre",
        "Espace d'équipe partagé",
        "Onboarding et accompagnement"
      ],
      cta: { label: "Inviter mon équipe", url: `${SITE}/fr/settings` },
      footnote: "Tu peux gérer les membres et l'abonnement à tout moment depuis tes réglages."
    })
  };
}

/** Sent when a subscription is cancelled / ends. */
export function renderSubscriptionCancelledEmail(input: { name?: string | null; locale?: EmailLocale }): RenderedEmail {
  const locale = input.locale ?? "fr";
  const name = cleanName(input.name);
  if (locale === "en") {
    return {
      subject: "Your Solo Speaker subscription was cancelled",
      html: layout({
        locale,
        heading: greet(locale, name, "", "See you soon,"),
        intro:
          "Your subscription has been cancelled and you're back on the free plan. Your talks stay accessible within the free plan's limits. We'd love to see you back whenever you're ready.",
        cta: { label: "Reactivate a plan", url: `${SITE}/en/pricing` },
        footnote: "Any feedback on what didn't work? Reply to this email — it really helps us improve."
      })
    };
  }
  return {
    subject: "Ton abonnement Solo Speaker a été annulé",
    html: layout({
      locale,
      heading: greet(locale, name, "À bientôt,", ""),
      intro:
        "Ton abonnement a bien été annulé et tu repasses sur l'offre gratuite. Tes prises de parole restent accessibles dans la limite de l'offre gratuite. On serait ravis de te revoir quand tu veux.",
      cta: { label: "Réactiver un abonnement", url: `${SITE}/fr/pricing` },
      footnote: "Un retour à nous faire sur ce qui n'a pas convenu ? Réponds à cet email, ça nous aide beaucoup."
    })
  };
}

/** Sent a few days before the trial ends. */
export function renderTrialReminderEmail(input: { name?: string | null; daysLeft: number; locale?: EmailLocale }): RenderedEmail {
  const locale = input.locale ?? "fr";
  const name = cleanName(input.name);
  const tomorrow = input.daysLeft <= 1;
  if (locale === "en") {
    return {
      subject: tomorrow ? "Your Solo Speaker trial ends tomorrow" : `${input.daysLeft} days left in your Solo Speaker trial`,
      html: layout({
        locale,
        heading: tomorrow ? "Your trial ends tomorrow ⏳" : `${input.daysLeft} days left in your trial ⏳`,
        intro:
          (name ? `${name}, your` : "Your") +
          " free trial ends soon. To keep unlimited talks, the full AI assistant and the voice-follow teleprompter, upgrade to Studio — €12/month or €99/year.",
        cta: { label: "Choose my plan", url: `${SITE}/en/pricing` },
        footnote: "You can stay on the free plan, but you'll be limited to 5 talks."
      })
    };
  }
  return {
    subject: tomorrow ? "Ton essai Solo Speaker se termine demain" : `Plus que ${input.daysLeft} jours d'essai Solo Speaker`,
    html: layout({
      locale,
      heading: tomorrow ? "Ton essai se termine demain ⏳" : `Plus que ${input.daysLeft} jours d'essai ⏳`,
      intro:
        (name ? `${name}, ton` : "Ton") +
        " essai gratuit se termine bientôt. Pour garder tes prises de parole illimitées, l'assistant IA complet et le prompteur vocal, passe à Studio — 12 €/mois ou 99 €/an.",
      cta: { label: "Choisir mon offre", url: `${SITE}/fr/pricing` },
      footnote: "Tu peux continuer en gratuit, mais tu seras limité à 5 prises de parole."
    })
  };
}
