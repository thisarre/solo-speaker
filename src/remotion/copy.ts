export type Lang = "fr" | "en";

export const clarityCopy = {
  fr: {
    eyebrow: "PRÉPARATION",
    title: "Vos notes deviennent un plan",
    items: [
      { label: "Ouverture", note: "« et si on commençait par une image ? »" },
      { label: "Idée", note: "le seul message à retenir" },
      { label: "Preuve", note: "un chiffre qui marque les esprits" },
      { label: "Appel", note: "ce qu’ils doivent faire ensuite" }
    ]
  },
  en: {
    eyebrow: "PREPARATION",
    title: "Your notes become an outline",
    items: [
      { label: "Opening", note: "“what if we open with an image?”" },
      { label: "Idea", note: "the one message to remember" },
      { label: "Proof", note: "a number that lands" },
      { label: "Call", note: "what they should do next" }
    ]
  }
} as const;

export const flowCopy = {
  fr: {
    eyebrow: "DU PLAN AU PROMPTEUR",
    title: "Le prompteur suit votre voix",
    planLabel: "Votre plan",
    outline: ["Ouverture", "Idée", "Preuve", "Appel"],
    lines: [
      "Bonjour à tous, merci d’être là.",
      "Aujourd’hui, une seule idée à retenir.",
      "Votre message mérite d’être entendu.",
      "Tout commence par une vraie préparation."
    ]
  },
  en: {
    eyebrow: "FROM OUTLINE TO TELEPROMPTER",
    title: "The teleprompter follows your voice",
    planLabel: "Your outline",
    outline: ["Opening", "Idea", "Proof", "Call"],
    lines: [
      "Hello everyone, thanks for being here.",
      "Today, just one idea to remember.",
      "Your message deserves to be heard.",
      "It all starts with real preparation."
    ]
  }
} as const;
