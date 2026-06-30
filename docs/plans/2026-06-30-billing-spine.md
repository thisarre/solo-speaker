# Billing Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the monetization spine — 3 paid tiers (Studio, Pro, Team per-seat), usage-based trial, a single server-side entitlements source, Stripe lookup_keys + seat billing, subscription sync via webhooks, and STT cloud cost caps — with the Pro/Team feature gates posted (returning "unavailable on your plan") even though those features ship later.

**Architecture:** Static `plan → capabilities` matrix in TypeScript (`entitlements.ts`) is the single gate; per-user dynamic state lives in a new `subscriptions` table synced from Stripe webhooks. STT metering uses reserve-at-mint + confirm-at-session-end backed by an `stt_sessions` table, with `usage_counters` as a derived aggregate. Cap reset for paid plans is anchored to the Stripe billing period (`invoice.paid` / `current_period_end`); the trial cap is a lifetime allotment that never resets.

**Tech Stack:** Next.js (App Router, route handlers), Supabase Postgres (SQL migrations + RLS, service-role admin client), Stripe (Checkout + subscriptions REST API), Deepgram (STT grants), PostHog (analytics), `tsx --test` (node:test) for unit, Playwright for E2E.

**Plan location note:** Saved to `docs/plans/` (tracked) instead of `docs/superpowers/plans/` because the project `.gitignore` excludes `docs/superpowers/`. The spec lives at `docs/specs/2026-06-30-billing-spine-design.md`.

**Reference conventions (read before starting):**
- Unit tests: `node:test` + `node:assert/strict`, run with `npm test` (tsx). Test files are `*.test.ts` next to source. New `src/modules/billing/*.test.ts` files are already covered by the `test` script glob.
- Migrations: `supabase/migrations/<UTC-timestamp>_<name>.sql`, plain SQL, end schema-affecting ones with `notify pgrst, 'reload schema';`. Latest timestamp so far is `20260629130000`; use later timestamps.
- Admin (service-role) DB writes: `import { createAdminClient } from "@/lib/supabase/admin"`.
- Route handlers: `export const runtime = "nodejs"`, return `NextResponse.json(...)`.

**Lot ordering (locked with user):** 1 Migrations → 2 Entitlements → **3 STT metering (depends only on 1+2, no Stripe)** → 4 Stripe → 5 Webhooks/sync → **6 Trial data migration (touches prod data, own rollback)** → 7 Pricing page → 8 E2E.

---

## File Structure

**Created:**
- `supabase/migrations/20260630120000_billing_subscriptions.sql` — `subscriptions` table + `profiles.billing_plan` CHECK +`pro` + RLS.
- `supabase/migrations/20260630120100_stt_metering.sql` — `stt_sessions` + `usage_counters` tables + RLS + indexes.
- `src/modules/billing/capabilities.ts` — the static `PLAN_CAPABILITIES` matrix + `Capability` type + `can()` + `sttCapFor()`.
- `src/modules/billing/capabilities.test.ts` — matrix/gate unit tests.
- `src/modules/billing/active-plan.ts` — `getActivePlan(userId)` (DB-backed plan + period resolution).
- `src/modules/billing/active-plan.test.ts` — period/plan resolution unit tests (pure helpers).
- `src/modules/billing/stt-metering.ts` — pure metering logic (reservation/confirm math, cap decision, period_key builder).
- `src/modules/billing/stt-metering.test.ts` — metering unit tests.
- `src/app/api/stt/session/route.ts` — POST confirm-at-session-end endpoint.
- `src/app/api/cron/stt-sweep/route.ts` — sweep stale reservations → expired (conservative).
- `src/modules/billing/stripe-prices.ts` — lookup_key → price resolution (runtime, cached).
- `src/modules/billing/stripe-prices.test.ts` — resolution + cache unit tests.
- `docs/specs/2026-06-30-billing-spine-design.md` — already committed (the spec).

**Modified:**
- `src/modules/billing/entitlements.ts` — `BillingPlan` +`pro`; re-wire `canCreateTalk` onto the matrix; re-export `can`/`sttCapFor`.
- `src/modules/billing/checkout.ts` — drop `priceEnv`/`trial_period_days`; add lookup_key plan map, seat quantity, min-3 validation.
- `src/modules/billing/checkout.test.ts` — update expectations (no 14-day trial, quantity, lookup_keys).
- `src/app/api/deepgram/token/route.ts` — reserve-at-mint + cap gate + `stt_engine_used` event.
- `src/app/api/billing/checkout/route.ts` — Team seat param + lookup_key resolution.
- `src/app/api/billing/upgrade/route.ts` — NEW (proration update Studio→Pro, monthly→yearly). Listed here as created.
- `src/app/api/billing/webhook/route.ts` — upsert `subscriptions`, handle `invoice.paid`, plan from product metadata.
- `src/app/api/billing/sync/route.ts` — write `subscriptions` row on checkout return.
- `src/modules/pricing/plans.ts` — 3 paid tiers (add Pro), per-seat Team, savings.
- `src/modules/pricing/plans.test.ts` — update tier expectations.
- `src/modules/pricing/components/pricing-cards.tsx` — 3 tiers, Team seat selector, badge stays Studio.
- `src/modules/pricing/components/pricing-page.tsx` — universal trial CTA above grid.
- `src/i18n/messages/fr.json` + `en.json` — pricing copy (3 tiers, trial CTA "sans carte bancaire", Team volume framing).
- `src/modules/billing/trial.ts` — delete 14-day countdown (replaced by usage-based or removed).
- `src/app/api/cron/trial-reminders/route.ts` — repurpose to usage-based or remove from cron.
- `src/lib/supabase/database.types.ts` — regenerated types for new tables/columns.
- `tests/e2e/*` (Playwright) — pricing + checkout + gate E2E.

---

## Task 1: SQL migrations (schema foundation)

**Files:**
- Create: `supabase/migrations/20260630120000_billing_subscriptions.sql`
- Create: `supabase/migrations/20260630120100_stt_metering.sql`

- [ ] **Step 1: Write the `subscriptions` migration**

Create `supabase/migrations/20260630120000_billing_subscriptions.sql`:

```sql
-- Subscription state, source of truth synced from Stripe webhooks. One row per buyer/owner.
-- Written only by the service role (webhook + sync). Users may read their own row.
alter table public.profiles
  drop constraint if exists profiles_billing_plan_check;
alter table public.profiles
  add constraint profiles_billing_plan_check
    check (billing_plan in ('trial', 'studio', 'pro', 'team'));

create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  plan                   text not null check (plan in ('studio', 'pro', 'team')),
  cadence                text not null check (cadence in ('monthly', 'yearly')),
  status                 text not null,
  seats                  integer not null default 1 check (seats >= 1),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_owner_read" on public.subscriptions
  for select using (user_id = auth.uid());

notify pgrst, 'reload schema';
```

- [ ] **Step 2: Write the STT metering migration**

Create `supabase/migrations/20260630120100_stt_metering.sql`:

```sql
-- STT metering. stt_sessions = source of truth (reservations + confirmations).
-- usage_counters = derived aggregate for fast cap reads at mint time.
-- Both service-role only (no client access — written by server STT flow).
create table if not exists public.stt_sessions (
  id                text primary key,                 -- client-generated speaking-session UUID
  user_id           uuid not null references public.profiles(id) on delete cascade,
  period_key        text not null,                    -- 'trial' or 'sub:<subId>:<period_start_epoch>'
  reserved_seconds  integer not null default 0,
  confirmed_seconds integer,
  status            text not null default 'reserved'
                      check (status in ('reserved', 'confirmed', 'expired')),
  engine            text not null default 'cloud' check (engine in ('cloud', 'browser')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists stt_sessions_sweep_idx
  on public.stt_sessions (status, created_at);
create index if not exists stt_sessions_user_period_idx
  on public.stt_sessions (user_id, period_key);

create table if not exists public.usage_counters (
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  period_key              text not null,
  cloud_reserved_seconds  integer not null default 0,
  cloud_confirmed_seconds integer not null default 0,
  browser_seconds         integer not null default 0,
  updated_at              timestamptz not null default now(),
  primary key (user_id, period_key)
);

alter table public.stt_sessions enable row level security;
alter table public.usage_counters enable row level security;
-- No policies: service-role bypasses RLS; authenticated users get no access.

notify pgrst, 'reload schema';
```

- [ ] **Step 3: Apply migrations to a dev/branch DB and verify**

Apply via Supabase MCP `apply_migration` (or `supabase db push` locally), one per file in timestamp order.

**Done (testable):** `list_tables` shows `subscriptions`, `stt_sessions`, `usage_counters`. This SQL inserts and round-trips:
```sql
insert into public.profiles (id, billing_plan) values (gen_random_uuid(), 'pro')
  returning billing_plan;   -- must succeed (proves CHECK accepts 'pro')
```
And `select * from public.usage_counters` returns 0 rows without error.

- [ ] **Step 4: Regenerate DB types**

Run Supabase MCP `generate_typescript_types` and write the result to `src/lib/supabase/database.types.ts`. Confirm `subscriptions`, `stt_sessions`, `usage_counters` appear in the `Database` type.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260630120000_billing_subscriptions.sql \
        supabase/migrations/20260630120100_stt_metering.sql \
        src/lib/supabase/database.types.ts
git commit -m "feat(billing): schema — subscriptions, stt_sessions, usage_counters (+pro plan)"
```

---

## Task 2: Entitlements core (static matrix + gate)

**Files:**
- Create: `src/modules/billing/capabilities.ts`
- Create: `src/modules/billing/capabilities.test.ts`
- Modify: `src/modules/billing/entitlements.ts`

- [ ] **Step 1: Write the failing test for the capability matrix**

Create `src/modules/billing/capabilities.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { can, sttCapFor, PLAN_CAPABILITIES } from "./capabilities";

test("trial unlocks no premium capability and has the 15-min lifetime STT cap", () => {
  assert.equal(can("trial", "export.branded"), false);
  assert.equal(can("trial", "analytics.rehearsal"), false);
  assert.deepEqual(sttCapFor("trial"), { minutes: 15, basis: "trial_total" });
});

test("studio unlocks nothing premium but gets the 60-min billing-period cap", () => {
  assert.equal(can("studio", "export.branded"), false);
  assert.equal(can("studio", "team.seats"), false);
  assert.deepEqual(sttCapFor("studio"), { minutes: 60, basis: "billing_period" });
});

test("pro unlocks the five future Pro capabilities and a 90-min cap", () => {
  for (const cap of ["export.branded", "analytics.rehearsal", "talk.versions", "talk.multilingual", "share.public"] as const) {
    assert.equal(can("pro", cap), true, cap);
  }
  assert.equal(can("pro", "team.seats"), false);
  assert.deepEqual(sttCapFor("pro"), { minutes: 90, basis: "billing_period" });
});

test("team unlocks all Pro capabilities plus team capabilities", () => {
  assert.equal(can("team", "export.branded"), true);
  assert.equal(can("team", "team.seats"), true);
  assert.equal(can("team", "team.sharedLibrary"), true);
  assert.deepEqual(sttCapFor("team"), { minutes: 90, basis: "billing_period" });
});

test("every plan is present in the matrix", () => {
  assert.deepEqual(Object.keys(PLAN_CAPABILITIES).sort(), ["pro", "studio", "team", "trial"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/modules/billing/capabilities.test.ts`
Expected: FAIL — `Cannot find module './capabilities'`.

- [ ] **Step 3: Implement the matrix**

Create `src/modules/billing/capabilities.ts`:

```ts
import type { BillingPlan } from "./entitlements";

export type Capability =
  | "export.branded"
  | "analytics.rehearsal"
  | "talk.versions"
  | "talk.multilingual"
  | "share.public"
  | "team.seats"
  | "team.sharedLibrary";

export type SttCap = { minutes: number; basis: "trial_total" | "billing_period" };

type PlanEntry = {
  capabilities: ReadonlySet<Capability>;
  stt: SttCap;
  talkLimit: number | "unlimited";
  aiCredits: number | "unlimited";
};

const PRO_CAPS: Capability[] = ["export.branded", "analytics.rehearsal", "talk.versions", "talk.multilingual", "share.public"];

export const PLAN_CAPABILITIES: Record<BillingPlan, PlanEntry> = {
  trial: {
    capabilities: new Set(),
    stt: { minutes: 15, basis: "trial_total" },
    talkLimit: 5,
    aiCredits: 20
  },
  studio: {
    capabilities: new Set(),
    stt: { minutes: 60, basis: "billing_period" },
    talkLimit: "unlimited",
    aiCredits: "unlimited"
  },
  pro: {
    capabilities: new Set(PRO_CAPS),
    stt: { minutes: 90, basis: "billing_period" },
    talkLimit: "unlimited",
    aiCredits: "unlimited"
  },
  team: {
    capabilities: new Set<Capability>([...PRO_CAPS, "team.seats", "team.sharedLibrary"]),
    stt: { minutes: 90, basis: "billing_period" },
    talkLimit: "unlimited",
    aiCredits: "unlimited"
  }
};

// The single server-side gate. Replaces scattered `plan === "studio"` checks.
export function can(plan: BillingPlan, capability: Capability): boolean {
  return PLAN_CAPABILITIES[plan].capabilities.has(capability);
}

export function sttCapFor(plan: BillingPlan): SttCap {
  return PLAN_CAPABILITIES[plan].stt;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/modules/billing/capabilities.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Re-wire `entitlements.ts` onto the matrix**

Modify `src/modules/billing/entitlements.ts` to add `"pro"` and source the talk limit from the matrix (keep the existing `canCreateTalk` API and error copy):

```ts
import { getMessages } from "@/i18n/messages";
import { PLAN_CAPABILITIES } from "./capabilities";

export type BillingPlan = "trial" | "studio" | "pro" | "team";

// Back-compat export kept for existing imports/tests.
export const trialTalkLimit = 5;

export function canCreateTalk(input: { currentTalkCount: number; plan: BillingPlan }) {
  const limit = PLAN_CAPABILITIES[input.plan].talkLimit;
  if (limit === "unlimited") {
    return { allowed: true, reason: "" };
  }
  if (input.currentTalkCount >= limit) {
    return { allowed: false, reason: getMessages("fr").errors.trialTalkLimit };
  }
  return { allowed: true, reason: "" };
}

export { can, sttCapFor } from "./capabilities";
export type { Capability } from "./capabilities";
```

> Note the circular import: `capabilities.ts` imports the `BillingPlan` *type* from `entitlements.ts` (type-only, erased at runtime), and `entitlements.ts` imports the *value* `PLAN_CAPABILITIES` from `capabilities.ts`. Type-only import has no runtime cycle, so this is safe.

- [ ] **Step 6: Run the existing entitlements test + the new one**

Run: `npx tsx --test src/modules/billing/entitlements.test.ts src/modules/billing/capabilities.test.ts`
Expected: PASS. The existing test asserting `trialTalkLimit === 5` and trial cap-at-5 still holds; `pro`/`team` are unlimited.

- [ ] **Step 7: Commit**

```bash
git add src/modules/billing/capabilities.ts src/modules/billing/capabilities.test.ts src/modules/billing/entitlements.ts
git commit -m "feat(billing): single entitlements matrix (can/sttCapFor) + pro plan"
```

**Done (testable):** `npm test` green; `can("studio","export.branded") === false` and `can("pro","export.branded") === true`.

---

## Task 3: STT metering (pure logic + endpoints) — depends only on Tasks 1+2

This lot is independent of Stripe/webhooks. It needs only the migrations (Task 1) and the matrix (Task 2). It is fully testable with Deepgram + caps and **no billing wired**.

**Files:**
- Create: `src/modules/billing/stt-metering.ts`
- Create: `src/modules/billing/stt-metering.test.ts`
- Create: `src/modules/billing/active-plan.ts`
- Create: `src/modules/billing/active-plan.test.ts`
- Create: `src/app/api/stt/session/route.ts`
- Create: `src/app/api/cron/stt-sweep/route.ts`
- Modify: `src/app/api/deepgram/token/route.ts`

### 3a — Pure period/plan resolution helpers

- [ ] **Step 1: Write the failing test for period_key + cap resolution**

Create `src/modules/billing/active-plan.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { resolvePeriodKey, capSecondsFor } from "./active-plan";

test("trial period_key is the constant 'trial' (never resets)", () => {
  assert.equal(resolvePeriodKey("trial", null), "trial");
});

test("paid period_key anchors on the subscription id + period start epoch", () => {
  // 2026-06-01T00:00:00Z === 1780272000 (epoch seconds)
  const key = resolvePeriodKey("studio", { stripe_subscription_id: "sub_X", current_period_start: "2026-06-01T00:00:00.000Z" });
  assert.equal(key, "sub:sub_X:1780272000");
});

test("paid period_key with no subscription row falls back to a stable 'pending' bucket", () => {
  assert.equal(resolvePeriodKey("studio", null), "pending");
});

test("cap is converted from minutes to seconds via the matrix", () => {
  assert.equal(capSecondsFor("trial"), 15 * 60);
  assert.equal(capSecondsFor("studio"), 60 * 60);
  assert.equal(capSecondsFor("pro"), 90 * 60);
  assert.equal(capSecondsFor("team"), 90 * 60);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx tsx --test src/modules/billing/active-plan.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the pure helpers**

Create `src/modules/billing/active-plan.ts`:

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { BillingPlan } from "./entitlements";
import { sttCapFor } from "./capabilities";

export type SubscriptionPeriod = {
  stripe_subscription_id: string | null;
  current_period_start: string | null;
};

// Encodes the cap-reset window. Trial = lifetime ('trial', never resets);
// paid = the Stripe billing period (advances on invoice.paid -> new key -> counter resets).
export function resolvePeriodKey(plan: BillingPlan, period: SubscriptionPeriod | null): string {
  if (plan === "trial") return "trial";
  if (!period?.stripe_subscription_id || !period.current_period_start) return "pending";
  const epoch = Math.floor(new Date(period.current_period_start).getTime() / 1000);
  return `sub:${period.stripe_subscription_id}:${epoch}`;
}

export function capSecondsFor(plan: BillingPlan): number {
  return sttCapFor(plan).minutes * 60;
}

export type ActivePlan = {
  plan: BillingPlan;
  periodKey: string;
  capSeconds: number;
};

// Resolves the effective plan and counting window for a user.
// A team member (profiles.team_id set) resolves to 'team' with the cap applied to THEIR OWN
// user_id; the period_key derives from the OWNER's subscription (members have no subscriptions row).
export async function getActivePlan(userId: string): Promise<ActivePlan> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("billing_plan, team_id")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile?.billing_plan ?? "trial") as BillingPlan;

  if (plan === "trial") {
    return { plan, periodKey: "trial", capSeconds: capSecondsFor("trial") };
  }

  // Owner of the subscription: members resolve via teams.owner_id.
  let ownerId = userId;
  if (plan === "team" && profile?.team_id) {
    const { data: team } = await admin.from("teams").select("owner_id").eq("id", profile.team_id).maybeSingle();
    if (team?.owner_id) ownerId = team.owner_id;
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, current_period_start")
    .eq("user_id", ownerId)
    .maybeSingle();

  return {
    plan,
    periodKey: resolvePeriodKey(plan, sub ?? null),
    capSeconds: capSecondsFor(plan)
  };
}
```

- [ ] **Step 4: Run to verify pure-helper tests pass**

Run: `npx tsx --test src/modules/billing/active-plan.test.ts`
Expected: PASS (4 tests). (`getActivePlan` itself is exercised in E2E/integration, not unit — it hits the DB.)

- [ ] **Step 5: Commit**

```bash
git add src/modules/billing/active-plan.ts src/modules/billing/active-plan.test.ts
git commit -m "feat(billing): getActivePlan + period_key resolution (trial lifetime vs billing period)"
```

### 3b — Metering decision logic (pure)

- [ ] **Step 6: Write the failing test for the metering math**

Create `src/modules/billing/stt-metering.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { GRANT_TTL_SECONDS, decideCloudAllowed, applyConfirmation } from "./stt-metering";

test("cloud is refused once reserved+confirmed reaches the cap", () => {
  const cap = 60 * 60;
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 0, cloudConfirmed: 0 }), true);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: cap - 1, cloudConfirmed: 0 }), true);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: cap, cloudConfirmed: 0 }), false);
  assert.equal(decideCloudAllowed({ capSeconds: cap, cloudReserved: 30, cloudConfirmed: cap - 30 }), false);
});

test("confirmation replaces the reservation with the real figure (delta math)", () => {
  // session reserved 120s, actually used 35s.
  const next = applyConfirmation({ cloudReserved: 120, cloudConfirmed: 0 }, { reservedSeconds: 120, confirmedSeconds: 35 });
  assert.deepEqual(next, { cloudReserved: 0, cloudConfirmed: 35 });
});

test("confirmation never drives the reserved counter negative", () => {
  const next = applyConfirmation({ cloudReserved: 60, cloudConfirmed: 10 }, { reservedSeconds: 120, confirmedSeconds: 35 });
  assert.equal(next.cloudReserved, 0);
  assert.equal(next.cloudConfirmed, 45);
});

test("grant TTL is the per-mint reservation block", () => {
  assert.equal(GRANT_TTL_SECONDS, 60);
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `npx tsx --test src/modules/billing/stt-metering.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8: Implement the pure metering logic**

Create `src/modules/billing/stt-metering.ts`:

```ts
// Deepgram grants are short-lived (ttl_seconds: 60). A speaking session re-mints every ~60s;
// each mint reserves one TTL block and re-checks the cap, so a session that crosses the cap
// mid-way is refused on its next mint and the client falls back to the browser engine.
export const GRANT_TTL_SECONDS = 60;

export type CounterState = { cloudReserved: number; cloudConfirmed: number };

// Hard gate at mint time: reserved + confirmed must stay strictly under the cap.
export function decideCloudAllowed(input: { capSeconds: number } & CounterState): boolean {
  return input.cloudReserved + input.cloudConfirmed < input.capSeconds;
}

// End-of-session correction: release this session's reservation, add the real seconds.
// Clamps reserved at 0 so concurrent/duplicate paths can't underflow.
export function applyConfirmation(
  counter: CounterState,
  session: { reservedSeconds: number; confirmedSeconds: number }
): CounterState {
  return {
    cloudReserved: Math.max(0, counter.cloudReserved - session.reservedSeconds),
    cloudConfirmed: counter.cloudConfirmed + Math.max(0, session.confirmedSeconds)
  };
}
```

- [ ] **Step 9: Run to verify it passes**

Run: `npx tsx --test src/modules/billing/stt-metering.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 10: Commit**

```bash
git add src/modules/billing/stt-metering.ts src/modules/billing/stt-metering.test.ts
git commit -m "feat(billing): pure STT metering logic (cap gate + confirmation delta)"
```

### 3c — Wire the mint endpoint (reserve + gate + event)

- [ ] **Step 11: Modify the Deepgram token route to reserve and gate**

In `src/app/api/deepgram/token/route.ts`, after auth + rate-limit succeed and **before** calling Deepgram, add metering. The client must send `{ sessionId }` (a UUID it generates once per speaking session) in the POST body; re-mints within a session reuse the same `sessionId`.

Insert after the `rateLimit` block, replacing the direct Deepgram call:

```ts
import { getActivePlan } from "@/modules/billing/active-plan";
import { decideCloudAllowed, applyConfirmation, GRANT_TTL_SECONDS } from "@/modules/billing/stt-metering";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPostHogClient } from "@/lib/posthog-server";

// ... inside POST, after rateLimit.allowed check ...

const body = (await request.json().catch(() => ({}))) as { sessionId?: string };
const sessionId = typeof body.sessionId === "string" && body.sessionId.length > 0 ? body.sessionId : null;
if (!sessionId) {
  return NextResponse.json({ error: "sessionId is required." }, { status: 400, headers: rateLimit.headers });
}

const admin = createAdminClient();
const active = await getActivePlan(user.id);
const { data: counter } = await admin
  .from("usage_counters")
  .select("cloud_reserved_seconds, cloud_confirmed_seconds")
  .eq("user_id", user.id)
  .eq("period_key", active.periodKey)
  .maybeSingle();

const cloudReserved = counter?.cloud_reserved_seconds ?? 0;
const cloudConfirmed = counter?.cloud_confirmed_seconds ?? 0;
const posthog = getPostHogClient();

if (!decideCloudAllowed({ capSeconds: active.capSeconds, cloudReserved, cloudConfirmed })) {
  posthog.capture({ distinctId: user.id, event: "stt_engine_used", properties: { engine: "browser", reason: "cap_reached", plan: active.plan } });
  return NextResponse.json({ engine: "browser", reason: "cap_reached" }, { status: 200, headers: rateLimit.headers });
}

// Reserve one TTL block for this session (incremental: a long session adds a block per mint).
await admin.from("stt_sessions").upsert(
  { id: sessionId, user_id: user.id, period_key: active.periodKey, reserved_seconds: GRANT_TTL_SECONDS, status: "reserved", engine: "cloud" },
  { onConflict: "id" }
);
await admin.from("usage_counters").upsert(
  { user_id: user.id, period_key: active.periodKey, cloud_reserved_seconds: cloudReserved + GRANT_TTL_SECONDS, cloud_confirmed_seconds: cloudConfirmed, updated_at: new Date().toISOString() },
  { onConflict: "user_id,period_key" }
);
posthog.capture({ distinctId: user.id, event: "stt_engine_used", properties: { engine: "cloud", plan: active.plan } });

// ... then the existing Deepgram grant fetch + token response, unchanged ...
```

> Reservation note: upsert with `reserved_seconds: GRANT_TTL_SECONDS` sets (not adds) the row's reservation, while the counter add of `GRANT_TTL_SECONDS` per mint is what accumulates. For a multi-mint session the per-session row reservation is intentionally kept at one TTL block; the confirm step (3d) releases `reservedSeconds` read live from the row. To keep the row's reservation in sync with the counter, change the session upsert to read-modify-write `reserved_seconds = existing + GRANT_TTL_SECONDS`. Implement the read-modify-write form so the confirm delta is exact.

- [ ] **Step 12: Update the client to send & reuse a sessionId**

In `src/modules/speaking-mode/voice/providers/deepgram-provider.ts`, generate `crypto.randomUUID()` once when a session starts, send it in the token POST body, persist it for the session, and react to a `{ engine: "browser" }` response by handing off to the browser provider. (Exact wiring follows the existing provider-health fallback path in `src/modules/speaking-mode/voice/provider-health.ts`.)

- [ ] **Step 13: Commit**

```bash
git add src/app/api/deepgram/token/route.ts src/modules/speaking-mode/voice/providers/deepgram-provider.ts
git commit -m "feat(stt): reserve at mint + cap gate + stt_engine_used event"
```

### 3d — Confirm endpoint + sweep cron

- [ ] **Step 14: Implement the confirm endpoint (idempotent)**

Create `src/app/api/stt/session/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyConfirmation } from "@/modules/billing/stt-metering";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Session required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { sessionId?: string; confirmedSeconds?: number };
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const confirmedSeconds = Math.max(0, Math.floor(Number(body.confirmedSeconds) || 0));
  if (!sessionId) return NextResponse.json({ error: "sessionId required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("stt_sessions")
    .select("user_id, period_key, reserved_seconds, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== user.id) return NextResponse.json({ ok: true }); // unknown/foreign → no-op
  if (session.status === "confirmed") return NextResponse.json({ ok: true });          // idempotent

  const { data: counter } = await admin
    .from("usage_counters")
    .select("cloud_reserved_seconds, cloud_confirmed_seconds")
    .eq("user_id", session.user_id)
    .eq("period_key", session.period_key)
    .maybeSingle();

  const next = applyConfirmation(
    { cloudReserved: counter?.cloud_reserved_seconds ?? 0, cloudConfirmed: counter?.cloud_confirmed_seconds ?? 0 },
    { reservedSeconds: session.reserved_seconds, confirmedSeconds }
  );

  await admin.from("stt_sessions").update({ confirmed_seconds: confirmedSeconds, status: "confirmed", updated_at: new Date().toISOString() }).eq("id", sessionId);
  await admin.from("usage_counters").upsert(
    { user_id: session.user_id, period_key: session.period_key, cloud_reserved_seconds: next.cloudReserved, cloud_confirmed_seconds: next.cloudConfirmed, updated_at: new Date().toISOString() },
    { onConflict: "user_id,period_key" }
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 15: Implement the sweep cron (conservative)**

Create `src/app/api/cron/stt-sweep/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Stale 'reserved' sessions (client never confirmed — tab closed) are swept to 'expired'.
// The reserved_seconds are KEPT as the charge (conservative: cap is never under-counted).
// Protected by CRON_SECRET.
const STALE_MS = 10 * 60 * 1000; // TTL (60s) + generous margin

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_MS).toISOString();
  const { data: stale } = await admin
    .from("stt_sessions")
    .select("id")
    .eq("status", "reserved")
    .lt("created_at", cutoff);

  // Counter already holds reserved_seconds; we keep them (no release), only flip status.
  const ids = (stale ?? []).map((s) => s.id);
  if (ids.length > 0) {
    await admin.from("stt_sessions").update({ status: "expired", updated_at: new Date().toISOString() }).in("id", ids);
  }
  return NextResponse.json({ ok: true, expired: ids.length });
}
```

- [ ] **Step 16: Register the sweep cron**

Add the `stt-sweep` schedule next to the existing crons (same mechanism as `trial-reminders`/`health-report` — see the project's cron config, e.g. `vercel.json` crons or the platform scheduler). Daily is sufficient.

- [ ] **Step 17: Commit**

```bash
git add src/app/api/stt/session/route.ts src/app/api/cron/stt-sweep/route.ts
git commit -m "feat(stt): confirm endpoint (idempotent) + conservative sweep cron"
```

**Done (testable — STT, where bugs are silent):**
1. Unit: `npm test` green for `stt-metering` + `active-plan`.
2. Integration (manual, against a dev DB, no billing): as a trial user, POST `/api/deepgram/token` with a fixed `sessionId` 15 times reserving 60s each → the 16th mint returns `{ engine: "browser", reason: "cap_reached" }` (15 min cap reached). `usage_counters` shows `cloud_reserved_seconds = 900`.
3. Idempotency: POST `/api/stt/session` with `{ sessionId, confirmedSeconds: 20 }` twice → counter ends with `cloud_confirmed_seconds = 20` (not 40), reserved released once.
4. Trial never resets: confirm a trial session, then re-query — `period_key` stays `'trial'`; there is no monthly bucket.
5. Sweep: insert a `reserved` row with `created_at` 20 min ago → after `GET /api/cron/stt-sweep` its status is `expired` and the counter's reserved is unchanged (charge kept).

---

## Task 4: Stripe (lookup_keys, seat billing, proration)

**Files:**
- Create (Stripe side): products + prices via Stripe API/MCP (test mode).
- Create: `src/modules/billing/stripe-prices.ts`, `src/modules/billing/stripe-prices.test.ts`
- Modify: `src/modules/billing/checkout.ts`, `src/modules/billing/checkout.test.ts`
- Modify: `src/app/api/billing/checkout/route.ts`
- Create: `src/app/api/billing/upgrade/route.ts`

- [ ] **Step 1: Create Stripe products + prices (test mode)**

Using Stripe MCP `stripe_api_write` (or the dashboard), in **test mode**, create 3 products with `metadata.plan`, and 6 prices each with a `lookup_key`. Team prices are recurring `licensed` (per-seat quantity).

```
Product "Studio"  metadata{plan: studio}
  price 1200 EUR/month  lookup_key=studio_monthly
  price 9900 EUR/year   lookup_key=studio_yearly
Product "Pro"     metadata{plan: pro}
  price 1900 EUR/month  lookup_key=pro_monthly
  price 15900 EUR/year  lookup_key=pro_yearly
Product "Team"    metadata{plan: team}
  price 600 EUR/month   lookup_key=team_monthly   (recurring, licensed)
  price 4900 EUR/year   lookup_key=team_yearly    (recurring, licensed)
```

**Done (testable):** `GET /v1/prices?lookup_keys[]=studio_monthly&lookup_keys[]=pro_yearly&lookup_keys[]=team_monthly&expand[]=data.product` returns 3 prices, each with `product.metadata.plan` set.

- [ ] **Step 2: Write the failing test for plan↔lookup_key mapping**

Create `src/modules/billing/stripe-prices.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { lookupKeyFor, parseCheckoutSelection, seatsAreValid } from "./stripe-prices";

test("each plan+cadence maps to its lookup_key", () => {
  assert.equal(lookupKeyFor("studio", "monthly"), "studio_monthly");
  assert.equal(lookupKeyFor("pro", "yearly"), "pro_yearly");
  assert.equal(lookupKeyFor("team", "yearly"), "team_yearly");
});

test("parseCheckoutSelection accepts valid plan_cadence and rejects junk", () => {
  assert.deepEqual(parseCheckoutSelection("pro_monthly"), { plan: "pro", cadence: "monthly" });
  assert.equal(parseCheckoutSelection("trial_monthly"), null);
  assert.equal(parseCheckoutSelection("pro"), null);
});

test("team requires at least 3 seats; studio/pro are always single-seat", () => {
  assert.equal(seatsAreValid("team", 3), true);
  assert.equal(seatsAreValid("team", 2), false);
  assert.equal(seatsAreValid("studio", 1), true);
  assert.equal(seatsAreValid("pro", 5), false); // pro is single-seat
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx tsx --test src/modules/billing/stripe-prices.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement plan/cadence/seat helpers**

Create `src/modules/billing/stripe-prices.ts`:

```ts
import type { BillingPlan } from "./entitlements";

export type PaidPlan = "studio" | "pro" | "team";
export type Cadence = "monthly" | "yearly";
export const MIN_TEAM_SEATS = 3;

export function lookupKeyFor(plan: PaidPlan, cadence: Cadence): string {
  return `${plan}_${cadence}`;
}

export function parseCheckoutSelection(value: string | null | undefined): { plan: PaidPlan; cadence: Cadence } | null {
  const m = /^(studio|pro|team)_(monthly|yearly)$/.exec(value ?? "");
  return m ? { plan: m[1] as PaidPlan, cadence: m[2] as Cadence } : null;
}

export function seatsAreValid(plan: PaidPlan, seats: number): boolean {
  if (plan === "team") return Number.isInteger(seats) && seats >= MIN_TEAM_SEATS;
  return seats === 1;
}

// Runtime resolution of a lookup_key to a Stripe price id, cached per cold start.
const priceCache = new Map<string, string>();

export async function resolvePriceId(lookupKey: string, secretKey: string): Promise<string | null> {
  const cached = priceCache.get(lookupKey);
  if (cached) return cached;
  const res = await fetch(`https://api.stripe.com/v1/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { id: string }[] };
  const id = json.data?.[0]?.id ?? null;
  if (id) priceCache.set(lookupKey, id);
  return id;
}

export function planFromProductMetadata(metadata: Record<string, string> | undefined): BillingPlan {
  const plan = metadata?.plan;
  return plan === "studio" || plan === "pro" || plan === "team" ? plan : "trial";
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx tsx --test src/modules/billing/stripe-prices.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Rewrite the checkout payload builder (no 14-day trial, seat quantity)**

Replace `src/modules/billing/checkout.ts` contents with a lookup_key-based, seat-aware builder. Drop `priceEnv`, `stripeCheckoutPlans`, `getStripePriceId`, and `trial_period_days`:

```ts
import type { Cadence, PaidPlan } from "./stripe-prices";

type StripeCheckoutPayloadInput = {
  cancelUrl: string;
  customerEmail?: string | null;
  plan: PaidPlan;
  cadence: Cadence;
  priceId: string;
  seats: number;
  successUrl: string;
  userId: string;
};

export function buildStripeCheckoutPayload(input: StripeCheckoutPayloadInput) {
  const payload = new URLSearchParams();
  payload.set("mode", "subscription");
  payload.set("success_url", input.successUrl);
  payload.set("cancel_url", input.cancelUrl);
  payload.set("line_items[0][price]", input.priceId);
  payload.set("line_items[0][quantity]", String(input.seats));
  payload.set("allow_promotion_codes", "true");
  payload.set("client_reference_id", input.userId);
  payload.set("metadata[user_id]", input.userId);
  payload.set("metadata[plan]", input.plan);
  payload.set("subscription_data[metadata][user_id]", input.userId);
  payload.set("subscription_data[metadata][plan]", input.plan);
  if (input.customerEmail) payload.set("customer_email", input.customerEmail);
  return payload;
}

// Kept for the webhook to map subscription metadata → plan when product metadata is unavailable.
export function planFromSubscriptionMetadata(metadata: Record<string, string>): import("./entitlements").BillingPlan {
  const planId = metadata["plan"] ?? "";
  if (planId === "team") return "team";
  if (planId === "pro") return "pro";
  if (planId === "studio") return "studio";
  return "trial";
}
```

- [ ] **Step 7: Update the checkout payload test**

Replace `src/modules/billing/checkout.test.ts` with expectations for the new builder:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { buildStripeCheckoutPayload, planFromSubscriptionMetadata } from "./checkout";

test("buildStripeCheckoutPayload builds a subscription checkout WITHOUT a Stripe trial", () => {
  const payload = buildStripeCheckoutPayload({
    cancelUrl: "https://solo.test/fr/pricing",
    customerEmail: "speaker@example.com",
    plan: "pro",
    cadence: "yearly",
    priceId: "price_pro_yearly",
    seats: 1,
    successUrl: "https://solo.test/fr/dashboard?checkout=success",
    userId: "user_123"
  });
  assert.equal(payload.get("mode"), "subscription");
  assert.equal(payload.get("line_items[0][price]"), "price_pro_yearly");
  assert.equal(payload.get("line_items[0][quantity]"), "1");
  assert.equal(payload.get("subscription_data[trial_period_days]"), null); // trial is now usage-based
  assert.equal(payload.get("metadata[plan]"), "pro");
});

test("team checkout carries the seat quantity", () => {
  const payload = buildStripeCheckoutPayload({
    cancelUrl: "c", plan: "team", cadence: "yearly", priceId: "price_team_yearly", seats: 4, successUrl: "s", userId: "u"
  });
  assert.equal(payload.get("line_items[0][quantity]"), "4");
});

test("planFromSubscriptionMetadata maps the new plan ids", () => {
  assert.equal(planFromSubscriptionMetadata({ plan: "pro" }), "pro");
  assert.equal(planFromSubscriptionMetadata({ plan: "team" }), "team");
  assert.equal(planFromSubscriptionMetadata({ plan: "" }), "trial");
});
```

- [ ] **Step 8: Run the checkout + prices tests**

Run: `npx tsx --test src/modules/billing/checkout.test.ts src/modules/billing/stripe-prices.test.ts`
Expected: PASS.

- [ ] **Step 9: Update the checkout route (resolve lookup_key, validate seats)**

Modify `src/app/api/billing/checkout/route.ts` `createCheckoutRedirect`: parse `plan` as a `plan_cadence` selection + read `seats` (Team) from query/form, validate with `seatsAreValid` (reject <3 for Team → redirect `?error=invalid-seats`), resolve the price via `resolvePriceId(lookupKeyFor(plan, cadence), secretKey)`, then call `buildStripeCheckoutPayload({ plan, cadence, priceId, seats, ... })`. Remove all `getCheckoutPlan`/`getStripePriceId`/`STRIPE_PRICE_*` usage.

- [ ] **Step 10: Implement the proration upgrade endpoint**

Create `src/app/api/billing/upgrade/route.ts`: authenticated POST that reads the user's `subscriptions.stripe_subscription_id`, the target `{ plan, cadence }`, resolves the new price, fetches the subscription's item id, and `POST /v1/subscriptions/{id}` with `items[0][id]`, `items[0][price]=<newPriceId>`, and `proration_behavior=create_prorations`. Used for Studio→Pro and monthly→yearly. Returns `{ ok: true }` on success.

- [ ] **Step 11: Commit**

```bash
git add src/modules/billing/stripe-prices.ts src/modules/billing/stripe-prices.test.ts \
        src/modules/billing/checkout.ts src/modules/billing/checkout.test.ts \
        src/app/api/billing/checkout/route.ts src/app/api/billing/upgrade/route.ts
git commit -m "feat(billing): Stripe lookup_keys, seat-quantity checkout, proration upgrade; drop 14-day trial"
```

**Done (testable):** `npm test` green. Manual (test mode): hitting `/api/billing/checkout?plan=team_yearly&seats=2` redirects with `?error=invalid-seats`; `seats=3` creates a Stripe Checkout session whose line item quantity is 3 and whose subscription has no trial.

---

## Task 5: Webhooks & subscription sync

**Files:**
- Modify: `src/app/api/billing/webhook/route.ts`
- Modify: `src/app/api/billing/sync/route.ts`

- [ ] **Step 1: Extend the webhook to upsert `subscriptions` and handle `invoice.paid`**

In `src/app/api/billing/webhook/route.ts`:
- Add `"invoice.paid"` to `HANDLED_EVENTS`.
- For `customer.subscription.created/updated`: in addition to setting `profiles.billing_plan`, **upsert a `subscriptions` row** from the event object — `plan` from the price's product metadata (expand `items.data.price.product`) via `planFromProductMetadata`, `cadence` from the price `recurring.interval` (`month`→monthly, `year`→yearly), `status`, `seats` from `items.data[0].quantity`, `current_period_start/end` from the subscription. Keep the existing email-on-created behavior and the Team `teams` upsert, and set `teams.max_seats = seats`.
- For `invoice.paid`: read the subscription id from the invoice, fetch/derive the new `current_period_start/end`, and update the `subscriptions` row's period columns (this advances `period_key` → STT counter resets next period). No plan change.
- For `customer.subscription.deleted`: set `profiles.billing_plan='trial'` (existing) and `subscriptions.status='canceled'`.

The Stripe subscription event object needs richer typing than the current `StripeSubscription` (add `items.data[].price.recurring.interval`, `.price.product`, `.quantity`, `current_period_start/end`). Extend the local types accordingly.

- [ ] **Step 2: Extend `/api/billing/sync` to write the subscription row on return**

In `src/app/api/billing/sync/route.ts`: on checkout return (`session_id`), fetch the Checkout Session + its subscription from Stripe, then upsert the same `subscriptions` row (idempotent with the webhook — keyed by `user_id`, so a double-write is harmless). This makes the dashboard reflect the plan before the webhook lands.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/billing/webhook/route.ts src/app/api/billing/sync/route.ts
git commit -m "feat(billing): sync subscriptions table from webhooks + checkout return; invoice.paid period advance"
```

**Done (testable — webhooks, where bugs are silent):**
1. **Replay a real test-mode event:** complete a test Checkout for `pro_monthly`; verify `subscriptions` has one row with `plan='pro'`, `cadence='monthly'`, `seats=1`, `status='active'`, non-null `current_period_end`, and `profiles.billing_plan='pro'`.
2. **Team seat count:** complete `team_yearly` with quantity 3 → `subscriptions.seats=3`, `teams.max_seats=3`, `profiles.billing_plan='team'`.
3. **Period advance:** trigger an `invoice.paid` (Stripe CLI `stripe trigger invoice.paid` or a test renewal) → `current_period_start/end` move forward and `resolvePeriodKey` yields a different key than before (STT counter effectively resets).
4. **Idempotency:** run `/api/billing/sync` and let the webhook fire for the same session → still exactly one `subscriptions` row (no duplicate, no error).
5. **Signature guard intact:** a POST with a bad `stripe-signature` still returns 400 (existing `verifyStripeSignature` unchanged).

---

## Task 6: Trial data migration (14-day → 5-talk) — own rollback

This is the **only lot that touches existing production data/behavior**. It runs after webhooks/sync and before the pricing page. It is a behavior/code migration (no row mutation needed — trials stay `trial`, the 5-talk limit already exists), so rollback is a code revert plus leaving the now-unused reminder cron disabled.

**Files:**
- Modify/delete: `src/modules/billing/trial.ts` (+ its `trial.test.ts`)
- Modify: `src/app/api/cron/trial-reminders/route.ts` (or remove from scheduler)
- Modify: callers of `getTrialReminder` (dashboard trial banner)

- [ ] **Step 1: Find every caller of the 14-day reminder**

Run: `grep -rn "getTrialReminder\|trialDays\|TRIAL_DAYS\|trial-reminders" src/ | grep -v node_modules`
Expected: `src/modules/billing/trial.ts`, its test, the cron route, and the dashboard banner that renders `getTrialReminder`. Record them — these are the rollback surface.

- [ ] **Step 2: Replace the time-based trial banner with a usage-based one**

Rewrite `src/modules/billing/trial.ts` so the reminder is driven by **talks remaining** (out of 5) instead of days. Signature becomes `getTrialReminder({ copy, currentTalkCount })` returning the same `TrialReminder` shape, with messages like "il te reste {count} prise(s) de parole". Update `trial.test.ts` to assert on talk counts (e.g. 5 used → ended message; 2 used → "3 restantes"). Keep the CTA href `/pricing`.

- [ ] **Step 3: Repurpose or retire the reminder cron**

Either (a) change `/api/cron/trial-reminders` to email trial users who have used ≥4 of 5 talks but not converted (usage-based nudge), or (b) remove it from the scheduler and return early. Choose (a) if a nudge is wanted; otherwise (b). Update the cron's body so it no longer references `created_at` windows / `TRIAL_DAYS`.

- [ ] **Step 4: Update the dashboard banner caller**

Update the component that calls `getTrialReminder` to pass `currentTalkCount` (already available from the talks query) instead of `trialStartedAt`.

- [ ] **Step 5: Run tests**

Run: `npx tsx --test src/modules/billing/trial.test.ts && npm run typecheck`
Expected: PASS — no remaining references to `trialDays`/`trialStartedAt`.

- [ ] **Step 6: Commit**

```bash
git add src/modules/billing/trial.ts src/modules/billing/trial.test.ts \
        src/app/api/cron/trial-reminders/route.ts src/app/dashboard/page.tsx
git commit -m "feat(billing): trial migration 14-day countdown -> usage-based (5 talks)"
```

**Rollback plan:** `git revert <this commit>` restores the 14-day banner and cron; no DB change was made, so no data rollback is needed. If the reminder cron was removed from the scheduler, re-add its schedule entry. Trial users are unaffected either way (they remain `billing_plan='trial'`, capped at 5 talks throughout).

**Done (testable):** `getTrialReminder` no longer accepts `trialStartedAt`; a trial user with 5 talks sees the "trial ended / upgrade" message regardless of account age; `grep -rn "trialDays\|trialStartedAt" src/` returns nothing.

---

## Task 7: Pricing page (3 tiers, universal trial CTA, seat selector)

**Files:**
- Modify: `src/modules/pricing/plans.ts`, `src/modules/pricing/plans.test.ts`
- Modify: `src/modules/pricing/components/pricing-cards.tsx`
- Modify: `src/modules/pricing/components/pricing-page.tsx`
- Modify: `src/i18n/messages/fr.json`, `src/i18n/messages/en.json`

- [ ] **Step 1: Update pricing copy (fr + en)**

In both message files, under `pricing.plans`, set three tiers (drop the separate trial card; keep a trial CTA block). Use exact numbers:
- **Studio:** monthly `12 EUR`, yearly `99 EUR`, savings badge "économisez 45 €" / "Save €45".
- **Pro:** monthly `19 EUR`, yearly `159 EUR`, savings "économisez 69 €" / "Save €69", features = analytics de répétition, versions multiples, déclinaison multilingue, export branded sans watermark, partage & feedback.
- **Team:** monthly `6 EUR` /siège, yearly `49 EUR` /siège, savings "économisez 23 €/siège" / "Save €23/seat", min 3 seats, framing copy "Offre groupe — tarif dégressif par siège" explaining per-seat < Studio.
- Add `pricing.trialCta` = "Commencer l'essai gratuit · 5 talks · sans limite de temps · sans carte bancaire" (fr) / English equivalent.
- Update `pricing.description` to drop "14 jours" → "5 talks gratuits, sans carte bancaire".

- [ ] **Step 2: Update `plans.ts` for 3 paid tiers + per-seat Team**

Rewrite `getPricingPlans`/`getPricingCards` so the cards array is `[studio, pro, team]` (Studio `highlighted: true`), each with `monthly`/`yearly` prices and `savings`; add a `perSeat: boolean` flag (true for Team) and `minSeats` (3 for Team). Keep the serializable `PricingCard` shape used by the client component. The trial is no longer a card — expose `pricing.trialCta` separately for the page CTA.

- [ ] **Step 3: Update `plans.test.ts`**

Replace expectations: cards are `["studio","pro","team"]`; exactly one highlighted and it is `studio`; Pro yearly is `159 EUR` with a `/69/` savings badge; Team is `perSeat` with `minSeats === 3` and yearly `49 EUR`; verify the ~30% gap holds for each tier (`yearly <= monthly*12*0.72`).

- [ ] **Step 4: Run plans test**

Run: `npx tsx --test src/modules/pricing/plans.test.ts`
Expected: PASS.

- [ ] **Step 5: Render 3 tiers + Team seat selector**

In `pricing-cards.tsx`: render the 3 cards (badge stays on Studio via `highlighted`). For the Team card, add a seat stepper (min 3, default 3) that recomputes the displayed price (`seats × per-seat price`) and appends `&seats=<n>` to the checkout href. The CTA href becomes `/api/billing/checkout?plan=${card.id}_${cycle}&seats=${seats}&locale=${locale}` (seats omitted/1 for Studio/Pro).

- [ ] **Step 6: Add the universal trial CTA above the grid**

In `pricing-page.tsx`: render a prominent CTA block above the cards grid using `pricing.trialCta`, linking to `localizedPath("/signup?plan=trial", locale)`. This is the single entry point; emphasize "sans carte bancaire".

- [ ] **Step 7: Typecheck + tests + visual check**

Run: `npm run typecheck && npm test`
Expected: PASS. Then load `/fr/pricing` and confirm: 3 columns, Studio badged, toggle defaults to yearly, savings shown per tier, Team seat stepper blocks <3, trial CTA above the grid with "sans carte bancaire".

- [ ] **Step 8: Commit**

```bash
git add src/modules/pricing/ src/i18n/messages/fr.json src/i18n/messages/en.json
git commit -m "feat(pricing): 3 tiers (Studio/Pro/Team per-seat), universal trial CTA, seat selector"
```

**Done (testable):** `npm test` green; `/fr/pricing` shows exactly 3 priced cards with Studio recommended, a no-credit-card trial CTA above the grid, working monthly/yearly toggle, and a Team seat selector enforcing ≥3.

---

## Task 8: End-to-end tests (Playwright, Stripe test mode)

**Files:**
- Create/modify: `tests/e2e/pricing.spec.ts`, `tests/e2e/checkout.spec.ts`, `tests/e2e/trial-gates.spec.ts` (follow the existing Playwright layout used by `npm run test:e2e`).

- [ ] **Step 1: Pricing page E2E**

Assert: 3 priced cards render; toggling monthly/yearly changes the displayed prices; savings text is visible per tier; the Team seat stepper cannot go below 3 and the price scales with seats; the universal trial CTA is present above the grid with "sans carte bancaire".

- [ ] **Step 2: Checkout → subscription E2E (test mode)**

Drive a Pro monthly checkout with a Stripe test card; on dashboard return assert the plan reflects Pro; assert (via an authenticated API read or DB check) that a `subscriptions` row exists with `plan='pro'`. Then a Team checkout with seats=3 asserts `seats=3`.

- [ ] **Step 3: Trial gate E2E**

As a fresh trial user: create 5 talks, assert the 6th is blocked with the trial-limit message; export a PDF and assert the trial watermark is present; simulate reaching the STT cap (seed `usage_counters` to the cap) and assert the token endpoint returns `{ engine: "browser" }`.

- [ ] **Step 4: Run the E2E suite**

Run: `npm run test:e2e`
Expected: PASS (or documented skips where Stripe test-mode secrets aren't present in CI).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/
git commit -m "test(billing): E2E for pricing, checkout→subscription sync, trial gates"
```

**Done (testable):** `npm run test:e2e` green locally with Stripe test keys configured.

---

## Final verification

- [ ] `npm run typecheck` — no errors.
- [ ] `npm test` — all unit suites green (capabilities, active-plan, stt-metering, stripe-prices, checkout, plans, trial).
- [ ] `npm run lint` — clean (`--max-warnings=0`).
- [ ] `npm run test:e2e` — green with test-mode Stripe keys.
- [ ] Manual smoke: trial STT cap → browser fallback; Studio→Pro upgrade shows a proration line in Stripe; `/fr/pricing` renders 3 tiers + trial CTA.

---

## Spec coverage map (self-review)

| Spec section | Task(s) |
|---|---|
| §3 Data model (subscriptions, stt_sessions, usage_counters, +pro) | Task 1 |
| §4 Entitlements matrix, `can`, `sttCapFor`, `getActivePlan` | Tasks 2, 3a |
| §5 STT metering flow (reserve/confirm/sweep, period_key, PostHog) | Task 3 |
| §6 Stripe lookup_keys, per-seat, min-3, proration, no 14-day trial | Task 4 |
| §7 Webhooks + sync (invoice.paid period advance, product-metadata plan) | Task 5 |
| §8 Migration (trial 14-day→5-talk, copy, env) | Tasks 6 (trial), 7 (copy), 1 (schema) |
| §9 Pricing page (3 tiers, trial CTA, savings, seat selector, Studio badge) | Task 7 |
| §10 Tests (unit + E2E) | distributed; E2E in Task 8 |
| §11 Pro/Team feature gates posted (return "unavailable") | Task 2 (`can` returns false) + callers surface upsell (future feature specs) |
