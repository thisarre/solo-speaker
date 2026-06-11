// proto-data.jsx — seed talks, canned AI content, helpers
const uid = () => Math.random().toString(36).slice(2, 9);

const TALK_TYPES = ["Sermon", "Conférence", "Training", "Pitch", "Speech"];
const DURATIONS = [5, 10, 18, 25, 45];

const SEED_TALKS = [
  {
    id: "t-capter", title: "L'art de capter une salle en 90 secondes", type: "Conférence",
    status: "draft", audience: "Managers · ~80 pers.", duration: 18, lang: "FR", updated: "il y a 2 h",
    sections: [
      { id: "s1", heading: "Accroche", body: "Quatre-vingt-dix secondes. Ne dites pas bonjour. Ne vous présentez pas. Regardez la salle, comptez trois secondes de silence [pause 3 s] et posez la seule question qui les concerne tous : « Combien de présentations avez-vous oubliées cette semaine ? »" },
      { id: "s2", heading: "Le problème", body: "C'est le temps dont vous disposez avant que la salle ne décide si elle vous écoute — ou si elle retourne à ses notifications. La plupart des intervenants brûlent ce capital en remerciements et en sommaire. Ils annoncent le plan au lieu de créer le manque. Et une salle qui sait déjà où vous allez n'a plus aucune raison de vous suivre." },
      { id: "s3", heading: "L'histoire de Marc", body: "Posez la question avant de donner la réponse. Laissez le silence travailler pour vous [pause] puis racontez Marc, ce formateur qui ouvrait chaque session par une minute de silence complet. Soixante secondes, montre en main, face à quarante personnes. Personne ne sortait son téléphone. Le silence était devenu son accroche. Ce que Marc avait compris, c'est que l'attention ne se demande pas : elle se crée par la rupture." },
      { id: "s4", heading: "La méthode 90 s", body: "Trois temps. D'abord la rupture : un silence, une question, un chiffre qui dérange. Ensuite l'enjeu : pourquoi ces dix-huit minutes vont leur faire gagner quelque chose de concret. Enfin la promesse : une seule phrase, formulée comme un engagement. Si vous ne pouvez pas la dire en une phrase, vous n'êtes pas prêt à monter sur scène." },
      { id: "s5", heading: "Objections", body: "« Mon sujet est trop technique. » Non — plus le sujet est technique, plus la rupture initiale est nécessaire. « Je ne suis pas à l'aise avec le silence. » C'est précisément pour ça qu'il fonctionne : votre inconfort est le prix de leur attention. Personne dans la salle ne sait combien de temps vous aviez prévu de vous taire." },
      { id: "s6", heading: "Appel à l'action", body: "Votre prochaine prise de parole est dans votre agenda. Ouvrez-la. Supprimez la première diapositive. Remplacez-la par une question — une seule. Quatre-vingt-dix secondes, c'est tout ce qu'on vous demande. Le reste suivra." },
    ],
  },
  {
    id: "t-commencements", title: "La force des commencements discrets", type: "Sermon",
    status: "ready", audience: "Assemblée du dimanche", duration: 25, lang: "FR", updated: "il y a 2 j",
    sections: [
      { id: "c1", heading: "Ouverture", body: "Personne ne plante un chêne en espérant de l'ombre pour le soir même. Et pourtant nous voudrions que nos vies portent du fruit dès la semaine où nous semons." },
      { id: "c2", heading: "Le texte", body: "« Ne méprise pas les petits commencements. » Le verset ne dit pas que les commencements sont petits par accident — il dit qu'ils le sont par dessein." },
      { id: "c3", heading: "Trois exemples", body: "Une graine de moutarde. Un peu de levain. Une source qui devient fleuve. Toujours la même grammaire : l'invisible d'abord, l'évidence ensuite." },
      { id: "c4", heading: "Application", body: "Quel est votre commencement discret cette semaine ? Une conversation évitée depuis des mois. Dix minutes de silence le matin. Un pardon commencé, même maladroitement." },
      { id: "c5", heading: "Envoi", body: "Sortez d'ici sans chercher l'applaudissement. Cherchez la racine. L'ombre viendra — pour quelqu'un d'autre, peut-être. C'est exactement ça, la promesse." },
    ],
  },
  {
    id: "t-seed", title: "Solo Speaker — seed round", type: "Pitch",
    status: "draft", audience: "Investisseurs early-stage", duration: 5, lang: "FR", updated: "il y a 5 j",
    sections: [
      { id: "p1", heading: "Le problème", body: "Trente millions de personnes parlent en public chaque semaine — pasteurs, formateurs, dirigeants. Leurs outils : un document Word et une prière." },
      { id: "p2", heading: "La solution", body: "" },
    ],
  },
  {
    id: "t-onboard", title: "Onboarder sans réunionite", type: "Training",
    status: "ready", audience: "Équipes RH", duration: 45, lang: "FR", updated: "il y a 1 sem",
    sections: [
      { id: "o1", heading: "Cadrage", body: "Objectif de la session : remplacer six réunions d'onboarding par deux rituels et un document vivant." },
      { id: "o2", heading: "Le coût caché", body: "Un nouvel arrivant assiste en moyenne à onze réunions sa première semaine. Combien sont utiles ? Posez-lui la question au jour 30 : il s'en souvient de deux." },
      { id: "o3", heading: "Atelier", body: "Par binômes : listez vos réunions d'onboarding actuelles, classez-les en « rituel », « information », « rassurance ». Tout ce qui est « information » devient un document." },
    ],
  },
];

/* ---- Canned AI: outlines per talk type ---- */
const AI_OUTLINES = {
  "Sermon": [["Ouverture", "Une image concrète qui rejoint le quotidien de l'assemblée avant tout verset."], ["Le texte", "Lecture du passage central, replacé dans son contexte en deux phrases."], ["Développement", "Le mouvement du texte en trois temps, chacun ancré dans une situation actuelle."], ["Application", "Une question directe posée à l'assemblée, déclinée pour la semaine qui vient."], ["Envoi", "Une phrase de bénédiction qui reprend l'image d'ouverture."]],
  "Conférence": [["Accroche", "Un silence, puis une question qui concerne chaque personne dans la salle."], ["L'enjeu", "Pourquoi ce sujet, pourquoi maintenant — le coût de l'inaction, chiffré."], ["L'idée centrale", "Votre thèse en une phrase, défendue par un exemple vécu."], ["La méthode", "Trois étapes actionnables, illustrées chacune par un cas concret."], ["Objections", "Les deux résistances les plus fréquentes, traitées frontalement."], ["Appel à l'action", "Une seule action, faisable cette semaine, formulée comme un engagement."]],
  "Training": [["Cadrage", "Objectif de la session et ce que les participants sauront faire en sortant."], ["Diagnostic", "Exercice court : où en est chacun aujourd'hui sur ce sujet."], ["Apport", "Le cadre théorique minimal — pas plus de trois concepts."], ["Atelier", "Mise en pratique par binômes sur un cas réel des participants."], ["Restitution", "Chaque binôme partage un apprentissage, vous synthétisez."], ["Plan d'action", "Chacun repart avec un engagement daté."]],
  "Pitch": [["Le problème", "La douleur, incarnée par une personne réelle, en trente secondes."], ["La solution", "Ce que fait le produit, démontré, pas décrit."], ["Le marché", "La taille de l'opportunité et pourquoi le timing est maintenant."], ["La traction", "Les chiffres qui prouvent que ça marche déjà."], ["L'équipe", "Pourquoi vous êtes les seuls à pouvoir gagner ce marché."], ["La demande", "Le montant, l'usage des fonds, le rendez-vous suivant."]],
  "Speech": [["Ouverture", "Une anecdote personnelle qui installe le ton en trois phrases."], ["Le fil", "L'idée unique du discours, énoncée simplement."], ["Le cœur", "Deux histoires qui incarnent cette idée, en miroir."], ["La chute", "Retour à l'anecdote d'ouverture, éclairée différemment."]],
};

const AI_EXPANSIONS = [
  "Ajoutez ici un exemple vécu : une date, un lieu, un prénom. La salle retient les histoires, pas les arguments. Puis reformulez l'idée en une phrase que quelqu'un pourrait répéter à la machine à café.",
  "Marquez une respiration [pause 2 s] avant la phrase clé. Donnez ensuite le contre-exemple : ce qui se passe quand on fait l'inverse — et laissez la comparaison faire le travail.",
  "Chiffrez l'enjeu : un nombre simple, arrondi, mémorisable. Puis ramenez-le à l'échelle d'une personne dans la salle : « pour vous, ça représente… »",
];

/* ---- helpers ---- */
const WPS = 2.33; // ~140 mots/min
function wordCount(t) { return (t || "").trim() ? t.trim().split(/\s+/).length : 0; }
function secDuration(s) { return Math.round((wordCount(s.heading) + wordCount(s.body)) / WPS) + 8; }
function fmt(sec) { const m = Math.floor(sec / 60), s = Math.round(sec % 60); return m + ":" + String(s).padStart(2, "0"); }
function talkDuration(t) { return t.sections.reduce((a, s) => a + secDuration(s), 0); }
function talkProgress(t) { const f = t.sections.filter((s) => wordCount(s.body) > 12).length; return { done: f, total: t.sections.length }; }

/* cue renderer: highlights [pause …] markers */
function renderCues(text) {
  const parts = String(text).split(/(\[[^\]]+\])/g);
  return parts.map((p, i) => /^\[[^\]]+\]$/.test(p) ? <span key={i} className="cue">{p}</span> : p);
}

Object.assign(window, { uid, TALK_TYPES, DURATIONS, SEED_TALKS, AI_OUTLINES, AI_EXPANSIONS, wordCount, secDuration, fmt, talkDuration, talkProgress, renderCues });
