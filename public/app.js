async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.data = data;
    err.status = res.status;
    throw err;
  }
  return data;
}

function fillList(el, items) {
  el.innerHTML = "";
  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  }
}

function fillPillar(prefix, block) {
  if (!block) return;
  document.getElementById(`out-${prefix}-focus`).textContent = block.focus || "";
  document.getElementById(`out-${prefix}-target`).textContent = block.weeklyTarget
    ? `This week: ${block.weeklyTarget}`
    : "";
  fillList(document.getElementById(`out-${prefix}-items`), block.items || []);
}

function fillNutrientTable(tableId, rows) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const row of rows || []) {
    const tr = document.createElement("tr");
    const a = document.createElement("td");
    a.textContent = row.name || row[0] || "";
    const b = document.createElement("td");
    b.textContent = row.amount != null ? `${row.amount} ${row.unit || ""}`.trim() : row[1] || "";
    const c = document.createElement("td");
    c.textContent = row.note || row[2] || "";
    c.className = "muted";
    tr.append(a, b, c);
    tbody.appendChild(tr);
  }
}

function fillTargets(t, disclaimer) {
  const wrap = document.getElementById("out-targets-wrap");
  if (!t) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  document.getElementById("out-t-sleep").textContent = `${t.sleep.hoursTarget} hrs`;
  document.getElementById("out-t-sleep-detail").textContent =
    `Band ${t.sleep.hoursMin}–${t.sleep.hoursMax} hrs / night`;
  document.getElementById("out-t-cal").textContent = `${t.calories.dailyTarget} kcal`;
  document.getElementById("out-t-cal-detail").textContent =
    `BMR ~${t.calories.bmr} · TDEE ~${t.calories.tdee} · ${t.calories.goalAdjustment}`;
  document.getElementById("out-t-ex").textContent = `${t.exercise.dailyBurnTargetKcal} kcal/day`;
  document.getElementById("out-t-ex-detail").textContent =
    `Weekly ~${t.exercise.weeklyBurnTargetKcal} kcal intentional movement`;

  const macroBody = [
    { name: "Protein", amount: t.macros.proteinG, unit: "g", note: `${t.macros.proteinPct}% kcal` },
    { name: "Carbohydrates", amount: t.macros.carbsG, unit: "g", note: `${t.macros.carbsPct}% kcal` },
    { name: "Fat", amount: t.macros.fatG, unit: "g", note: `${t.macros.fatPct}% kcal` },
    { name: "Fiber", amount: t.macros.fiberG, unit: "g", note: "Educational daily fiber target" },
    { name: "Water", amount: t.macros.waterLiters, unit: "L", note: "Rough fluid target from body weight" },
  ];
  const tbody = document.querySelector("#out-t-macros tbody");
  tbody.innerHTML = "";
  for (const row of macroBody) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.name}</td><td>${row.amount} ${row.unit}</td><td class="muted">${row.note}</td>`;
    tbody.appendChild(tr);
  }

  fillNutrientTable("out-t-aa", t.aminoAcids);
  fillNutrientTable("out-t-vit", t.vitamins);
  fillNutrientTable("out-t-min", t.minerals);
  fillList(document.getElementById("out-t-ex-examples"), t.exercise.examples || []);
  document.getElementById("out-targets-disclaimer").textContent =
    t.disclaimer || disclaimer || "";
}

function fillNutritionKit(kit, disclaimer) {
  const wrap = document.getElementById("out-kit-wrap");
  if (!kit) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  document.getElementById("out-kit-title").textContent = kit.title || "Nutrition Kit plan";
  document.getElementById("out-kit-summary").textContent = kit.summary || "";
  document.getElementById("out-kit-protein").textContent = `${kit.daily.proteinTargetG} g`;
  document.getElementById("out-kit-protein-detail").textContent =
    `Food ~${kit.daily.proteinFromFoodG}g + whey ~${kit.daily.proteinFromWheyG}g · ${kit.daily.caloriesTarget} kcal/day`;
  document.getElementById("out-kit-whey").textContent = `${kit.daily.wheyScoops} scoop(s)`;
  document.getElementById("out-kit-whey-detail").textContent = "Confirm grams on your whey label";
  document.getElementById("out-kit-fluid").textContent = `~${kit.daily.waterLiters} L`;
  document.getElementById("out-kit-fluid-detail").textContent =
    `~${kit.daily.shakerFills}× 24 oz Strada fills (rough)`;

  const prod = document.getElementById("out-kit-products");
  prod.innerHTML = "";
  for (const p of kit.products || []) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = p.name;
    li.appendChild(a);
    li.appendChild(document.createTextNode(` — ${p.howToUse}`));
    if (p.caution) {
      li.appendChild(document.createTextNode(` Caution: ${p.caution}`));
    }
    prod.appendChild(li);
  }
  fillList(document.getElementById("out-kit-schedule"), kit.schedule || []);
  fillList(document.getElementById("out-kit-sample"), kit.sampleDay || []);
  fillList(document.getElementById("out-kit-gaps"), kit.gaps || []);
  document.getElementById("out-kit-disclaimer").textContent =
    kit.disclaimer || disclaimer || "";
}

function fillCoverageTable(tableId, rows) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = "";
  for (const row of rows || []) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${row.name}</td><td>${row.fromPlan} ${row.unit || ""}</td><td>${row.target} ${row.unit || ""}</td><td class="muted">${row.fromMulti || row.note || ""}</td>`;
    tbody.appendChild(tr);
  }
}

function fillFoodPlan(fp, disclaimer) {
  const wrap = document.getElementById("out-food-wrap");
  if (!fp) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  document.getElementById("out-food-title").textContent = fp.title || "Detailed food plan";
  document.getElementById("out-food-summary").textContent = fp.summary || "";
  document.getElementById("out-food-kit").textContent =
    `Kit base: ${fp.kitBase?.wheyScoops ?? 0} whey scoop(s) (~${fp.kitBase?.wheyProteinG ?? 0}g) · ${fp.kitBase?.multi || "multi"} · ${fp.kitBase?.d3Note || ""}`;
  document.getElementById("out-food-kcal").textContent = `${fp.dayTotals.kcal} kcal`;
  document.getElementById("out-food-kcal-detail").textContent =
    `Target ${fp.targets.kcal} · hit ${fp.macroHit.kcalPctOfTarget}%`;
  document.getElementById("out-food-protein").textContent = `${fp.dayTotals.proteinG} g`;
  document.getElementById("out-food-protein-detail").textContent =
    `Target ${fp.targets.proteinG}g · hit ${fp.macroHit.proteinPctOfTarget}%`;
  document.getElementById("out-food-cf").textContent =
    `${fp.dayTotals.carbsG}g / ${fp.dayTotals.fatG}g`;
  document.getElementById("out-food-cf-detail").textContent =
    `Targets ${fp.targets.carbsG}g carbs · ${fp.targets.fatG}g fat`;

  const mealsEl = document.getElementById("out-food-meals");
  mealsEl.innerHTML = "";
  for (const meal of fp.meals || []) {
    const block = document.createElement("div");
    block.style.marginBottom = "1rem";
    const h = document.createElement("h4");
    h.style.margin = "0 0 0.35rem";
    h.textContent = `${meal.name} · ${meal.totals.kcal} kcal (P ${meal.totals.proteinG}g · C ${meal.totals.carbsG}g · F ${meal.totals.fatG}g)`;
    const hint = document.createElement("p");
    hint.className = "muted";
    hint.style.margin = "0 0 0.35rem";
    hint.textContent = meal.timeHint || "";
    const ul = document.createElement("ul");
    for (const item of meal.items || []) {
      const li = document.createElement("li");
      li.textContent = `${item.name} — ${item.portion} · ${item.kcal} kcal · P${item.proteinG}/C${item.carbsG}/F${item.fatG}${item.kit ? " · kit" : ""}`;
      ul.appendChild(li);
    }
    block.append(h, hint, ul);
    mealsEl.appendChild(block);
  }

  fillCoverageTable("out-food-vit", fp.vitamins);
  fillCoverageTable("out-food-min", fp.minerals);
  fillCoverageTable("out-food-aa", fp.aminoAcids);
  fillList(document.getElementById("out-food-shop"), fp.shoppingList || []);
  fillList(document.getElementById("out-food-tips"), fp.prepTips || []);
  document.getElementById("out-food-disclaimer").textContent =
    fp.disclaimer || disclaimer || "";
}

function fillProgress(wp, disclaimer) {
  const wrap = document.getElementById("out-progress-wrap");
  if (!wp) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  document.getElementById("out-progress-summary").textContent =
    wp.toHealthyBmi?.summary || "";
  document.getElementById("out-progress-now").textContent =
    `${wp.current.weightLb} lb`;
  document.getElementById("out-progress-now-detail").textContent =
    `BMI ${wp.current.bmi} · ${wp.current.category}`;
  document.getElementById("out-progress-pace").textContent =
    `~${wp.pace.weeklyLossLb} lb/wk`;
  document.getElementById("out-progress-pace-detail").textContent =
    `~${wp.pace.monthlyLossLb} lb/mo · deficit ~${wp.plan.dailyDeficitKcal} kcal/day · ${wp.pace.note}`;
  document.getElementById("out-progress-goal").textContent =
    wp.toHealthyBmi.estimatedWeeks != null
      ? `~${wp.toHealthyBmi.estimatedWeeks} wks`
      : "—";
  document.getElementById("out-progress-goal-detail").textContent =
    `${wp.toHealthyBmi.poundsToGo} lb to go · target ~${wp.toHealthyBmi.targetWeightLb} lb`;

  const miles = (wp.milestones || []).map(
    (m) =>
      `Week ${m.weeks}: ~${m.weightLb} lb (BMI ${m.bmi}) · lost ~${m.lostLb} lb`,
  );
  fillList(document.getElementById("out-progress-milestones"), miles);
  document.getElementById("out-progress-hint").textContent =
    wp.modifiersHint || "";
  document.getElementById("out-progress-disclaimer").textContent =
    wp.disclaimer || disclaimer || "";

  const calSel = document.getElementById("adj-calories");
  const exSel = document.getElementById("adj-exercise");
  if (calSel && wp.plan) calSel.value = String(wp.plan.calorieAdjust || 0);
  if (exSel && wp.plan) exSel.value = String(wp.plan.exerciseBonusKcal || 0);
}

function fillDoctorReview(review, disclaimer) {
  const wrap = document.getElementById("out-doctor-wrap");
  if (!review || !review.cards?.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;

  const demo = document.getElementById("out-doctor-demo");
  if (review.demoNote) {
    demo.hidden = false;
    demo.textContent = review.demoNote;
  } else {
    demo.hidden = true;
  }

  fillList(
    document.getElementById("out-doctor-findings"),
    (review.findings || []).map((f) => `${f.label}: ${f.detail}`),
  );

  const cardsEl = document.getElementById("out-doctor-cards");
  cardsEl.innerHTML = "";
  for (const card of review.cards) {
    const article = document.createElement("article");
    article.className = "panel";
    article.style.marginBottom = "0.75rem";
    article.dataset.doctor = card.doctor.id;
    article.dataset.metric = card.metricKey;

    const badge = document.createElement("p");
    badge.className = "badge";
    badge.textContent = `${card.doctor.displayName} · ${card.metricLabel}`;

    const title = document.createElement("h4");
    title.style.margin = "0.35rem 0";
    title.textContent = card.rec.title;

    const finding = document.createElement("p");
    finding.className = "muted";
    finding.textContent = card.findingDetail;

    const rec = document.createElement("p");
    rec.textContent = card.rec.recommendation;

    const ul = document.createElement("ul");
    for (const tip of card.rec.lifestyle || []) {
      const li = document.createElement("li");
      li.textContent = tip;
      ul.appendChild(li);
    }

    const caution = document.createElement("p");
    caution.className = "muted";
    caution.style.fontSize = "0.9rem";
    caution.textContent = `Caution: ${card.rec.caution}`;

    article.append(badge, title, finding, rec, ul, caution);
    cardsEl.appendChild(article);
  }

  document.getElementById("out-doctor-disclaimer").textContent =
    review.disclaimer || disclaimer || "";
}

function renderAdviceResult(data) {
  document.getElementById("out-summary").textContent = data.summary;
  document.getElementById("out-meta").textContent =
    `Source: ${data.source} · usage ${data.usage?.used}/${data.usage?.limit}`;
  const lens = document.getElementById("out-lens");
  if (data.perspective?.label) {
    lens.hidden = false;
    lens.textContent = data.perspective.label;
  } else {
    lens.hidden = true;
  }

  const pillarsEl = document.getElementById("out-pillars");
  if (data.pillars?.rest && data.pillars?.nutrition && data.pillars?.exercise) {
    pillarsEl.hidden = false;
    fillPillar("rest", data.pillars.rest);
    fillPillar("nutrition", data.pillars.nutrition);
    fillPillar("exercise", data.pillars.exercise);
  } else {
    pillarsEl.hidden = true;
  }

  fillTargets(data.targets, data.targetsDisclaimer);
  fillNutritionKit(data.nutritionKit, data.nutritionKitDisclaimer);
  fillFoodPlan(data.foodPlan, data.foodPlanDisclaimer);
  fillProgress(data.weightProgress, data.progressDisclaimer);
  fillDoctorReview(data.doctorReview, data.doctorDbDisclaimer);

  const themesWrap = document.getElementById("out-themes-wrap");
  if (data.perspective?.themes?.length) {
    themesWrap.hidden = false;
    fillList(document.getElementById("out-themes"), data.perspective.themes);
  } else {
    themesWrap.hidden = true;
  }

  const lifeWrap = document.getElementById("out-life-wrap");
  const le = data.lifeExpectancy;
  if (le?.current && le?.ideal) {
    lifeWrap.hidden = false;
    document.getElementById("out-life-summary").textContent = le.comparison?.summary || "";
    document.getElementById("out-life-current").textContent =
      `~${le.current.expectedAge} yrs expected age`;
    document.getElementById("out-life-current-detail").textContent =
      `~${le.current.remainingYears} years remaining · BMI ${le.current.bmi ?? "—"} · adj ${le.current.adjustmentsYears >= 0 ? "+" : ""}${le.current.adjustmentsYears} yrs`;
    document.getElementById("out-life-ideal").textContent =
      `~${le.ideal.expectedAge} yrs expected age`;
    document.getElementById("out-life-ideal-detail").textContent =
      `~${le.ideal.remainingYears} years remaining · BMI ${le.ideal.bmi}` +
      (le.ideal.idealWeightLb ? ` (~${le.ideal.idealWeightLb} lbs at your height)` : "");
    fillList(document.getElementById("out-life-assumptions"), le.ideal.assumptions || []);
    document.getElementById("out-life-disclaimer").textContent =
      le.disclaimer || data.lifeExpectancyDisclaimer || "";
  } else {
    lifeWrap.hidden = true;
  }

  const actionsWrap = document.getElementById("out-actions-wrap");
  if (data.actions?.length) {
    actionsWrap.hidden = false;
    fillList(document.getElementById("out-actions"), data.actions);
  } else {
    actionsWrap.hidden = true;
  }
  fillList(document.getElementById("out-watchouts"), data.watchouts);
  fillList(document.getElementById("out-care"), data.whenToSeekCare);
  document.getElementById("out-disclaimer").textContent = data.disclaimer;
  document.getElementById("out-lens-disclaimer").textContent =
    data.lensDisclaimer || "";
}

async function boot() {
  const form = document.getElementById("metrics-form");
  const badge = document.getElementById("plan-badge");
  const sub = document.getElementById("plan-sub");
  const upsell = document.getElementById("plus-upsell");
  const portalBtn = document.getElementById("portal-btn");
  const errorEl = document.getElementById("form-error");
  const result = document.getElementById("result");
  let lastPayload = null;

  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id");
  if (sessionId) {
    try {
      await api("/v1/checkout/confirm", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
      });
      history.replaceState({}, "", "/app.html?upgraded=1");
    } catch {
      // webhook may still catch up
    }
  }

  const me = await api("/v1/me");
  const plan = me.plan || "free";
  badge.textContent = `Plan: ${me.limits?.name || plan}`;
  sub.textContent = `${me.limits?.name || plan} · ${me.limits?.advicePerDay ?? "?"} advice runs / day`;
  document.body.classList.toggle("plan-plus", plan === "plus");
  form.classList.toggle("plan-plus", plan === "plus");
  upsell.hidden = plan === "plus";
  if (me.customerId) {
    portalBtn.hidden = false;
    portalBtn.onclick = async () => {
      try {
        const { url } = await api("/v1/portal", { method: "POST", body: "{}" });
        location.href = url;
      } catch (e) {
        alert(e.message);
      }
    };
  }

  function buildPayloadFromForm() {
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    for (const key of [
      "age",
      "heightFt",
      "heightIn",
      "weightLb",
      "restingHeartRate",
      "bpSystolic",
      "bpDiastolic",
      "standingBpSystolic",
      "standingBpDiastolic",
      "salivaPh",
      "urinePh",
      "urineSpecificGravity",
      "sleepHours",
      "stressLevel",
      "stepsPerDay",
      "waterLiters",
      "calorieAdjust",
      "exerciseBonusKcal",
    ]) {
      if (payload[key] === "" || payload[key] == null) delete payload[key];
      else if (payload[key] != null) payload[key] = Number(payload[key]);
    }
    for (const key of [
      "urineGlucose",
      "urineBilirubin",
      "urineKetone",
      "urineBlood",
      "urineProtein",
      "urineUrobilinogen",
      "urineNitrite",
      "urineLeukocytes",
    ]) {
      if (payload[key] === "" || payload[key] == null) delete payload[key];
    }
    return payload;
  }

  async function runAdvice(payload, { scroll = true } = {}) {
    errorEl.hidden = true;
    const data = await api("/v1/advice", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    lastPayload = { ...payload };
    renderAdviceResult(data);
    result.hidden = false;
    if (scroll) result.scrollIntoView({ behavior: "smooth", block: "start" });
    return data;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    result.hidden = true;
    const payload = buildPayloadFromForm();
    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Working…";
    try {
      await runAdvice(payload);
    } catch (err) {
      errorEl.hidden = false;
      errorEl.textContent = err.message;
      if (err.data?.upgrade) {
        errorEl.innerHTML = `${err.message} <a href="/pricing.html">Upgrade to Plus</a>`;
      }
    } finally {
      btn.disabled = false;
      btn.textContent = "Get my 7-day plan";
    }
  });

  const updateBtn = document.getElementById("btn-update-forecast");
  if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
      if (!lastPayload) {
        alert("Submit your metrics first to generate a plan.");
        return;
      }
      const calorieAdjust = Number(document.getElementById("adj-calories").value || 0);
      const exerciseBonusKcal = Number(document.getElementById("adj-exercise").value || 0);
      const payload = {
        ...lastPayload,
        calorieAdjust,
        exerciseBonusKcal,
      };
      if (!calorieAdjust) delete payload.calorieAdjust;
      if (!exerciseBonusKcal) delete payload.exerciseBonusKcal;
      updateBtn.disabled = true;
      updateBtn.textContent = "Updating…";
      try {
        await runAdvice(payload, { scroll: false });
        document.getElementById("out-progress-wrap")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } catch (err) {
        alert(err.message || "Could not update forecast");
      } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = "Update forecast & food plan";
      }
    });
  }

  const demoBtn = document.getElementById("btn-demo-vitals");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      const set = (name, value) => {
        const el = form.elements.namedItem(name);
        if (el) el.value = value;
      };
      set("bpSystolic", "158");
      set("bpDiastolic", "96");
      set("standingBpSystolic", "132");
      set("standingBpDiastolic", "84");
      set("salivaPh", "6.0");
      set("reviewDoctor", "all");
      const perspective = form.elements.namedItem("perspective");
      if (perspective) perspective.value = "alternative";
    });
  }

  const filterDoctorBtn = document.getElementById("btn-filter-doctor");
  if (filterDoctorBtn) {
    filterDoctorBtn.addEventListener("click", async () => {
      if (!lastPayload) {
        alert("Submit your metrics first.");
        return;
      }
      const reviewDoctor = document.getElementById("out-doctor-filter").value || "all";
      const formSel = form.elements.namedItem("reviewDoctor");
      if (formSel) formSel.value = reviewDoctor;
      filterDoctorBtn.disabled = true;
      filterDoctorBtn.textContent = "Filtering…";
      try {
        await runAdvice({ ...lastPayload, reviewDoctor }, { scroll: false });
        document.getElementById("out-doctor-wrap")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } catch (err) {
        alert(err.message || "Could not filter doctor review");
      } finally {
        filterDoctorBtn.disabled = false;
        filterDoctorBtn.textContent = "Apply doctor filter";
      }
    });
  }
}

boot().catch((err) => {
  const errorEl = document.getElementById("form-error");
  errorEl.hidden = false;
  errorEl.textContent = err.message || "Failed to load app";
});
