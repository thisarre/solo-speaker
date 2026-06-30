# Versions multiples d'une prise de parole — design (feature Pro #1)

**Date :** 2026-06-30
**Statut :** spec en revue — NE PAS lancer writing-plans tant que non validée
**Dépend de :** billing spine (gate `talk.versions` déjà dans la matrice `can()`, voir
`docs/specs/2026-06-30-billing-spine-design.md`).

---

## 1. Objectif

Permettre à un user **Pro/Team** de créer plusieurs **versions** d'une même prise de parole,
typiquement déclinées par **durée cible** (ex. 3 / 10 / 20 min) : une version courte pour un
créneau serré, une longue pour une conférence, etc. Chaque version a ses propres sections,
éditables indépendamment, et son propre minutage estimé. La feature est **gated serveur** sur
`talk.versions` ; un user Studio voit l'entrée mais reçoit « indisponible sur votre plan » + upsell.

**Pré-requis validé (Préalable 1) :** `getActivePlan()` résout les 5 plans correctement ; les gates
existants tiennent ; les 5 gates Pro ne sont pas encore branchés (par design). **Le lot 1 de cette
feature branche le premier `can(plan, "talk.versions")` réel.**

---

## 2. Décision d'architecture — versions = lignes `talks` liées (pas de refonte des sections)

Aujourd'hui **tout est keyé sur `talk_id`** : `talk_sections.talk_id`, l'export PDF, le téléprompteur,
la progression, l'assistant IA. Deux options :

- **A. Une version = une ligne `talks`** avec un lien `source_talk_id` vers l'originale + une
  `target_duration_minutes`. Les sections sont **copiées** dans la nouvelle ligne.
- **B. Table `talk_versions` + `talk_sections.version_id`** (refonte du keying).

→ **Choix : A.** L'option B obligerait à migrer `talk_sections` et à recâbler *tous* les
consommateurs (export, téléprompteur, progression, IA) sur `version_id` — gros blast radius, risqué.
L'option A **réutilise telle quelle** toute la machinerie par-talk : chaque version est un talk de
plein droit (donc exportable, répétable, éditable, scorable sans code en plus). Le **regroupement**
des versions devient une simple préoccupation UI (grouper par `source_talk_id`). YAGNI + faible risque.

### Vocabulaire
- **Source** : la prise de parole d'origine (`source_talk_id = null`).
- **Version / variante** : un talk dont `source_talk_id` pointe vers la source.
- **Groupe** : une source + toutes ses variantes.

---

## 3. Modèle de données

Migration additive sur `talks` (aucune table nouvelle, aucune migration de `talk_sections`) :

```sql
alter table public.talks
  add column if not exists source_talk_id uuid
    references public.talks(id) on delete set null,
  add column if not exists target_duration_minutes integer
    check (target_duration_minutes is null or target_duration_minutes > 0);

-- Retrouver un groupe rapidement (source + variantes) et compter les versions.
create index if not exists talks_source_talk_id_idx on public.talks (source_talk_id);
```

- `source_talk_id` : `null` pour une source ; sinon l'id de la source. `on delete set null` (cf. §6).
- `target_duration_minutes` : la durée visée par la version (ex. 3/10/20). Sur la source, peut rester
  `null` (la source garde son `duration_minutes` actuel) ; sur une variante, elle est définie à la
  création et **alimente aussi `duration_minutes`** de la variante (pour que la progression et le
  téléprompteur estiment le bon écart).
- Pas de `version_label` stocké : le libellé d'UI se dérive de `target_duration_minutes`
  (« 3 min », « 10 min »…). YAGNI ; on pourra ajouter un label libre plus tard.

**Dérivation à la création d'une version** (copie, pas partage) :
1. Vérifier le gate (`can(plan,'talk.versions')`).
2. Insérer une ligne `talks` : héritage de `title`, `type`, `audience`, `language` depuis la source ;
   `source_talk_id = source.id` ; `target_duration_minutes = X` ; `duration_minutes = X` ;
   `status='draft'`.
3. **Copier** les `talk_sections` de la source (heading/body/position) dans la nouvelle ligne
   (snapshot). → éditer la version 10 min ne touche pas la 3 min.

**Décision (héritage vs copie) : COPIE.** Indépendance d'édition par version. Une éventuelle
« régénérer depuis la source » viendra plus tard (cf. §6.3), non incluse au lancement.

---

## 4. Gate serveur

- **Point d'entrée gardé : la CRÉATION d'une version** (server action / route qui dérive une
  variante). Logique : charger `profiles.billing_plan` ; `if (!can(plan, "talk.versions")) →` réponse
  « indisponible sur votre plan » (même forme que les autres refus billing) → l'UI en fait un upsell.
- **Lecture / édition / export / suppression d'une version existante : NON gardés.** Le gate est
  uniquement sur l'acte de *créer* une version. (Cohérent avec « ne pas disperser les vérifications ».)
- Réutilise `can` depuis `@/modules/billing/entitlements`. **C'est le premier appelant réel de
  `can()`** → le lot 1 valide le gate de bout en bout (test : Studio → refus ; Pro/Team → ok).

### Rétrogradation Pro → Studio avec des versions déjà créées

**Décision : conserver + garder éditable, bloquer uniquement la création.**
- Les versions existantes **restent** (aucune perte de données) et **restent éditables/exportables** —
  ce sont des lignes `talks` normales, et Studio a les talks illimités.
- Seule la **création d'une nouvelle version** est refusée (gate) → upsell.
- Pas de mode « lecture seule » : il faudrait garder chaque chemin d'édition (plus de gates, pire UX)
  pour un gain nul. On ne punit pas l'utilisateur pour ce qu'il a déjà produit.

*(Conséquence du choix A : une variante rétrogradée est juste un talk de plus ; rien à verrouiller.)*

---

## 5. Impact UI (sans casser le flow mono-version)

- **Éditeur de talk** : un sélecteur « Versions » (liste source + variantes du groupe, avec leur durée
  cible et leur statut de minutage). Bouton **« Créer une version »** (durée cible au choix : 3/10/20
  ou libre). Pour un non-Pro : bouton visible mais → upsell au clic (le refus vient du serveur).
- **Bascule** entre versions = navigation entre les talks du groupe (réutilise les routes
  `/talks/[talkId]` existantes).
- **Liste des talks** : **grouper les variantes sous leur source** (la source affiche un badge
  « N versions ») au lieu d'éparpiller chaque variante en entrée de premier niveau. Un talk **sans
  variante s'affiche et se comporte exactement comme aujourd'hui** — aucune UI versions visible tant
  qu'il n'y a pas (ou qu'on ne crée pas) de version.
- **Comparaison côte à côte** (le « comparer » évoqué) : **hors lancement (phase 2)**. La v1 livre
  création + bascule + regroupement. La comparaison visuelle 2 colonnes sera un lot ultérieur.

---

## 6. Cas limites

### 6.1 Suppression de la source
`on delete set null` : supprimer la source met `source_talk_id = null` sur les variantes → elles
deviennent des talks indépendants (sources orphelines). **Décision : détacher (set null)**, pas de
cascade (pas de perte de données surprise), pas de blocage. On *peut* afficher un avertissement UI
« cette prise de parole a N versions ; elles seront conservées comme prises de parole indépendantes ».
*(Alternative écartée : promouvoir une variante en source — complexité inutile au lancement.)*

### 6.2 Limite du nombre de versions
**Décision : pas de cap dur au lancement** (Pro/Team = usage sérieux, YAGNI). On **logue** le nombre de
versions par groupe dans PostHog pour détecter un éventuel abus, et on ajoutera un cap soft (ex. 10)
seulement si les données le justifient.

### 6.3 Régénération IA par version vs partagée
Chaque version étant indépendante (sections copiées), la **régénération IA opère par version** : le
`target_duration_minutes` de la variante est passé comme **contrainte au prompt** (réécrire/raccourcir
pour tenir en X min). Pas de régénération partagée « depuis la source vers toutes les versions » au
lancement (phase 2 possible). Les crédits IA restent comptés normalement (illimités Pro/Team).

### 6.4 Cohérence des durées estimées par version
La progression estime déjà les minutes depuis le nombre de mots. Comme chaque version a son propre
`duration_minutes = target`, l'estimation et le statut (« trop court / bon / trop long ») se calculent
**par version** sans code en plus. La source garde sa propre estimation.

### 6.5 Sécurité / ownership
La création d'une version vérifie que la **source appartient au user** (`talks.user_id = user.id`)
avant copie — pas seulement le gate de plan. RLS `talks`/`talk_sections` inchangée (déjà par user).

### 6.6 Saisie libre de durée — borne min/max
La durée cible (preset 3/10/20 **ou** saisie libre) est **bornée à 1–60 min**, côté serveur ET UI :
- Hors `[1, 60]` → rejet (ou clamp) : pas de version « 0 min » (estimation/génération cassée) ni
  « 240 min » (irréaliste, fait dériver le prompt IA et l'estimation). Le `check
  (target_duration_minutes > 0)` de la migration est le filet DB ; la borne haute (60) est appliquée
  au niveau application (validation de l'action `createTalkVersion` + input UI). Bornes en constantes
  `MIN/MAX_VERSION_MINUTES` pour ajustement ultérieur.

### 6.7 Durée cible incohérente avec le contenu source
Une version 3 min dérivée d'un talk source estimé à 30 min (ou l'inverse) :
- **L'IA condense / développe** pour viser la durée cible — c'est l'intérêt même d'une version par
  durée. `target_duration_minutes` passé en contrainte de prompt (§6.3).
- **MAIS on prévient** : si le ratio `cible / durée_estimée_source` est extrême (heuristique : cible
  < ~25 % ou > ~400 % de l'estimation source), l'UI affiche un **avertissement non bloquant**
  (« condensation/expansion importante — relisez le résultat ») avant la copie/génération. Non
  bloquant : l'utilisateur décide. Le statut de minutage par version (§6.4) renforce ensuite le
  signal (« trop court / trop long ») sur la version produite.

---

## 7. Découpage pressenti (pour writing-plans, après validation)

1. **Migration** `source_talk_id` + `target_duration_minutes` + index + regen types. *Done : colonnes
   présentes, types à jour.*
2. **Gate + création de version (serveur)** : action `createTalkVersion(sourceId, targetMinutes)` qui
   gate `can('talk.versions')`, vérifie l'ownership, copie le talk + sections. *Done testable : Studio
   → refus « indisponible » ; Pro/Team → nouvelle ligne talk avec sections copiées + source_talk_id.*
3. **Regroupement liste + sélecteur de versions (UI)** : grouper par source, badge « N versions »,
   switcher dans l'éditeur, bouton créer (upsell non-Pro). *Done : un talk sans version inchangé ;
   un groupe affiche ses variantes.*
4. **Durée cible → IA & progression** : passer `target_duration_minutes` au prompt de réécriture ;
   vérifier l'estimation par version. *Done : régénérer une version 3 min produit un texte plus court.*
5. **Suppression source = détache** + avertissement UI. *Done : supprimer une source laisse les
   variantes en talks indépendants.*
6. **(Phase 2, hors v1)** comparaison côte à côte ; régénération partagée depuis la source.

---

## 8. Points à valider explicitement (décisions prises, à confirmer)

1. **Architecture A** (versions = lignes `talks` liées) plutôt que table `talk_versions`. ✅ recommandé
2. **Copie** des sections (indépendance) plutôt qu'héritage partagé. ✅ recommandé
3. **Rétrogradation** : conserver + éditable, bloquer seulement la création. ✅ recommandé
4. **Suppression source** = détacher les variantes (`set null`). ✅ recommandé
5. **Pas de cap** de versions au lancement (log PostHog). ✅ recommandé
6. **Comparaison côte à côte = phase 2** (pas dans la v1). ✅ recommandé
7. Durées cibles par défaut : **3 / 10 / 20 min** + saisie libre **bornée 1–60 min** (§6.6). ✅ recommandé
8. Durée cible incohérente avec la source : **l'IA condense/développe + avertissement non bloquant**
   si ratio extrême (§6.7). ✅ recommandé

## 9. Hors périmètre
Comparaison visuelle 2 colonnes, régénération « source → toutes les versions », label libre de version,
cap dur — tous renvoyés en phase 2 / backlog. Les 2 failles billing du Préalable 1 (révocation membre
à l'annulation owner ; période `pending`) ne sont **pas** traitées ici.
