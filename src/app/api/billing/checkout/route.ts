import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildStripeCheckoutPayload, getCheckoutPlan, getStripePriceId } from "@/modules/billing/checkout";
import { localizedPath, type Locale } from "@/i18n/routing";

export const runtime = "nodejs";

function requestOrigin(request: NextRequest) {
  // Prefer the configured public URL so Stripe success/cancel URLs are always correct behind the proxy.
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host") ?? "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function parseLocale(value: FormDataEntryValue | string | null): Locale {
  return value === "fr" ? "fr" : "en";
}

async function createCheckoutRedirect(request: NextRequest, input: { locale: Locale; planValue: FormDataEntryValue | string | null }) {
  const locale = input.locale;
  const plan = getCheckoutPlan(input.planValue);
  const origin = requestOrigin(request);

  if (!plan) {
    return NextResponse.redirect(new URL(localizedPath("/pricing?error=invalid-plan", locale), origin), 303);
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const signupUrl = new URL(localizedPath("/signup", locale), origin);
    signupUrl.searchParams.set("plan", plan.id);
    signupUrl.searchParams.set("checkout", "1");
    return NextResponse.redirect(signupUrl, 303);
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = getStripePriceId(plan);

  if (!secretKey || !priceId) {
    return NextResponse.redirect(new URL(localizedPath("/pricing?error=stripe-not-configured", locale), origin), 303);
  }

  const payload = buildStripeCheckoutPayload({
    cancelUrl: `${origin}${localizedPath("/pricing?checkout=cancelled", locale)}`,
    customerEmail: user.email,
    plan,
    priceId,
    successUrl: `${origin}${localizedPath("/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}", locale)}`,
    userId: user.id
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    body: payload,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    method: "POST"
  });

  const session = await response.json() as { error?: { message?: string }; url?: string };

  if (!response.ok || !session.url) {
    const pricingUrl = new URL(localizedPath("/pricing", locale), origin);
    pricingUrl.searchParams.set("error", session.error?.message ?? "stripe-checkout-failed");
    return NextResponse.redirect(pricingUrl, 303);
  }

  return NextResponse.redirect(session.url, 303);
}

export async function GET(request: NextRequest) {
  return createCheckoutRedirect(request, {
    locale: parseLocale(request.nextUrl.searchParams.get("locale")),
    planValue: request.nextUrl.searchParams.get("plan")
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  return createCheckoutRedirect(request, {
    locale: parseLocale(formData.get("locale")),
    planValue: formData.get("plan")
  });
}
