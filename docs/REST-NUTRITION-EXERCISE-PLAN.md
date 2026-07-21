# VitalGauge plan: Rest · Nutrition · Exercise

**Goal:** Every advice run returns a clear, actionable 7-day DIY plan under three pillars — **Rest**, **Nutrition**, **Exercise** — shaped by the user’s metrics, goal, and alternative wellness lens. Educational only; not medical advice.

**Live product:** https://health.emailmenow.com  
**Related:** [USABILITY-OPTIONS.md](./USABILITY-OPTIONS.md) · [MOBILE-APPS.md](./MOBILE-APPS.md)

---

## 1. Product outcome

Replace the flat `actions[]` list as the primary UX with three structured sections:

| Pillar | User sees | Free | Plus |
|--------|-----------|------|------|
| **Rest** | Sleep window, wind-down, stress downshift, recovery rules | 2–3 items | + RHR/stress/pH-aware recovery |
| **Nutrition** | Plate pattern, meal timing, hydration, food focus | 2–3 items | + deeper macros/timing by lens |
| **Exercise** | Weekly movement template (walk / strength / easy cardio) | 2–3 items | + steps/HR/goal-tuned volume |

Also keep: summary, life-expectancy compare, watch-outs, when to seek care, disclaimers.

### API shape (recommended)

```ts
pillars: {
  rest: { focus: string; items: string[]; weeklyTarget?: string };
  nutrition: { focus: string; items: string[]; weeklyTarget?: string };
  exercise: { focus: string; items: string[]; weeklyTarget?: string };
}
```

Template engine always fills this; AI (when keyed) must return the same JSON keys.

---

## 2. Decision rules (inputs → emphasis)

### 2.1 Shared signals

| Signal | Rest ↑ | Nutrition ↑ | Exercise ↑ / ↓ |
|--------|--------|--------------|----------------|
| Goal = sleep / stress | Primary | Steady blood sugar | Keep easy; avoid max intensity |
| Goal = energy | Circadian + sleep | Protein-forward meals | Walks + light strength |
| Goal = weight | Sleep protects appetite | Protein + veg; fewer UPFs | Steps + 2–3× strength |
| Goal = strength | Sleep 7–9h non‑negotiable | Protein spread across day | Progressive strength plan |
| Goal = general | Balanced | Whole-food plates | Walk most days + 2× strength |
| Activity sedentary/light | — | — | Emphasize daily walks first |
| Activity active/very_active | Emphasize recovery days | Fuel + electrolytes | Maintain; don’t add junk volume |
| BMI ≥ 30 (illustrative) | Sleep & stress first | Sustainable deficit habits | Low-impact + strength |
| BMI &lt; 18.5 | Recovery/fuel | Adequate calories/protein | Avoid aggressive deficit training |
| Sleep &lt; 6h (Plus) | **Top priority** | No aggressive fasting | Cut hard sessions |
| Stress ≥ 8 (Plus) | Breathing + recovery block | Anti-inflammatory plate | Zone-2 / walks only |
| RHR &gt; 100 (Plus) | Seek care note | — | Pause intensity; clinician |
| DIY pH logged (Plus) | Consistent timing logs | Food/hydration context | Don’t train off strip alone |

### 2.2 Lens modifiers (educational themes only)

| Lens | Rest | Nutrition | Exercise |
|------|------|-----------|----------|
| **Blend** | Sleep opportunity 7–9h | Protein + plants; less sugar | Walk + 2× strength |
| **Berg-style** | No hard fasting if sleep/stress poor | Lower refined carbs; electrolytes | Walking; strength 2–3× |
| **Ekberg-style** | Morning light + fixed wake | Whole foods; fewer UPFs | Strength + easy aerobic |
| **Axe-style** | Wind-down ritual | Cooked whole foods; fermented if tolerated | Daily movement; outdoor walks |
| **Jockers-style** | Daily downshift practice | Anti-inflammatory plate; gentle timing | Lift + walk; mild IF only if recovered |
| **Clark-style** | Quiet evening, clean sleep space | Filtered water; simpler ingredients | Outdoor walking; avoid overtraining |

**Guardrail:** Never prescribe cleanses, parasite protocols, or medication changes. Fasting language stays optional and mild (e.g. 12:12), and is **blocked** when sleep &lt; 6 or stress ≥ 8.

---

## 3. Recommended content libraries

### 3.1 Rest (recovery & nervous system)

**Default weekly target:** Protect **7–9 hours** in bed; same wake time ±30 min; one deliberate 10-minute downshift daily.

**Core items (pick 2–4):**
1. Fixed wake time + morning outdoor light 10–20 min.  
2. Caffeine cutoff ~8 hours before bed.  
3. Screens dimmed / off 60 min before bed; cool, dark room.  
4. 4-second inhale / 6-second exhale × 5 minutes (stress).  
5. One calendar “recovery block” weekly (no optional intensity).  
6. If sleep &lt; 6h: **sleep before intensity or fasting experiments**.  
7. If high stress: treat recovery as the main lever this week.

**Plus extras:** Use stress score + RHR + notes to prioritize rest over new diet/exercise experiments.

### 3.2 Nutrition (food patterns)

**Default weekly target:** Protein at each meal; vegetables most days; water with meals; one fewer ultra-processed snack/day.

**Core items (pick 2–4):**
1. Build plates: **protein + non-starchy veg + optional whole-food carb/fat**.  
2. First meal protein-forward (energy goal).  
3. Cut sugary drinks; prefer water / herbal tea / mineral water.  
4. Cook ≥3 home meals this week (Axe-style).  
5. If low-carb leaning (Berg): add leafy greens + electrolytes; don’t crash calories.  
6. If weight goal: 7-day log first; modest change, not a cleanse.  
7. Hydration: steady fluids; Plus uses water liters / later cups.  
8. Clark-style: filtered water + one simpler pantry/cleaner swap.

**Plus extras:** Tie meal timing to sleep (no heavy late meals if sleep goal); pH notes as **food/hydration logging context only**.

### 3.3 Exercise (movement)

**Default weekly target (free):**
- **Walk:** most days, 20–40 min (or post-meal 10–15 min × 2).  
- **Strength:** 2 sessions, 4–6 compound moves.  
- **Easy cardio:** optional 1 session if recovered.

**Progression by activity level:**

| Level | Week focus |
|-------|------------|
| Sedentary | Stand/walk breaks hourly; 10–15 min walks; 1 light strength intro |
| Light | Daily walk; 2× full-body strength 20–30 min |
| Moderate | Walk most days; 2–3× strength; 1 easy cardio |
| Active | Keep volume; add 1 quality strength session; 1 full rest day |
| Very active | Emphasize **deload / technique**; protect sleep |

**Goal overlays:**
- Strength → progressive overload emphasis.  
- Weight → steps + strength (muscle retention).  
- Stress/sleep → walking + mobility; no HIIT push.  
- Energy → morning walk + 2× strength.

**Stop rules (watch-outs):** chest pain, dizziness, unusual RHR elevation, illness, pregnancy/chronic disease → clinician first.

---

## 4. Example 7-day templates (output style)

### Example A — Free · goal energy · blend · sedentary
- **Rest:** Fixed wake; morning light; caffeine after lunch cut back.  
- **Nutrition:** Protein at breakfast; water with meals; one less sugary drink.  
- **Exercise:** Hourly stand breaks; 15-min walk daily; 2× beginner full-body (sit-to-stand, wall push-up, hip hinge).

### Example B — Plus · goal stress · Jockers · sleep 5.5h · stress 9
- **Rest (primary):** Sleep opportunity to 7h before any diet experiment; nightly breathing; weekend recovery block.  
- **Nutrition:** Anti-inflammatory plate; no fasting window this week.  
- **Exercise:** Easy walks only; skip hard intervals until sleep &gt; 6.5h average.

### Example C — Free · goal weight · Berg-style · moderate
- **Rest:** 7–9h opportunity; consistent bedtime.  
- **Nutrition:** Protein + veg first; reduce refined snacks; electrolytes if cutting carbs; no crash cleanse.  
- **Exercise:** 7–8k steps target; 2–3× strength; one rest day.

---

## 5. UI plan

1. **Results page** — three panels: Rest / Nutrition / Exercise (icons optional, keep brand).  
2. Each panel: **Focus** one-liner + bullet **items** + optional **weekly target**.  
3. Free: show all three (shorter). Plus: longer + “why this week” from metrics.  
4. Keep life-expectancy compare below or beside pillars.  
5. Collapsible full disclaimers.  
6. Later (usability P0): prefill last metrics so users re-run weekly plans easily.

---

## 6. Implementation plan

### Phase A — Structure (3–5 days)
1. Add `src/worker/pillars.ts` with rule tables + `buildPillars(plan, metrics, perspective)`.  
2. Extend `AdviceResult` with `pillars`.  
3. Wire template + AI prompt to require Rest/Nutrition/Exercise JSON.  
4. Render three panels in `app.html` / `app.js`.  
5. Deploy to `health.emailmenow.com`.

### Phase B — Depth (1 week)
1. Per-lens nutrition/exercise banks.  
2. Rest priority lock when sleep/stress poor.  
3. Printable “7-day card” (share/PDF later).  
4. Unit prefs for water (cups) feeding nutrition hydration line.

### Phase C — Habit loop (aligned with usability P1)
1. Save weekly plan history.  
2. “Start this week’s plan” checklist (client-side).  
3. Trend: did Rest/Exercise targets improve LE gap / BMI over time (illustrative).

---

## 7. Safety & compliance (non-negotiable)

- Every plan labeled **educational DIY**, not prescription.  
- No diagnose/treat/cure language.  
- Lens disclaimer retained (Berg/Ekberg/Axe/Jockers/Clark — not affiliated).  
- Life-expectancy remains illustrative only.  
- Emergency and “seek care” copy unchanged.  
- Fasting / low-carb intensifications suppressed when recovery metrics are poor.

---

## 8. Success metrics

| Metric | Target |
|--------|--------|
| % of advice responses with all 3 pillars | 100% |
| Free user completes a run without confusion (qualitative) | Clear scan of Rest/Nutrition/Exercise |
| Plus conversion reason mentions “plan / pH / deeper” | Track after Stripe live |
| Support/complaints about “sounds medical” | Near zero — soft wording review |

---

## 9. Recommended build order (decision)

1. **Implement Phase A now** — pillars in API + UI (highest clarity upgrade).  
2. Parallel: usability P0 (remember metrics + units).  
3. Then Stripe + auth so weekly plans can persist.

**Do next:** Approve Phase A → implement `pillars.ts` + UI panels on production.
