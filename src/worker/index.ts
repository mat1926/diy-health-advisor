import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateAdvice } from "./advice";
import {
  MEDICAL_DISCLAIMER,
  PLAN_LIMITS,
  requireBasicMetrics,
  sanitizeMetrics,
  type PlanId,
} from "./plans";
import {
  createPortalSession,
  getEntitlement,
  getStripe,
  handleStripeWebhook,
  linkCustomerKey,
  setEntitlement,
  type Env,
} from "./stripe";

type Variables = { clientKey: string; plan: PlanId };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use("/v1/*", cors());

app.use("/v1/*", async (c, next) => {
  const headerKey = c.req.header("x-client-key");
  const cookie = parseCookie(c.req.header("cookie") || "")["vg_client"];
  const clientKey = headerKey || cookie || crypto.randomUUID();
  c.set("clientKey", clientKey);
  const entitlement = await getEntitlement(c.env, clientKey);
  c.set("plan", entitlement.plan);
  await next();
  if (!cookie) {
    c.header(
      "Set-Cookie",
      `vg_client=${clientKey}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
    );
  }
});

app.get("/v1/health", (c) =>
  c.json({
    ok: true,
    app: c.env.APP_NAME || "VitalGauge",
    disclaimer: MEDICAL_DISCLAIMER,
  }),
);

app.get("/v1/plans", (c) =>
  c.json({
    disclaimer: MEDICAL_DISCLAIMER,
    plans: PLAN_LIMITS,
    publishableKey: c.env.STRIPE_PUBLISHABLE_KEY,
  }),
);

app.get("/v1/me", async (c) => {
  const entitlement = await getEntitlement(c.env, c.get("clientKey"));
  return c.json({
    clientKey: c.get("clientKey"),
    ...entitlement,
    limits: PLAN_LIMITS[entitlement.plan],
    disclaimer: MEDICAL_DISCLAIMER,
  });
});

app.post("/v1/advice", async (c) => {
  const plan = c.get("plan");
  const clientKey = c.get("clientKey");
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const metrics = sanitizeMetrics(plan, body);
  const missing = requireBasicMetrics(metrics);
  if (missing) return c.json({ error: missing, disclaimer: MEDICAL_DISCLAIMER }, 400);

  const dayKey = `usage:${clientKey}:${new Date().toISOString().slice(0, 10)}`;
  const used = Number((await c.env.SESSIONS.get(dayKey)) || "0");
  const limit = PLAN_LIMITS[plan].advicePerDay;
  if (used >= limit) {
    return c.json(
      {
        error: `Daily limit reached for the ${PLAN_LIMITS[plan].name} plan (${limit}/day).`,
        upgrade: plan === "free",
        disclaimer: MEDICAL_DISCLAIMER,
      },
      429,
    );
  }

  const advice = await generateAdvice(plan, metrics, c.env.OPENAI_API_KEY);
  await c.env.SESSIONS.put(dayKey, String(used + 1), { expirationTtl: 60 * 60 * 48 });

  return c.json({
    ...advice,
    usage: { used: used + 1, limit },
  });
});

app.post("/v1/checkout", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as { email?: string };
    const clientKey = c.get("clientKey");

    if (!c.env.STRIPE_SECRET_KEY) {
      return c.json(
        {
          error: "Stripe is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_PLUS.",
          setup: true,
        },
        503,
      );
    }

    const stripe = getStripe(c.env);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: c.env.STRIPE_PRICE_PLUS, quantity: 1 }],
      success_url: `${c.env.APP_URL}/app.html?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${c.env.APP_URL}/pricing.html?canceled=1`,
      allow_promotion_codes: true,
      customer_email: body.email || undefined,
      client_reference_id: clientKey,
      metadata: { clientKey, product: "vitalgauge_plus" },
    });

    if (!session.url) return c.json({ error: "Could not start checkout" }, 500);
    return c.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/v1/portal", async (c) => {
  try {
    const entitlement = await getEntitlement(c.env, c.get("clientKey"));
    if (!entitlement.customerId) {
      return c.json({ error: "No Stripe customer on this browser session yet." }, 400);
    }
    const url = await createPortalSession(c.env, entitlement.customerId);
    return c.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Portal failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/v1/checkout/confirm", async (c) => {
  // Fallback if webhook is delayed — confirm session and unlock Plus locally
  try {
    const { session_id: sessionId } = (await c.req.json()) as { session_id?: string };
    if (!sessionId) return c.json({ error: "session_id required" }, 400);
    const stripe = getStripe(c.env);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return c.json({ error: "Checkout not complete" }, 400);
    }
    const clientKey =
      session.client_reference_id || session.metadata?.clientKey || c.get("clientKey");
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (customerId) await linkCustomerKey(c.env, customerId, clientKey);
    await setEntitlement(c.env, clientKey, {
      plan: "plus",
      customerId,
      subscriptionId:
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id,
      email: session.customer_details?.email || session.customer_email || undefined,
    });
    return c.json({ ok: true, plan: "plus" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Confirm failed";
    return c.json({ error: message }, 500);
  }
});

app.post("/v1/webhooks/stripe", async (c) => {
  const raw = await c.req.text();
  return handleStripeWebhook(c.env, raw, c.req.header("stripe-signature") || null);
});

app.notFound(async (c) => {
  // Let assets binding handle SPA/static files when available
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text("Not found", 404);
});

export default {
  fetch: app.fetch,
};

function parseCookie(header: string): Record<string, string> {
  return Object.fromEntries(
    header
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf("=");
        return i === -1 ? [p, ""] : [decodeURIComponent(p.slice(0, i)), decodeURIComponent(p.slice(i + 1))];
      }),
  );
}
