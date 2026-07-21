import Stripe from "stripe";

export type Env = {
  ASSETS: Fetcher;
  SESSIONS: KVNamespace;
  APP_NAME: string;
  APP_URL: string;
  STRIPE_PRICE_PLUS: string;
  STRIPE_PUBLISHABLE_KEY: string;
  /** Amazon Associates Store ID / tracking ID (e.g. yourstore-20). Public; not a secret. */
  AMAZON_ASSOCIATE_TAG?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  OPENAI_API_KEY?: string;
};

export function getStripe(env: Env): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export async function createPortalSession(env: Env, customerId: string): Promise<string> {
  const stripe = getStripe(env);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.APP_URL}/app.html`,
  });
  return session.url;
}

export type Entitlement = {
  plan: "free" | "plus";
  customerId?: string;
  subscriptionId?: string;
  email?: string;
};

export async function getEntitlement(env: Env, clientKey: string): Promise<Entitlement> {
  const raw = await env.SESSIONS.get(`entitlement:${clientKey}`);
  if (!raw) return { plan: "free" };
  try {
    return JSON.parse(raw) as Entitlement;
  } catch {
    return { plan: "free" };
  }
}

export async function setEntitlement(
  env: Env,
  clientKey: string,
  entitlement: Entitlement,
): Promise<void> {
  await env.SESSIONS.put(`entitlement:${clientKey}`, JSON.stringify(entitlement));
}

export async function linkCustomerKey(
  env: Env,
  customerId: string,
  clientKey: string,
): Promise<void> {
  await env.SESSIONS.put(`customer:${customerId}`, clientKey);
}

export async function clientKeyForCustomer(
  env: Env,
  customerId: string,
): Promise<string | null> {
  return env.SESSIONS.get(`customer:${customerId}`);
}

export async function handleStripeWebhook(
  env: Env,
  rawBody: string,
  signature: string | null,
): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Webhook secret missing" }, { status: 500 });
  }
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe(env);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return Response.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const clientKey = session.client_reference_id || session.metadata?.clientKey;
      if (customerId && clientKey) {
        await linkCustomerKey(env, customerId, clientKey);
        await setEntitlement(env, clientKey, {
          plan: "plus",
          customerId,
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id,
          email: session.customer_details?.email || session.customer_email || undefined,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const clientKey = await clientKeyForCustomer(env, customerId);
      if (clientKey) {
        const active = ["active", "trialing", "past_due"].includes(sub.status);
        const existing = await getEntitlement(env, clientKey);
        await setEntitlement(env, clientKey, {
          ...existing,
          plan: active && event.type !== "customer.subscription.deleted" ? "plus" : "free",
          customerId,
          subscriptionId: sub.id,
        });
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
