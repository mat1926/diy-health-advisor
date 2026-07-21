# Usability evaluation & expansion options

Live product: https://health.emailmenow.com

## Snapshot

| Strengths | Gaps |
|-----------|------|
| Clear DIY loop (metrics → advice) | Cookie-only identity (no cross-device) |
| US units for height/weight | Full form every visit |
| Lenses, pH, life-expectancy compare | No saved history / trends |
| Strong disclaimers | Water still liters; no unit toggle |
| Free path works offline of Stripe | Plus billing not finished |
| | Browser-only mobile; text-heavy results |

**Main finding:** Usability expands fastest by reducing re-entry friction and remembering the user — not by adding more advice philosophies.

## Ranked options

### P0 — Quick wins (1–2 weeks)
1. **Remember last metrics** (localStorage) + “Run again”  
2. **Unit preferences** — lbs/kg, ft+in/cm, water cups vs liters  
3. **Finish Stripe Plus** — real checkout, clear locked-field UX  
4. **Mobile polish** — denser form, sticky CTA, collapsible disclaimers  

### P1 — Habit product (3–6 weeks)
5. **Magic-link accounts** — same plan across devices  
6. **Advice history + simple trends** (BMI, LE gap, pH over time)  
7. **PWA** — Add to Home Screen  
8. **Measure how-to cards** — RHR, saliva/urine pH, stress scale  

### P2 — Share & speed (alongside P1)
9. **Share / print / PDF** advice card for clinician visits  
10. **Goal wizards / presets** (“energy”, “stress pattern”, “metabolic”)  
11. **Compare two lenses** side-by-side (optional Plus)  

### P3 — Platform (later)
12. **Expo Android + iPhone** + store IAP ([MOBILE-APPS.md](./MOBILE-APPS.md))  
13. **Health Connect / Apple Health** import (steps, sleep, HR)  
14. **Multi-profile / household**  

## What not to prioritize yet
- More educator lenses (choice overload)  
- Stronger diagnostic language from pH or longevity  
- Native apps before auth + billing  

## Suggested sequence
**Quick wins → Stripe + auth + history → PWA → native apps**
