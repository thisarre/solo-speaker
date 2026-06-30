# Billing spine — design (sous-projet 1)

**Date :** 2026-06-30
**Statut :** validé (brainstorming) → prêt pour plan d'implémentation
**Périmètre :** colonne vertébrale tarification & facturation. Les features Pro/Team
elles-mêmes (analytics de répétition, versions, multilingue, branding, partage,
bibliothèque partagée) sont **hors périmètre** et feront chacune leur propre spec ;
ce sous-projet pose les **gates serveur** qui les protègeront.

---

## 1. Contexte & objectif

Aujourd'hui : 2 tiers payants (Studio, Team flat), prix Stripe en dur via env vars,
entitlements réduits à `canCreateTalk`, trial à compte à rebours 14 jours.

Objectif : passer à **3 tiers payants** (Studio, Pro, Team par siège), un trial
**usage-based** (5 talks, sans limite de temps), une **source unique d'entitlements**
vérifiée côté serveur, un **stockage d'abonnement** synchronisé par webhooks, des
**caps de coût STT** par plan, et une page pricing à 3 tiers. Pré-lancement : aucune
migration d'abonné payant live.

### Inventaire de départ (vérifié dans le code)

- **Studio (flow complet) — existe** : talks + outline (`talks`/`talk_sections`),
  assistant IA (`src/modules/assistant`, `/api/ai/generate`), téléprompteur
  (`src/modules/speaking-mode`), durée, talks illimités
  (`canCreateTalk` ne limite que le trial), export PDF propre
  (`/api/talks/[talkId]/export/pdf`).
- **Trial — partiellement usage-based déjà** : limite 5 talks active
  (`trialTalkLimit = 5`), watermark PDF (`drawTrialWatermark`, gated `isTrial`),
  crédits IA (`trialAiCredits = 20`). Le compte à rebours 14 j (`trial.ts`) est à retirer.
- **Pro — n'existe pas** : analytics répétition, versions, multilingue, partage public
  réel : tout à construire (specs ultérieurs). Le **branding** d'export est la vraie
  feature Pro ; le **retrait du watermark reste Studio** (« export propre »), inchangé.
- **Team — partiel** : sièges/invitations existent (`teams`, `team_invitations`,
  routes invite/accept/revoke) ; facturation per-siège, bibliothèque partagée : à faire.

---

## 2. Décisions verrouillées

| Sujet | Décision |
|---|---|
| Tiers | Studio 12 €/mois · 99 €/an — Pro 19 €/mois · **159 €/an** — Team 6 €/siège/mois · 49 €/siège/an, **min 3 sièges** |
| Écart mensuel↔annuel | Studio −31 % · Pro −30 % (159) · Team −32 %. *(179 € volontairement écarté pour une bascule Pro plus douce ; on capte un peu moins sur le founder annuel.)* |
| Trial | 5 talks, **sans limite de temps** ; watermark PDF + crédits IA (20) conservés ; retrait du 14 j |
| Entitlements | **Matrice statique en code** (`plan → capacités`) + table **`subscriptions`** pour l'état user |
| Watermark | Inchangé : Trial = watermark ; Studio/Pro/Team = propre. Pro ajoute le **branding** (feature future) |
| Caps STT cloud | Trial **15 min total** (allotissement, ne reset jamais) · Studio 60 · Pro 90 · Team **90 par siège** |
| Base du cap | `trial_total` (trial) vs `billing_period` (payants, calé sur la période Stripe) |
| Métrage STT | Approche **C** (hybride) : réservation au mint + correction en fin de session, via `stt_sessions` |
| Reset payant | Sur `invoice.paid` / `current_period_end` Stripe — **pas le mois calendaire** |
| Stripe prix | **`lookup_keys`** (pas de `price_id` en dur) · metadata `plan` sur chaque produit · Team `licensed` quantity |
| Proration | Activée sur update (Studio→Pro, mensuel→annuel) via `proration_behavior='create_prorations'` |
| Pricing page | 3 tiers payants ; **trial en CTA universel** (hors grille, **« sans carte bancaire »** mis en avant) ; toggle annuel pré-sélectionné ; « économisez X € » ; sélecteur sièges Team min 3 ; framing Team « offre groupe / remise volume » ; badge **« Recommandé » sur Studio** (choix par défaut du visiteur moyen / wedge pasteur ; Pro se vend par ses features, pas par un badge) |
| Migration | Pré-lancement : aucun abonné payant à migrer ; trials restent trial |

---

## 3. Modèle de données

### Table `subscriptions` (source de vérité de l'abonnement, synchro webhooks)
```
subscriptions
  user_id                uuid  UNIQUE  → profiles(id) on delete cascade   -- l'acheteur/owner (= Stripe customer)
  stripe_customer_id     text
  stripe_subscription_id text  UNIQUE
  plan                   text  CHECK ('studio','pro','team')
  cadence                text  CHECK ('monthly','yearly')
  status                 text                                            -- statut Stripe (active, trialing, past_due, canceled…)
  seats                  int   NOT NULL DEFAULT 1                        -- 1 pour Studio/Pro ; ≥3 pour Team
  current_period_start   timestamptz
  current_period_end     timestamptz
  created_at / updated_at
```

### Table `stt_sessions` (source de vérité du métrage STT)
```
stt_sessions
  id                 text  PK            -- id de session/token Deepgram
  user_id            uuid  → profiles(id)
  period_key         text                -- bucket d'imputation (cf. §5)
  reserved_seconds   int                 -- écrit au mint (estimation prudente = TTL token)
  confirmed_seconds  int  NULL           -- écrit en fin de session
  status             text  CHECK ('reserved','confirmed','expired')
  engine             text  CHECK ('cloud','browser')
  created_at / updated_at
  INDEX (user_id, status, created_at)    -- pour le sweep
```

### Table `usage_counters` (agrégat dérivé, lecture rapide au mint)
Reconstructible en sommant `stt_sessions` par `(user_id, period_key)` — chemin de réparation.
```
usage_counters
  user_id                  uuid
  period_key               text
  cloud_reserved_seconds   int  DEFAULT 0
  cloud_confirmed_seconds  int  DEFAULT 0
  browser_seconds          int  DEFAULT 0
  PRIMARY KEY (user_id, period_key)
```

### Modifications existantes
- `profiles.billing_plan` : CHECK `('trial','studio','team')` → `('trial','studio','pro','team')`.
- `teams.max_seats` : synchronisé depuis `subscriptions.seats` (au lieu du défaut 5).
- Org Team : réutilise `teams` (owner = acheteur, membres via `profiles.team_id`). Pas de
  nouvelle notion d'organisation. Studio/Pro restent user-level via `subscriptions.user_id`.

### RLS
- `subscriptions`, `usage_counters` : l'utilisateur lit **sa** ligne ; écritures réservées
  au service-role (webhooks, flux STT serveur).
- `stt_sessions` : pas d'accès client direct (service-role uniquement).

---

## 4. Cœur entitlements (source unique, côté serveur)

Module `src/modules/billing/entitlements.ts` étendu. `BillingPlan = 'trial' | 'studio' | 'pro' | 'team'`.

```ts
type Capability =
  | 'export.branded'        // Pro/Team (future)
  | 'analytics.rehearsal'   // Pro/Team (future)
  | 'talk.versions'         // Pro/Team (future)
  | 'talk.multilingual'     // Pro/Team (future)
  | 'share.public'          // Pro/Team (future)
  | 'team.seats'            // Team
  | 'team.sharedLibrary';   // Team (future)

PLAN_CAPABILITIES: Record<BillingPlan, {
  capabilities: Set<Capability>,
  stt: { minutes: number, basis: 'trial_total' | 'billing_period' },
  talkLimit: number | 'unlimited',
  aiCredits: number | 'unlimited',
}>
//  trial : {}                                stt {15,'trial_total'}     talk 5,  ai 20
//  studio: {}                                stt {60,'billing_period'}  unlimited
//  pro   : +export.branded,analytics,        stt {90,'billing_period'}  unlimited
//          versions,multilingual,share
//  team  : (tout Pro) +team.seats,           stt {90,'billing_period'}  unlimited
//          team.sharedLibrary
```

Fonctions exposées (toutes serveur) :
- `can(plan, capability): boolean` — **le** gate unique ; remplace tout check `plan === '…'` dispersé.
- `sttCapFor(plan): { minutes, basis }`.
- `canCreateTalk(...)` — recâblé sur `talkLimit`.
- `getActivePlan(userId): { plan, sttCapMinutes, sttCapBasis, periodKey }` — résout le plan
  effectif **et** la fenêtre de comptage :
  - **Membre d'org** (`profiles.team_id` set) → `plan='team'`, cap **90 min sur son propre
    `user_id`** (jamais au niveau org) ; `periodKey` dérivé de la période de facturation de
    **l'owner** (les membres n'ont pas de `subscriptions` propre).
  - Trial → `periodKey='trial'` (constant). Studio/Pro/Team owner → `periodKey` dérivé de
    leur `subscriptions.current_period_start`.

**Upsell** : quand `can()` renvoie `false`, l'appelant renvoie une réponse « indisponible sur
votre plan » que l'UI transforme en upsell visible. Le gate est posé même si la feature
derrière n'existe pas encore.

---

## 5. Flux de métrage STT (approche C — hybride)

`period_key` :
- **Trial** → `'trial'` constant. **Ne se réinitialise jamais** : les 15 min sont un
  allotissement sur toute la durée du trial.
- **Payant** → ancre de période Stripe, ex. `sub:{subId}:{period_start_epoch}`. À chaque
  `invoice.paid`, `current_period_end` avance → nouveau `period_key` → compteur repart à zéro.

1. **Mint** `/api/deepgram/token` :
   - `getActivePlan(user)` → lit `usage_counters(user, periodKey)`.
   - Si `cloud_reserved + cloud_confirmed ≥ cap` → **refuse le cloud**, signale au client le
     fallback navigateur, émet `stt_engine_used { engine:'browser', reason:'cap_reached' }`,
     incrémente `browser_seconds` (estimation/à confirmer côté client).
   - Sinon → crée `stt_sessions { status:'reserved', reserved_seconds = TTL }`, incrémente
     `cloud_reserved`, mint le token, émet `stt_engine_used { engine:'cloud' }`.
2. **Fin de session** `POST /api/stt/session { sessionId, confirmed_seconds }` :
   - **Idempotent** : si la session est déjà `confirmed`, no-op.
   - Pose `confirmed_seconds`, `status='confirmed'` ; ajuste l'agrégat :
     `cloud_confirmed += confirmed`, `cloud_reserved -= reserved_seconds` (le réel remplace
     la réservation).
3. **Sessions perdues** (onglet fermé) : cron de **sweep** passe les `reserved` périmées
   (> TTL + marge) en `expired` **en conservant `reserved_seconds` comme charge**
   (conservateur → cap jamais sous-compté, coût protégé).

Le ratio cloud/navigateur PostHog se dérive directement de `stt_engine_used`.

---

## 6. Stripe

**Produits & prix** (metadata `plan` sur chaque produit ; `lookup_key` sur chaque prix) :
```
Studio (plan=studio)  studio_monthly 12€   studio_yearly 99€
Pro    (plan=pro)      pro_monthly   19€    pro_yearly   159€
Team   (plan=team)     team_monthly  6€/siège   team_yearly 49€/siège   (recurring licensed, quantity)
```
- Le checkout **résout le `price_id` au runtime** via
  `GET /v1/prices?lookup_keys[]=…&expand[]=data.product` (cache par cold-start). Plus aucun
  `STRIPE_PRICE_*` en dur.
- **`buildStripeCheckoutPayload` / route checkout** :
  - **Retrait de `subscription_data[trial_period_days]=14`** (trial désormais usage-based).
  - **Team** : `line_items[0][quantity] = seats`, **validation `seats ≥ 3` serveur avant**
    création de session (rejet sinon).
  - `metadata[plan]` issu de la metadata produit.
- **Proration** : Studio→Pro et mensuel→annuel passent par un **update** de la souscription
  existante (`proration_behavior='create_prorations'`) via un endpoint `/api/billing/upgrade` —
  pas un nouveau Checkout. Nouveaux abonnés : Checkout.

---

## 7. Webhooks & synchronisation

`HANDLED_EVENTS` étendu dans `/api/billing/webhook` :
- `customer.subscription.created/updated/deleted` → **upsert `subscriptions`** (plan via
  metadata produit, cadence via interval du prix, status, `seats`=quantity,
  `current_period_start/end`) + maj `profiles.billing_plan`. Team → upsert `teams`,
  `max_seats=seats`. Email de confirmation uniquement sur `created` actif (comportement actuel).
- **`invoice.paid`** (nouveau) → avance `current_period_start/end` → nouveau `period_key`
  (reset du compteur STT pour la période suivante) ; garde `status=active`.
- `subscription.deleted` → `billing_plan='trial'`, `subscriptions.status='canceled'`.

Résolution du plan : depuis la metadata `plan` du **produit** du prix (autorité), avec la
metadata de souscription en redondance.

**`/api/billing/sync`** (existant, étendu) : au retour `?checkout=success`, fetch la
souscription Stripe et écrit la ligne `subscriptions` immédiatement (réconciliation
idempotente avec le webhook) pour que le dashboard reflète l'état avant l'arrivée du webhook.

---

## 8. Migration

- **SQL** : `ALTER profiles … CHECK (+'pro')` ; `CREATE subscriptions, stt_sessions,
  usage_counters` + RLS + index. Aucune mutation de ligne (pré-lancement).
- **Trial** : suppression du compte à rebours 14 j (`src/modules/billing/trial.ts`) et de la
  cron `/api/cron/trial-reminders` (ou repurpose en rappel usage-based). Les trials restent
  trial, limite 5 talks déjà active.
- **Copy** `fr.json` / `en.json` (`pricing`) : 3 tiers + nouveaux chiffres, libellés toggle,
  « économisez X € » (Studio −45 €, Pro −69 €, Team −23 €/siège/an), sélecteur sièges, framing
  Team « offre groupe / remise volume », trial « 5 talks sans limite de temps ».
- **Nouveau cron** : sweep `stt_sessions` `reserved` périmées → `expired`.
- **Env** : retrait des `STRIPE_PRICE_*` ; constantes de `lookup_keys`.

---

## 9. Pricing page UI

- `getPricingCards` : **3 tiers payants** (Studio · Pro · Team) dans la grille `md:grid-cols-3`.
  **Pas de 4ᵉ colonne** pour le trial.
- **Trial = CTA universel hors grille**, au-dessus de la grille :
  **« Commencer l'essai gratuit · 5 talks · sans limite de temps · sans carte bancaire »**
  (optionnellement répété en bande sous la grille). Le trial est **la porte d'entrée vers les
  3 tiers**, pas une option à comparer ; **« sans carte bancaire » mis en avant**.
- **Toggle** mensuel/annuel, **annuel pré-sélectionné** (déjà le cas — `pricing-cards.tsx`).
- **« économisez X € »** par tier en annuel (montants ci-dessus).
- **Sélecteur de sièges Team** : stepper, **min 3**, défaut 3, **avant checkout** ; recalcule
  le prix affiché (`sièges × prix/siège`) et passe `quantity` au checkout.
- **Framing Team** : copy « remise volume / offre groupe » expliquant pourquoi le per-siège
  (6 €) est inférieur à Studio (12 €).
- **Badge « Recommandé »** reste sur **Studio** (choix par défaut du visiteur moyen / wedge
  pasteur ; Pro se vend par ses features, pas par un badge — donc on ne touche pas au
  `highlighted` actuel).

---

## 10. Stratégie de test

**Unit (`node:test`)**
- Matrice entitlements : `can`, `sttCapFor`, `getActivePlan` (incl. membre→team, base
  `trial_total` vs `billing_period`).
- Maths pricing : écart ~30 % par tier, montants « économisez X € ».
- Payload checkout : résolution `lookup_key`, `quantity` Team, **validation min 3**, absence
  de `trial_period_days`.
- Webhook : résolution du plan depuis metadata produit, avance `period_key` sur `invoice.paid`.
- Métrage STT : réserve→confirm **idempotent**, cap atteint → fallback, **trial qui ne reset
  jamais**, sweep **conservateur** (reserved conservé en charge).

**E2E (Playwright, Stripe test mode)**
- Page : 3 tiers rendus, toggle change les prix, économies affichées, sélecteur Team **bloque
  < 3 sièges**, CTA → checkout avec bons paramètres.
- Paiement : checkout → webhook écrit `subscriptions` → dashboard reflète le plan.
- Upgrade Studio→Pro avec **proration**.
- Gates trial : 6ᵉ talk bloqué, watermark sur PDF trial, cap STT atteint → fallback navigateur.

---

## 11. Hors périmètre (specs ultérieurs, derrière les gates posées ici)

2. Analytics de répétition · 3. Versions de talk · 4. Déclinaison multilingue ·
5. Export branded · 6. Partage public + feedback · 7. Bibliothèque partagée Team.

## 12. À surveiller après lancement

- Taux de conversion vers **Pro** (si faible → renforcer l'argumentaire de valeur, **pas**
  baisser le prix).
- Ratio mensuel/annuel et churn.
- Ratio fallback cloud/navigateur par user (PostHog, `stt_engine_used`).
