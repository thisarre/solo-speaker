# Billing spine — manual post-deploy checklist

These checks require authentication and/or live Stripe payment flow and therefore
**cannot** be covered by the auth-free, deploy-safe Playwright specs
(`billing-pricing.spec.ts`, `billing-checkout-wiring.spec.ts`,
`billing-trial-and-copy.spec.ts`). Run them by hand against a **preview/staging
deploy** wired to **Stripe TEST keys** with a **webhook tunnel** (Stripe CLI
`stripe listen --forward-to <preview-url>/api/billing/webhook`).

The automated specs are gated behind `BILLING_E2E=1`; the manual checks below are
not gated — they are a human runbook.

## Prerequisites

- Preview deploy reachable, signed-in test user available.
- `STRIPE_SECRET_KEY` / webhook secret set to **TEST** values on the preview env.
- Stripe TEST prices created with the expected `lookup_key`s
  (`studio_monthly`, `studio_yearly`, `pro_monthly`, `pro_yearly`,
  `team_monthly`, `team_yearly`) and `metadata.plan` set per tier.
- `stripe listen` running and forwarding to the preview webhook endpoint.
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.

## Checks

### 1. Pro monthly checkout → entitlement + subscription row

1. Signed in, go to `/fr/pricing`, toggle to **Mensuel**, click **Choisir Pro**.
2. Complete Stripe Checkout with card `4242 4242 4242 4242`.
3. Land back on the dashboard; confirm it reflects **Pro**.
4. In the DB, confirm a `subscriptions` row for the user exists with:
   `plan = pro`, `cadence = monthly`, `seats = 1`, `status = active`.

### 2. Team checkout with seats=5 (minimum) → seats persisted

1. Signed in, go to `/fr/pricing`, on **Équipe** keep the seat stepper at **5** (the minimum),
   click **Démarrer avec mon équipe**.
2. Complete the test checkout.
3. Confirm `subscriptions.seats = 5` and the team's `teams.max_seats = 5`.

### 3. Studio → Pro upgrade → proration

1. As a user already on Studio, call `/api/billing/upgrade` to move to Pro.
2. In the Stripe Dashboard (TEST), open the subscription / upcoming invoice and
   confirm a **proration** line item is present for the mid-cycle change.

### 4. `invoice.paid` advances the period (STT cap reset)

1. With an active subscription, trigger `stripe trigger invoice.paid`
   (or let a renewal fire) so the webhook processes `invoice.paid`.
2. Confirm `subscriptions.current_period_end` **advances** to the next period.
3. Confirm the STT usage cap resets for the new period (a fresh
   `usage_counters` window / zeroed usage for the new `current_period`).

### 5. Trial gate behaviour

1. As a **fresh trial user**:
   - Create talks up to the cap; the **6th talk is blocked** (trial allows 5).
   - Export a PDF; confirm it carries the **trial watermark**.
2. Seed `usage_counters` for that user to the **STT cap**, then call
   `/api/deepgram/token`; confirm it returns `{ "engine": "browser" }`
   (server-side STT is cut off once the cap is reached, falling back to the
   in-browser engine).

## Notes

- Use TEST keys only — never run these against live Stripe.
- After each run, clean up created test subscriptions/customers in the Stripe
  TEST dashboard if the preview env is shared.
