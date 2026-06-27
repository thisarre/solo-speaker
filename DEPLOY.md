# Déploiement — Hostinger VPS (Docker)

Chaque `git push` sur `main` déclenche `.github/workflows/deploy.yml`, qui utilise
l'action officielle `hostinger/deploy-on-vps@v2` pour construire et lancer le
`docker-compose.yml` sur ton VPS (app Next.js + Caddy en HTTPS auto).

## Prérequis (une seule fois)

1. **VPS Hostinger** avec le template **Docker** (Docker + Compose installés), et son **VM ID**.
2. **Clé API Hostinger** : hPanel → Profil → API. ⚠️ Ne la mets nulle part dans le repo.
3. **DNS de `solospeaker.com`** : un enregistrement **A** (et `www` en CNAME ou A) pointant vers **l'IP du VPS**.
   Caddy ne peut émettre le certificat HTTPS qu'une fois le DNS propagé.
4. **Ports 80 et 443 libres** sur le VPS (pas d'autre reverse-proxy qui les occupe).

## Secrets GitHub (Settings → Secrets and variables → Actions → **Secrets**)

Valeurs sensibles uniquement :

```
HOSTINGER_API_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
DEEPGRAM_API_KEY
ELEVENLABS_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

## Variables GitHub (même écran → onglet **Variables**)

Valeurs non sensibles :

```
HOSTINGER_VM_ID
DOMAIN=solospeaker.com
ACME_EMAIL=ton-email@exemple.com
NEXT_PUBLIC_SITE_URL=https://solospeaker.com
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_DEEPGRAM_MODEL=nova-3
SUPABASE_ADMIN_SIGNUPS=false
OPENAI_MODEL=gpt-5-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
STRIPE_PRICE_STUDIO_MONTHLY=price_...
STRIPE_PRICE_STUDIO_YEARLY=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_YEARLY=price_...
```

## Déclencher le déploiement

- Automatique : `git push origin main`.
- Manuel : onglet **Actions** → *Deploy to Hostinger VPS* → **Run workflow**.

## Après le 1er déploiement

- Vérifier `https://solospeaker.com` (certificat Caddy émis).
- **Stripe webhook** : pointer l'endpoint sur `https://solospeaker.com/api/billing/webhook`
  et mettre le `whsec_…` correspondant dans `STRIPE_WEBHOOK_SECRET`.
- **Supabase Auth** : ajouter `https://solospeaker.com` dans les Redirect URLs autorisées.
- Configurer le **SMTP Supabase** (sinon les emails d'invitation d'équipe ne partent pas).
