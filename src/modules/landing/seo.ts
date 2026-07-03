import type { Metadata } from "next";
import { getMessages } from "@/i18n/messages";
import { getLocalizedPathAlternates, localizedPath, type Locale } from "@/i18n/routing";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solospeaker.com";

// Explicit og:image list: the file-convention opengraph-image is dropped whenever a
// page supplies its own openGraph object, so every builder must pass images itself.
export const defaultOgImages = [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Solo Speaker Studio" }];

const landingKeywords = [
    "AI speech coach",
    "AI teleprompter",
    "speech preparation software",
    "sermon preparation software",
    "public speaking app",
    "presentation rehearsal tool",
    "AI speech writer"
  ];

export function buildLandingMetadata(locale: Locale): Metadata {
  const messages = getMessages(locale);
  const canonical = localizedPath("/", locale);

  return {
    title: messages.seo.landingTitle,
    description: messages.seo.landingDescription,
    alternates: {
      canonical,
      languages: getLocalizedPathAlternates("/")
    },
    keywords: landingKeywords,
    openGraph: {
      title: messages.seo.landingTitle,
      description: messages.seo.landingDescription,
      siteName: messages.common.appName,
      type: "website",
      url: canonical,
      images: defaultOgImages
    },
    twitter: {
      card: "summary_large_image",
      title: messages.seo.landingTitle,
      description: messages.seo.landingDescription,
      images: defaultOgImages
    }
  };
}

export const landingMetadata = buildLandingMetadata("en");

export const landingFaq: Record<Locale, Array<{ question: string; answer: string }>> = {
  en: [
    {
      question: "What is Solo Speaker Studio?",
      answer: "Solo Speaker Studio is an AI-powered preparation workspace for people who write, rehearse and deliver talks regularly. It helps turn rough ideas into structured talks, improve the wording, rehearse timing and present with a distraction-free teleprompter mode."
    },
    {
      question: "Who is Solo Speaker Studio built for?",
      answer: "Solo Speaker Studio is built for pastors, public speakers, trainers, founders and content creators who need a repeatable workflow for preparing talks, sermons, workshops, pitches and speeches."
    },
    {
      question: "How is Solo Speaker Studio different from Google Docs or Notion?",
      answer: "Google Docs and Notion are general writing tools. Solo Speaker Studio is designed specifically for talks: it uses sections, estimated duration, oral rewriting, voice notes, rehearsal tools, PDF export and teleprompter mode in one workflow."
    },
    {
      question: "Does Solo Speaker Studio include a free trial?",
      answer: "Yes. The free trial includes up to 5 talks with no time limit and no credit card: teleprompter mode, voice notes, limited AI assistance and PDF export with a few limits before upgrading to Studio."
    },
    {
      question: "Can I use Solo Speaker Studio for sermon preparation?",
      answer: "Yes. Pastors can use Solo Speaker Studio to structure sermon ideas, develop sections, rewrite passages to sound natural out loud, estimate duration and rehearse before preaching."
    }
  ],
  fr: [
    {
      question: "Qu’est-ce que Solo Speaker Studio ?",
      answer: "Solo Speaker Studio est un espace de préparation assisté par IA pour les personnes qui écrivent, répètent et présentent régulièrement des prises de parole. Il aide à transformer des idées brutes en interventions structurées, à améliorer le texte, à répéter le minutage et à présenter avec un prompteur épuré, sans distraction."
    },
    {
      question: "Pour qui Solo Speaker Studio est-il conçu ?",
      answer: "Solo Speaker Studio est conçu pour les pasteurs, conférenciers, formateurs, fondateurs et créateurs qui veulent un flux répétable pour préparer sermons, conférences, ateliers, argumentaires et discours."
    },
    {
      question: "Quelle est la différence avec Google Docs ou Notion ?",
      answer: "Google Docs et Notion sont des outils d’écriture généraux. Solo Speaker Studio est pensé pour les prises de parole : sections, durée estimée, réécriture pour l’oral, mémos vocaux, répétition, export PDF et mode prompteur dans un même flux."
    },
    {
      question: "Solo Speaker Studio inclut-il un essai gratuit ?",
      answer: "Oui. L’essai gratuit inclut jusqu’à 5 prises de parole, sans limite de temps et sans carte bancaire : le mode prompteur, les mémos vocaux, l’assistance IA limitée et l’export PDF avec quelques limites avant le passage à Studio."
    },
    {
      question: "Puis-je utiliser Solo Speaker Studio pour préparer un sermon ?",
      answer: "Oui. Les pasteurs peuvent structurer une idée biblique, développer les sections, adapter des passages à l’oral, estimer la durée et répéter avant de prêcher."
    }
  ]
};

export const marketingSitemapEntries = [
  { path: "/", priority: 1 },
  { path: "/pricing", priority: 0.9 },
  { path: "/login", priority: 0.4 },
  { path: "/signup", priority: 0.8 },
  { path: "/use-cases/sermon-preparation", priority: 0.75 },
  { path: "/use-cases/public-speaking", priority: 0.75 },
  { path: "/use-cases/training-presentations", priority: 0.7 },
  { path: "/features/ai-speech-writer", priority: 0.7 },
  { path: "/features/teleprompter-mode", priority: 0.7 },
  { path: "/mentions-legales", priority: 0.2 },
  { path: "/cgv", priority: 0.2 },
  { path: "/confidentialite", priority: 0.2 }
];

export const privateRobotsDisallowRules = [
  "/dashboard",
  "/settings",
  "/talks",
  "/progression",
  "/onboarding",
  "/admin",
  "/account",
  "/api"
];

export function absoluteUrl(path = "/", baseUrl = siteUrl) {
  return new URL(path, baseUrl).toString();
}

export function buildLandingJsonLd(locale: Locale = "en", baseUrl = siteUrl) {
  const messages = getMessages(locale);
  const url = absoluteUrl(localizedPath("/", locale), baseUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: "Solo Speaker Studio",
        url,
        logo: absoluteUrl("/icon-512.png", baseUrl),
        email: "contact@solospeaker.com"
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: "Solo Speaker Studio",
        url,
        publisher: {
          "@id": `${url}#organization`
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        name: "Solo Speaker Studio",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        description: messages.seo.landingDescription,
        featureList: messages.landing.featureList,
        offers: [
          {
            "@type": "Offer",
            name: "Trial",
            price: "0",
            priceCurrency: "EUR",
            description: "Free trial with up to 5 talks, no time limit, no credit card."
          },
          {
            "@type": "Offer",
            name: "Studio",
            price: "12",
            priceCurrency: "EUR",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "12",
              priceCurrency: "EUR",
              unitText: "month"
            }
          }
        ]
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: landingFaq[locale].map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer
          }
        }))
      }
    ]
  };
}
