# VitalGauge (diy-health-advisor)

DIY health metrics → AI-enhanced wellness guidance, with hard medical disclaimers.

**Not a doctor. Not a diagnosis. Not emergency care.**

## What it does

1. Person enters metrics (free: basics; Plus: richer inputs).
2. API returns a short summary, actions, watch-outs, and “when to seek care”.
3. Every response includes a medical disclaimer.

## Plans

| Plan | Price | Inputs | Daily advice runs |
|------|-------|--------|-------------------|
| **Free** | $0 | Age, sex, height, weight, activity, goal | 3 |
| **Plus** | $9/mo (Stripe) | + sleep, stress, resting HR, steps, water, notes | 50 |

Charging model: **freemium SaaS** via Stripe Billing.

- Upgrade: Stripe Checkout (hosted subscription)
- Cancel / update card: Stripe Customer Portal
- Entitlements synced by webhooks (+ checkout confirm fallback)

## Stack

- Cloudflare Workers + static assets (`public/`)
- [Hono](https://hono.dev) API
- KV for session entitlement + daily usage
- Optional OpenAI (`OPENAI_API_KEY`) — falls back to safe template advice

## Quick start

```bash
npm install
cp .env.example .dev.vars
# edit .dev.vars with Stripe test keys (optional for free-plan demo)
npx wrangler kv namespace create SESSIONS
npx wrangler kv namespace create SESSIONS --preview
# paste ids into wrangler.jsonc
npm run dev
```

Open http://localhost:8787

Free-plan advice works without Stripe or OpenAI.

## Stripe setup

1. Create a Product **VitalGauge Plus** with a recurring Price ($9/month).
2. Put the Price id in `wrangler.jsonc` → `STRIPE_PRICE_PLUS`.
3. Secrets:

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put OPENAI_API_KEY   # optional
```

4. Webhook endpoint: `POST /api/webhooks/stripe`  
   Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

5. Set `APP_URL` to your deployed origin (success/cancel/portal return URLs).

6. Enable Customer Portal in the Stripe Dashboard (cancel + payment method update).

## API

- `GET /api/health` — liveness + disclaimer
- `GET /api/plans` — plan catalog
- `GET /api/me` — current browser session plan
- `POST /api/advice` — metrics → guidance
- `POST /api/checkout` — start Plus subscription
- `POST /api/portal` — billing portal
- `POST /api/webhooks/stripe` — Stripe events

## Disclaimer (product)

VitalGauge provides general wellness information for educational and DIY self-tracking purposes only. It is not medical advice, diagnosis, or treatment, and it is not a substitute for professional care from a licensed clinician. Do not use this tool for emergencies.

## Deploy

```bash
npm run deploy
```

## License

Private / all rights reserved unless you add a license.
