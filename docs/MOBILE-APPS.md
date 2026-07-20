# VitalGauge — Android & iPhone app map

Production web API: `https://health.emailmenow.com/v1`  
Goal: freemium DIY metrics → advice apps with the same medical disclaimers as the site.

## Recommendation

| Approach | Use when |
|----------|----------|
| **Expo (React Native)** — recommended | One codebase for Android + iPhone, native UX, proper store billing |
| Capacitor wrapping the web UI | Fast prototype shell only |
| PWA (Add to Home Screen) | Week-1 bridge on the existing site |
| Separate Swift + Kotlin | Only if you later need deep native/HealthKit polish |

**Do not** rely on Stripe Checkout alone inside App Store / Play builds for unlocking Plus. Apple and Google expect **in-app purchases** for digital subscriptions.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│ iOS (Expo)      │────▶│                  │────▶│ Advice engine       │
│ Android (Expo)  │     │  /v1 API Worker  │     │ (AI or template)    │
│ Web / PWA       │────▶│  health.emn.com  │────▶│ Entitlements (KV)   │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
         │                        ▲
         │                        │ verify
         ▼                        │
   StoreKit / Play Billing ───────┘
   (apps)     Stripe webhooks (website)
```

Server remains source of truth: `plan = free | plus`.

## Phases

### Phase 0 — PWA bridge (≈1 week)
- `manifest.webmanifest`, icons, basic installability on `health.emailmenow.com`
- Same free form + disclaimer; no store listing yet

### Phase 1 — Backend ready for apps (≈2 weeks)
- Real accounts (email magic link or OAuth)
- Bearer tokens (cookie-only sessions are not enough for mobile)
- `/v1/me`, `/v1/advice`, usage limits work for signed-in users across devices

### Phase 2 — Expo MVP (≈4–5 weeks)
Screens: onboarding disclaimer → metrics → advice → account → paywall → legal  
Ship to TestFlight + Play internal testing on **free plan** first

### Phase 3 — Store billing (≈3–4 weeks)
- iOS: StoreKit 2 + App Store Server Notifications
- Android: Play Billing + Real-time developer notifications
- Server verifies receipts and sets Plus
- Restore Purchases required on iOS

### Phase 4 — Public launch (≈2–3 weeks)
- Privacy policy + support URLs on the domain
- Store screenshots, descriptions (no diagnose/treat claims)
- App Store privacy labels / Play Data safety
- Production rollout

**Rough calendar:** ~10–14 weeks to public MVP on both stores (one developer, part-focused).

## Free vs Plus (same as web)

| | Free | Plus |
|---|------|------|
| Inputs | Age, height, weight, activity, goal | + sleep, stress, HR, steps, water, notes |
| Daily advice | 3 | 50 |
| Pay on web | — | Stripe Checkout |
| Pay in apps | — | Apple IAP / Google Play Billing |

## Compliance (non-negotiable)

- App is **educational DIY wellness guidance**, not a medical device or clinician
- Disclaimer before first advice; always visible on results
- No emergency-care positioning
- Privacy policy covers health-ish metrics
- Support contact for store listings

## Repo workstreams

1. **diy-health-advisor (Worker)** — auth, tokens, store verify webhooks  
2. **New `apps/vitalgauge-mobile` (Expo)** — UI + API client + IAP  
3. **Web PWA** — manifest on current `public/`  
4. **Ops** — Apple Developer, Play Console, aligned Plus product IDs  

## Suggested next build

1. PWA manifest on the live site  
2. Magic-link auth on `/v1`  
3. Scaffold Expo app pointed at `https://health.emailmenow.com/v1`
