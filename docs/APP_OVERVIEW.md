# Solo Speaker — Description complète de l'application

> SaaS de préparation de prise de parole assisté par IA. De l'idée jusqu'à la scène :
> génération de plan, réécriture pour l'oral, prompteur qui suit la voix, répétition, analytics.
> Bilingue FR/EN. En production sur **solospeaker.com**.
>
> _Document généré le 2026-07-01 à partir du code réel._

---

## 1. Stack technique

| Couche | Techno |
|---|---|
| Framework | **Next.js 16.2.9** (App Router, output standalone), **React 19.2**, **TypeScript 6** |
| UI / style | **Tailwind CSS v4**, `next-themes` (dark mode), animations **GSAP**, icônes `lucide-react` |
| Backend / DB / Auth | **Supabase** (Postgres + RLS + Auth) via `@supabase/ssr` + `supabase-js` |
| Paiement | **Stripe** (Checkout par `lookup_key`, webhooks, prorations) |
| IA texte | **OpenAI** endpoint `/v1/responses`, modèle `OPENAI_MODEL` (défaut `gpt-5-mini`), sorties JSON strictes |
| STT temps réel | **Deepgram** (WebSocket Realtime, modèle `nova-3`, tokens éphémères) + **Web Speech API** navigateur (fallback gratuit) |
| Transcription mémo | **OpenAI** (`gpt-4o-mini-transcribe`) |
| Synthèse vocale | **ElevenLabs** (`eleven_multilingual_v2`, 6 voix/tons) |
| PDF | `pdf-lib` (export + filigrane gaté) |
| Emails | `nodemailer` (SMTP) |
| Analytics | **PostHog** (`posthog-js` client + `posthog-node` serveur), projet US 482974 |
| Vidéos marketing | **Remotion** (4 compositions FR/EN) |
| Tests | `node:test` via `tsx` (171 tests unit.) + **Playwright** (e2e) |
| i18n | Bilingue **FR/EN**, routing `/[locale]/` (défaut `en`, détection cookie `NEXT_LOCALE` + `Accept-Language`) |
| Déploiement | **Docker** multi-stage → **Hostinger VPS** + **Caddy** (HTTPS auto) via **GitHub Actions** |

---

## 2. Modèle de données (Supabase — 16 migrations)

- **profiles** : `id`, `full_name`, `speaker_role` (pastor/conference_speaker/trainer/founder/speaker), `primary_talk_type` (sermon/conference/training/pitch/speech), `onboarding_*`, `billing_plan` (trial/studio/pro/team), `team_id`, `ai_credits_used`, `trial_reminders_sent`, `locale`.
- **talks** : `title`, `type`, `status` (draft/ready/archived), `audience`, `duration_minutes`, `language` (FR/EN/ES/DE/IT/PT), `source_talk_id` (lien version traduite), `parent_talk_id` (versions), `share_token` (partage public).
- **talk_sections** : `talk_id`, `heading`, `body`, `position`.
- **subscriptions** : `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan`, `cadence`, `seats`, `status`, `current_period_start/end`.
- **teams** : `owner_id`, `name`, `max_seats`. **team_invitations** : `team_id`, `email`, `token`, `status` (pending/active/revoked).
- **rehearsal_sessions** : sessions de répétition (durée réelle vs estimée) pour l'analytics.
- **stt_sessions** + **usage_counters** : compteur de minutes STT cloud (réservé/confirmé) par période de facturation.

Sécurité : RLS activée, hardening des colonnes profil, verrouillage des fonctions, grants explicites (voir migrations `*rls_harden*`, `*function_lockdown*`).

---

## 3. Plans & capacités

### Tarifs (EUR)
| Plan | Mensuel | Annuel | Sièges | Cible |
|---|---|---|---|---|
| **Essai** | Gratuit | Gratuit | — | Découverte (5 prises de parole, 15 min STT total, 20 crédits IA) |
| **Studio** | 12 €/mois | **99 €/an** (~45 € économisés) | 1 | Orateur régulier |
| **Pro** | 19 €/mois | **159 €/an** (~69 € économisés) | 1 | Orateur exigeant |
| **Équipe** | 9 €/siège/mois | **72 €/siège/an** | **min. 5** | Églises, formateurs, groupes |

### Matrice des capacités (`src/modules/billing/capabilities.ts`)
| Capacité | Essai | Studio | Pro | Équipe |
|---|:--:|:--:|:--:|:--:|
| Prises de parole illimitées | ✗ (5) | ✓ | ✓ | ✓ |
| Crédits IA | 20 | ∞ | ∞ | ∞ |
| Minutes STT / période | 15 (total) | 60 | 90 | 90 |
| Prompteur + suivi vocal + mémos | ✓ | ✓ | ✓ | ✓ |
| Export PDF **sans filigrane** (`export.branded`) | ✗ | ✗ | ✓ | ✓ |
| **Analytics de répétition** (`analytics.rehearsal`) | ✗ | ✗ | ✓ | ✓ |
| **Versions de talk** (`talk.versions`) | ✗ | ✗ | ✓ | ✓ |
| **Multilingue / traduction** (`talk.multilingual`) | ✗ | ✗ | ✓ | ✓ |
| **Partage public** (`share.public`) | ✗ | ✗ | ✓ | ✓ |
| **Sièges d'équipe** (`team.seats`) | ✗ | ✗ | ✗ | ✓ |
| **Bibliothèque partagée** (`team.sharedLibrary`) | ✗ | ✗ | ✗ | ✓ |

Gate : `can(plan, capability)`. Différence clé : **Studio = usage illimité** ; **Pro = fonctions avancées** (export propre, analytics, versions, multilingue, partage) ; **Équipe = Pro + collaboration**.

---

## 4. Pages de l'app (authentifiées)

### `/talks` — Liste des prises de parole
Toutes les prises de parole de l'utilisateur, filtre par type, métriques (brouillons/prêtes, minutes totales), cartes avec actions, CTA « Créer ».

### `/talks/new` — Création
Formulaire (titre, type requis, audience, brief). Mode **guidé** (`?guided=1`) : suggestion personnalisée selon le `speaker_role`/`primary_talk_type` du profil. Limite Essai : 5.

### `/talks/[talkId]` — Éditeur (cœur de l'app)
- Édition métadonnées (titre, type, statut, audience, langue, durée 1–180 min)
- **CRUD sections** + réordonnancement (drag & drop), autosave débouncé
- **Panneau assistant IA** (6 actions, aperçu avant insertion — remplacer / insérer dessous)
- Estimateur de durée en direct
- Boutons **Export PDF**, **Partager** (Pro/Team), **Traduire** (Pro/Team), **Répéter** (mode speak)

### `/talks/[talkId]/speak` — Mode prompteur / répétition
Prompteur plein écran : taille de police (32–56px), vitesse (0,25–4×), position de lecture (haut/centre/bas), play/pause + minuteur, navigation par sections, raccourcis clavier. **Suivi vocal** activable (voir §6). Persistance locale des préférences par talk. À la sortie (≥30s), envoi de la session à l'analytics de répétition.

### `/public/talks/[token]` — Vue publique (lecture seule, sans auth)
Rendu en lecture seule d'un talk partagé (titre, type, durée estimée, sections) via `share_token`. 404 si token révoqué.

### `/dashboard` — Tableau de bord
En-tête contextuel, carte du dernier talk actif (continuer / répéter), **Focus Plan** (recommandation « Démarrer / Focus / Répéter » + barre de progression calculée sur la complétude), widgets modulaires réordonnables (localStorage), recommandations d'onboarding (max 3).

### `/progression` — Progression globale
Métriques (minutes préparées, moyenne, prêtes vs brouillons, sections), score de préparation global (jauge), répartitions par statut et par type (camemberts), liste des talks à finir + prêts à répéter, recommandations.

### `/analytics/rehearsal` — Analytics de répétition (**Pro/Team**)
Filtre par talk, cartes stats (temps total, durée moyenne, précision réel vs estimé, nb sessions), graphique barres réel/estimé (20 dernières), timeline des sessions. Sinon écran « verrouillé » avec incitation upgrade.

### `/settings` — Réglages
Réglages Studio (localStorage) : toggles des fonctions IA par type de talk, préférences prompteur (thème, vitesse, police, provider vocal auto/browser/deepgram). Si plan Équipe : gestion des membres, sièges, invitations.

### `/onboarding` — Personnalisation post-inscription
Rôle d'orateur (requis), type de talk principal (requis), demande d'accompagnement (case + note ≤600). Crée un premier talk brouillon localisé, envoie l'email de bienvenue.

### Auth : `/login`, `/signup`, `/forgot-password`, `/reset-password`
Google OAuth **et** email/mot de passe. Politique mot de passe (≥8, lettres+chiffres, pas de commun/dérivé de l'email). Auto-acceptation d'invitation d'équipe. Cookies « tokens-only », flush différé (fix persistance session live).

### `/join?token=` — Rejoindre une équipe (lien explicite)

---

## 5. Fonctionnalités IA (assistant de rédaction)

Route `POST /api/ai/generate` (auth cookie ou Bearer, rate-limit IP+user, gate crédits en Essai). Provider OpenAI, sortie JSON validée par schéma. Actions :

| Action | Effet | Dispo |
|---|---|---|
| `outline` | Génère un plan (sections heading+body) depuis idée/audience/mémo | toutes (1 crédit en Essai) |
| `expand-section` | Développe une section | toutes (1 crédit) |
| `oralize-section` | Rend une section naturelle à l'oral | toutes (1 crédit) |
| `shorten-section` | Raccourcit (~60% des mots) | toutes (1 crédit) |
| `predict-next` | Suggestion prédictive 1–2 phrases | toutes — **toujours gratuit** |
| `suggest-bible` | Suggestion de passage biblique | **sermon uniquement** (1 crédit) |

Prompts bilingues, adaptés au type de talk. Instrumentation PostHog (`$ai_generation` : tokens, modèle, latence, type/langue).

### Autres routes IA / voix
- `POST /api/talks/[talkId]/translate` — **multilingue (Pro/Team)** : traduit titre+sections, crée un **nouveau talk** lié via `source_talk_id`.
- `POST /api/ai/transcribe` — transcription des **mémos vocaux** (OpenAI, ≤25 Mo).
- `POST /api/ai/speak` — **simulateur vocal** (ElevenLabs, 6 tons) pour s'entendre lire.
- `GET /api/talks/[talkId]/export/pdf` — export PDF (filigrane « SOLO SPEAKER » si pas `export.branded`).
- `POST/DELETE /api/talks/[talkId]/share` — génère/révoque le `share_token` (**Pro/Team**).

---

## 6. Mode prompteur & suivi vocal (différenciateur produit)

- **Auto-scroll** : 32 px/s × vitesse, accumulation sous-pixel, ancre de lecture réglable. (toutes offres)
- **Suivi vocal** (opt-in) : le prompteur défile selon ce que dit l'orateur.
  - **2 moteurs** : Web Speech API navigateur (gratuit, illimité, fallback) et **Deepgram** cloud (basse latence, meté). Mode « auto » bascule sur navigateur si quota Deepgram atteint ou pas de delta.
  - **Matching flou** transcript ↔ sections, verrouillage à ≥58% de confiance, « following » ≥78%, scroll dès 60%, **forward-only** (anti-oscillation), retour au « voice-pace » si perte >2,5s.
  - **Détection d'activité vocale** dérivée de la fraîcheur du transcript (pas de flux micro séparé).
- **Métrage STT** : réservation à l'ouverture (durée estimée), confirmation à l'arrêt (`sendBeacon`), balayage cron des sessions orphelines. Caps : Essai 15 min total, Studio 60, Pro/Team 90 par période (reset au `invoice.paid`).

---

## 7. Billing & équipe

- **Checkout** (`/api/billing/checkout`) : résout `lookup_key` (`{plan}_{cadence}`) → `price_id` Stripe, quantité = sièges (Équipe ≥5). Redirige vers signup si non connecté. Event `checkout_started`.
- **Webhooks** (`/api/billing/webhook`) : `subscription.created/updated/deleted`, `invoice.paid`. Le plan dérive de `price.metadata.plan`. À l'annulation de l'owner → **révocation** des entitlements de tous les membres (retour `trial`). `invoice.paid` fait tourner la période (reset STT).
- **Sync** post-checkout (`/api/billing/sync`), **upgrade** en place Studio↔Pro / mensuel↔annuel avec prorations.
- **Équipe** : invitation par email (Stripe invite ou magic-link fallback), acceptation auto à la connexion ou via `/join?token=`, révocation, `max_seats` synchronisé depuis Stripe.
- **Plan actif** (`getActivePlan`) : les membres héritent de la période de facturation de l'owner (fenêtre STT partagée).

---

## 8. Site marketing & SEO

- **Landing** (`src/modules/landing/`) : hero → vidéos démo → problème → solution (3 cartes workflow) → features → cas d'usage (4) → comparatif (Docs/Notion/prompteurs) → mot du fondateur → aperçu pricing → FAQ → footer. CTA trackés PostHog.
- **Pages SEO** : `/features/ai-speech-writer`, `/features/teleprompter-mode`, `/use-cases/{sermon-preparation,public-speaking,training-presentations}` (contenu localisé).
- **SEO technique** : sitemap (12 URLs priorisées), JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage, Offers), robots (blocage des routes privées), OG/Twitter localisés.
- **Légal** : `/cgv`, `/confidentialite` (RGPD, sous-traitants listés), `/mentions-legales` — _templates « à faire valider »_.
- **Vidéos Remotion** : `ClarityWorkflow` (notes → plan) et `ProductFlow` (plan → prompteur), FR+EN, 1920×1080, affichées sur la landing.

---

## 9. Croissance & automatisations (infra agents)

- **PostHog** : events client (CTA landing, funnel) + serveur (`$ai_generation`), identification utilisateur, funnel `checkout_started`/`checkout_completed`.
- **Monitoring** : `/api/health` (public, ping DB), `/api/cron/health-report` (8 sondes synthétiques + erreurs JS PostHog → email + Slack `#analytics`, cron 07:00 UTC), `browser-monitoring.yml` (Playwright e2e quotidien sur la prod).
- **Slack multi-agents** (`/api/slack/events` + `interactivity`) : routeur langage naturel → workflows GitHub Actions (dev fix, feature via Marketing+PO, marketing analytics, infra deploy/rollback/logs). Boutons Slack QA-gated (Merger / Rejeter). Allowlist owner.
- **Telegram** (`/api/telegram/webhook`) : coder depuis le téléphone (`/code`, `/merge #N`, `/status`), owner-only.
- **Routine LinkedIn** (`linkedin-marketing.yml`, hebdo lundi) : 4 posts brouillons + briefs Canva depuis les PR/commits récents → Slack `#marketing`.

### GitHub Actions
`deploy.yml` (push main → VPS + injection des env), `slack-code.yml` / `telegram-code.yml` (Claude Code headless, `--model claude-sonnet-4-6`, ouverture de PR), `refine.yml` (Marketing+PO), `qa-review.yml` (validation adversariale + verdict LGTM/CONCERNS/BLOCK), `marketing.yml`, `browser-monitoring.yml`, `linkedin-marketing.yml`. Agents CI authentifiés via `CLAUDE_CODE_OAUTH_TOKEN` (abonnement).

---

## 10. Déploiement

- **Docker** multi-stage (deps → builder standalone → runner Node 22 non-root) + **docker-compose** (service `web` + `caddy` reverse-proxy HTTPS Let's Encrypt, certs persistés).
- **GitHub Actions `deploy.yml`** : à chaque push sur `main`, écrit le `.env` sur le VPS Hostinger et rebuild les conteneurs.
- Variables : publiques `NEXT_PUBLIC_*` (site, Supabase, Stripe, PostHog, Deepgram) inlinées au build ; secrets runtime (service role, OpenAI, Stripe, Deepgram, ElevenLabs, SMTP, cron, Slack, Telegram, rate limits).

---

## 11. Sécurité (points ouverts connus)
- **Rate-limiting IA** configurable mais à durcir/activer sur toutes les routes IA.
- Templates légaux à faire valider juridiquement.
- Quelques migrations historiques posées à la main (léger décalage possible avec l'historique prod).
