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

function withAssociateTag(url, tag) {
  const t = (tag || "").trim();
  if (!t || !url) return url;
  try {
    const u = new URL(url);
    if (!/amazon\./i.test(u.hostname)) return url;
    u.searchParams.set("tag", t);
    return u.toString();
  } catch {
    return url;
  }
}

function applyAmazonAffiliateUi(associateTag, disclosure) {
  const note = document.getElementById("amazon-affiliate-note");
  const kitAff = document.getElementById("out-kit-affiliate");
  const bundlesAff = document.getElementById("kit-bundles-affiliate");
  const multistix = document.getElementById("multistix-link");
  if (associateTag && multistix) {
    multistix.href = withAssociateTag(multistix.href, associateTag);
    multistix.rel = "noopener noreferrer sponsored";
  }
  for (const el of [note, kitAff, bundlesAff]) {
    if (!el) continue;
    if (disclosure) {
      el.hidden = false;
      el.textContent = disclosure;
    } else {
      el.hidden = true;
      el.textContent = "";
    }
  }
}

function fillKitBundles(bundles) {
  const wrap = document.getElementById("kit-bundles");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (const b of bundles || []) {
    const row = document.createElement("div");
    row.className = "kit-bundle";

    const photos = (b.products || []).filter((p) => p.imageUrl);
    if (photos.length) {
      const hero = document.createElement("div");
      hero.className = "kit-bundle-hero-grid";
      for (const p of photos.slice(0, 6)) {
        const a = document.createElement("a");
        a.href = p.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer sponsored";
        a.title = p.name;
        const img = document.createElement("img");
        img.src = p.imageUrl;
        img.alt = p.name;
        img.loading = "lazy";
        a.appendChild(img);
        hero.appendChild(a);
      }
      row.appendChild(hero);
    }

    const title = document.createElement("strong");
    title.textContent = b.name;
    const summary = document.createElement("p");
    summary.className = "muted";
    summary.textContent = `${b.summary} · ${b.asins?.length || b.products?.length || 0} items`;

    const link = document.createElement("a");
    link.className = "btn btn-primary";
    link.href = b.cartUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer sponsored";
    link.textContent = "Add all to Amazon cart";
    row.append(title, summary, link);
    wrap.appendChild(row);
  }
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

function fillNutritionKit(kit, disclaimer) {
  const wrap = document.getElementById("out-kit-wrap");
  if (!kit) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  document.getElementById("out-kit-title").textContent = kit.title || "Nutrition Kit plan";
  const kitIllust = document.getElementById("out-kit-illustration");
  if (kitIllust) {
    if (kit.illustrationUrl) {
      kitIllust.hidden = false;
      kitIllust.src = kit.illustrationUrl;
      kitIllust.alt = kit.title || "Nutrition Kit";
    } else {
      kitIllust.hidden = true;
    }
  }
  document.getElementById("out-kit-summary").textContent = kit.summary || "";
  document.getElementById("out-kit-protein").textContent = `${kit.daily.proteinTargetG} g`;
  document.getElementById("out-kit-protein-detail").textContent =
    kit.title && kit.title.toLowerCase().includes("alternative")
      ? `Food ~${kit.daily.proteinFromFoodG}g + whey ~${kit.daily.proteinFromWheyG}g`
      : `Food ~${kit.daily.proteinFromFoodG}g + whey ~${kit.daily.proteinFromWheyG}g · ${kit.daily.caloriesTarget} kcal/day`;
  document.getElementById("out-kit-whey").textContent = `${kit.daily.wheyScoops} scoop(s)`;
  document.getElementById("out-kit-whey-detail").textContent = "Confirm grams on your whey label";
  document.getElementById("out-kit-fluid").textContent = `~${kit.daily.waterLiters} L`;
  document.getElementById("out-kit-fluid-detail").textContent =
    `~${kit.daily.shakerFills}× 24 oz Strada fills (rough)`;

  const prod = document.getElementById("out-kit-products");
  prod.innerHTML = "";
  for (const p of kit.products || []) {
    const li = document.createElement("li");
    li.className = "kit-product-row";
    if (p.imageUrl) {
      const thumb = document.createElement("img");
      thumb.className = "kit-product-thumb";
      thumb.src = p.imageUrl;
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.width = 48;
      thumb.height = 48;
      li.appendChild(thumb);
    }
    const body = document.createElement("div");
    const a = document.createElement("a");
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer sponsored";
    a.textContent = p.name;
    body.appendChild(a);
    body.appendChild(document.createTextNode(` — ${p.howToUse}`));
    if (p.caution) {
      body.appendChild(document.createTextNode(` Caution: ${p.caution}`));
    }
    li.appendChild(body);
    prod.appendChild(li);
  }
  fillList(document.getElementById("out-kit-schedule"), kit.schedule || []);
  fillList(document.getElementById("out-kit-sample"), kit.sampleDay || []);

  const d3Wrap = document.getElementById("out-kit-d3-wrap");
  const d3Notice = document.getElementById("out-kit-d3-notice");
  const d3Symptoms = document.getElementById("out-kit-d3-symptoms");
  if (d3Wrap && d3Notice && d3Symptoms) {
    d3Wrap.hidden = false;
    d3Notice.textContent =
      kit.vitaminDOverloadNotice ||
      "Stop Vitamin D3 and seek care if overload symptoms appear.";
    fillList(d3Symptoms, kit.vitaminDOverloadSymptoms || []);
  }

  document.getElementById("out-kit-disclaimer").textContent =
    kit.disclaimer || disclaimer || "";
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
  if (fp.priorityGoals) {
    document.getElementById("out-food-kit").textContent =
      `${fp.priorityGoals.note} Protein hit ~${fp.priorityGoals.proteinHitPct}% · AA ~${fp.priorityGoals.aminoAcidHitPct}%. ${fp.priorityGoals.vitaminNote} ${fp.priorityGoals.mineralNote} ${fp.priorityGoals.carbsFatNote}`;
  } else {
    document.getElementById("out-food-kit").textContent =
      `Kit base: ${fp.kitBase?.wheyScoops ?? 0} whey scoop(s) (~${fp.kitBase?.wheyProteinG ?? 0}g protein · ~${fp.kitBase?.wheyKcal ?? 0} kcal) · ${fp.kitBase?.multi || "multi"} · ${fp.kitBase?.d3Note || ""}`;
  }
  const altFood =
    fp.priorityGoals?.mode === "alt_protein_micros" || fp.style === "alternative";
  const cfWrap = document.getElementById("out-food-stat-cf-wrap");
  if (altFood) {
    document.getElementById("out-food-primary-badge").textContent = "Protein from kit";
    document.getElementById("out-food-primary-stat").textContent = `${fp.dayTotals.proteinG} g`;
    document.getElementById("out-food-primary-detail").textContent =
      `Goal ${fp.targets.proteinG}g · hit ${fp.macroHit.proteinPctOfTarget}%`;
    document.getElementById("out-food-secondary-badge").textContent = "Shortfalls";
    document.getElementById("out-food-secondary-stat").textContent =
      `${(fp.shortfalls || []).length}`;
    document.getElementById("out-food-secondary-detail").textContent =
      "Nutrients still below target after kit — see options";
    if (cfWrap) cfWrap.hidden = true;
  } else {
    document.getElementById("out-food-primary-badge").textContent = "Day kcal";
    document.getElementById("out-food-primary-stat").textContent = `${fp.dayTotals.kcal} kcal`;
    document.getElementById("out-food-primary-detail").textContent =
      `Target ${fp.targets.kcal} · hit ${fp.macroHit.kcalPctOfTarget}%`;
    document.getElementById("out-food-secondary-badge").textContent = "Protein";
    document.getElementById("out-food-secondary-stat").textContent = `${fp.dayTotals.proteinG} g`;
    document.getElementById("out-food-secondary-detail").textContent =
      `Target ${fp.targets.proteinG}g · hit ${fp.macroHit.proteinPctOfTarget}%`;
    if (cfWrap) cfWrap.hidden = false;
    document.getElementById("out-food-cf").textContent =
      `${fp.dayTotals.carbsG}g / ${fp.dayTotals.fatG}g`;
    document.getElementById("out-food-cf-detail").textContent =
      `Targets ${fp.targets.carbsG}g carbs · ${fp.targets.fatG}g fat · fiber ${fp.targets.fiberG}g`;
  }

  const evalWrap = document.getElementById("out-food-stack-eval-wrap");
  if (evalWrap) {
    if (altFood && (fp.shortfallStackEvaluation || []).length) {
      evalWrap.hidden = false;
      fillList(
        document.getElementById("out-food-stack-eval"),
        fp.shortfallStackEvaluation || [],
      );
    } else {
      evalWrap.hidden = true;
    }
  }

  const shortWrap = document.getElementById("out-food-shortfalls-wrap");
  const shortBody = document.querySelector("#out-food-shortfalls tbody");
  if (shortWrap && shortBody) {
    if (altFood && (fp.shortfalls || []).length) {
      shortWrap.hidden = false;
      shortBody.innerHTML = "";
      for (const s of fp.shortfalls) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.category}</td><td>${s.name}</td><td>${s.fromKit} / ${s.target} ${s.unit}</td><td><strong>${s.shortfall} ${s.unit}</strong></td><td class="muted">${(s.suggestions || []).join(" · ")}</td>`;
        shortBody.appendChild(tr);
      }
    } else {
      shortWrap.hidden = true;
      shortBody.innerHTML = "";
    }
  }

  const kitMacroWrap = document.getElementById("out-food-kit-macro-wrap");
  const kitBody = document.querySelector("#out-food-kit-macro tbody");
  if (kitBody) {
    kitBody.innerHTML = "";
    for (const row of fp.kitMacroGaps || []) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${row.nutrient}</td><td>${row.target} ${row.unit}</td><td>${row.fromKit} ${row.unit}</td><td><strong>${row.stillNeededFromFood} ${row.unit}</strong></td><td>${row.kitCoversPct}%</td>`;
      tr.title = row.verdict || "";
      kitBody.appendChild(tr);
    }
  }
  if (kitMacroWrap) {
    kitMacroWrap.hidden = altFood && !(fp.kitMacroGaps || []).length;
  }

  const itemHead = document.getElementById("out-food-itemized-head");
  const itemBody = document.querySelector("#out-food-itemized tbody");
  const itemizedTitle = document.getElementById("out-food-itemized-title");
  const itemizedWrap = itemBody?.closest(".table-wrap") || itemBody?.parentElement;
  if (altFood) {
    // Avoid duplicating the same stack as both itemized rows and meal blocks
    if (itemizedTitle) itemizedTitle.hidden = true;
    if (itemizedWrap) itemizedWrap.hidden = true;
  } else {
    if (itemizedTitle) {
      itemizedTitle.hidden = false;
      itemizedTitle.textContent = "Itemized day plan (every food)";
    }
    if (itemizedWrap) itemizedWrap.hidden = false;
    if (itemHead) {
      itemHead.innerHTML =
        "<tr><th>#</th><th>Meal</th><th>Food</th><th>Portion</th><th>kcal</th><th>P</th><th>C</th><th>F</th><th>Source</th></tr>";
    }
    if (itemBody) {
      itemBody.innerHTML = "";
      for (const row of fp.itemized || []) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.line}</td><td>${row.meal}</td><td>${row.food}</td><td>${row.portion}</td><td>${row.kcal}</td><td>${row.proteinG}</td><td>${row.carbsG}</td><td>${row.fatG}</td><td>${row.source}</td>`;
        itemBody.appendChild(tr);
      }
    }
  }

  const mealsEl = document.getElementById("out-food-meals");
  mealsEl.innerHTML = "";
  for (const meal of fp.meals || []) {
    const block = document.createElement("div");
    block.style.marginBottom = "1rem";
    const h = document.createElement("h4");
    h.style.margin = "0 0 0.35rem";
    h.textContent = altFood
      ? `${meal.name} (${meal.timeHint || ""}) · P ${meal.totals.proteinG}g`
      : `${meal.name} (${meal.timeHint || ""}) · ${meal.totals.kcal} kcal · P ${meal.totals.proteinG}g · C ${meal.totals.carbsG}g · F ${meal.totals.fatG}g`;
    const table = document.createElement("table");
    table.className = "data-table";
    table.innerHTML = altFood
      ? "<thead><tr><th>Kit item</th><th>Portion</th><th>Protein</th><th>Source</th></tr></thead>"
      : "<thead><tr><th>Food</th><th>Portion</th><th>kcal</th><th>Protein</th><th>Carbs</th><th>Fat</th><th>Source</th></tr></thead>";
    const tbody = document.createElement("tbody");
    for (const item of meal.items || []) {
      const tr = document.createElement("tr");
      if (altFood) {
        tr.innerHTML = `<td>${item.name}</td><td>${item.portion}</td><td>${item.proteinG}g</td><td>${item.kit ? "kit" : "food"}</td>`;
      } else {
        tr.innerHTML = `<td>${item.name}</td><td>${item.portion}</td><td>${item.kcal}</td><td>${item.proteinG}g</td><td>${item.carbsG}g</td><td>${item.fatG}g</td><td>${item.kit ? "kit" : "food"}</td>`;
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    block.append(h, table);
    mealsEl.appendChild(block);
  }

  const mealsTitle = document.getElementById("out-food-meals-title");
  if (mealsTitle) {
    mealsTitle.textContent = altFood ? "Stack blocks" : "Meals (grouped)";
  }
  const shopTitle = document.getElementById("out-food-shop-title");
  if (shopTitle) {
    shopTitle.textContent = altFood
      ? "Shortfall stack shopping list"
      : "Shopping list";
  }

  fillList(document.getElementById("out-food-shop"), fp.shoppingList || []);
  fillList(document.getElementById("out-food-tips"), fp.prepTips || []);

  const foodD3Wrap = document.getElementById("out-food-d3-wrap");
  const foodD3Notice = document.getElementById("out-food-d3-notice");
  const foodD3Symptoms = document.getElementById("out-food-d3-symptoms");
  const kitD3Wrap = document.getElementById("out-kit-d3-wrap");
  const kitD3AlreadyShown = kitD3Wrap && !kitD3Wrap.hidden;
  if (foodD3Wrap && foodD3Notice && foodD3Symptoms) {
    if (kitD3AlreadyShown) {
      // Full D3 safety list already shown under Nutrition Kit — skip duplicate
      foodD3Wrap.hidden = true;
    } else {
      foodD3Wrap.hidden = false;
      foodD3Notice.textContent =
        fp.vitaminDOverloadNotice ||
        fp.kitBase?.d3Note ||
        "Stop Vitamin D3 and seek care if overload signs appear.";
      fillList(foodD3Symptoms, fp.vitaminDOverloadSymptoms || []);
    }
  }

  document.getElementById("out-food-disclaimer").textContent =
    fp.disclaimer || disclaimer || "";
}

function softBmiCategory(bmi, category) {
  if (category === "obesity") {
    return `BMI ${bmi} · above the educational obesity cut-point (illustrative)`;
  }
  if (category === "overweight") {
    return `BMI ${bmi} · above the educational healthy range (illustrative)`;
  }
  return `BMI ${bmi} · within educational range`;
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
    softBmiCategory(wp.current.bmi, wp.current.category);
  document.getElementById("out-progress-pace").textContent =
    `~${wp.pace.weeklyLossLb} lb/wk`;
  document.getElementById("out-progress-pace-detail").textContent =
    `~${wp.pace.monthlyLossLb} lb/mo · ${wp.pace.note}`;
  document.getElementById("out-progress-goal").textContent =
    wp.toHealthyBmi.estimatedWeeks != null
      ? `~${wp.toHealthyBmi.estimatedWeeks} wks`
      : "—";
  const goalBadge = document.getElementById("out-progress-goal-badge");
  if (goalBadge) {
    goalBadge.textContent = `To ideal ~${wp.toHealthyBmi.targetWeightLb} lb`;
  }
  document.getElementById("out-progress-goal-detail").textContent =
    `${wp.toHealthyBmi.poundsToGo} lb to go · BMI ${wp.toHealthyBmi.targetBmi}`;

  const miles = (wp.milestones || []).map(
    (m) => `Week ${m.weeks}: ~${m.weightLb} lb · −${m.lostLb} lb`,
  );
  fillList(document.getElementById("out-progress-milestones"), miles);
  document.getElementById("out-progress-hint").textContent =
    wp.modifiersHint || "";
  document.getElementById("out-progress-disclaimer").textContent =
    wp.disclaimer || disclaimer || "";

  const calSel = document.getElementById("adj-calories");
  const exSel = document.getElementById("adj-exercise");
  const calLabel = document.getElementById("adj-calories-label");
  const isAltForecast = Boolean(wp.alternative);
  if (calLabel) {
    if (isAltForecast) {
      calLabel.hidden = true;
      if (calSel) calSel.value = "0";
    } else {
      calLabel.hidden = false;
    }
  }
  if (calSel && wp.plan && !isAltForecast) calSel.value = String(wp.plan.calorieAdjust || 0);
  if (exSel && wp.plan) exSel.value = String(wp.plan.exerciseBonusKcal || 0);
}

function renderAdviceResult(data) {
  document.getElementById("out-summary").textContent = data.summary;
  const chipsEl = document.getElementById("out-summary-chips");
  if (chipsEl) {
    chipsEl.innerHTML = "";
    const chips = data.summaryChips || [];
    if (chips.length) {
      chipsEl.hidden = false;
      for (const chip of chips) {
        const span = document.createElement("span");
        span.className = "stat-chip";
        span.textContent = chip;
        chipsEl.appendChild(span);
      }
    } else {
      chipsEl.hidden = true;
    }
  }
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

  const lifeWrap = document.getElementById("out-life-wrap");
  const le = data.lifeExpectancy;
  if (le?.current && le?.ideal) {
    lifeWrap.hidden = false;
    document.getElementById("out-life-summary").textContent = le.comparison?.summary || "";
    document.getElementById("out-life-current").textContent =
      `~${le.current.expectedAge} yrs`;
    document.getElementById("out-life-current-detail").textContent =
      `~${le.current.remainingYears} yrs left · BMI ${le.current.bmi ?? "—"} · adj ${le.current.adjustmentsYears >= 0 ? "+" : ""}${le.current.adjustmentsYears}`;
    document.getElementById("out-life-ideal").textContent =
      `~${le.ideal.expectedAge} yrs`;
    const idealBits = [
      `~${le.ideal.remainingYears} yrs left`,
      ...(le.ideal.assumptions || []),
    ].filter(Boolean);
    document.getElementById("out-life-ideal-detail").textContent = idealBits.join(" · ");
    document.getElementById("out-life-disclaimer").textContent =
      le.disclaimer || data.lifeExpectancyDisclaimer || "";
  } else {
    lifeWrap.hidden = true;
  }

  fillProgress(data.weightProgress, data.progressDisclaimer);
  fillNutritionKit(data.nutritionKit, data.nutritionKitDisclaimer);
  fillFoodPlan(data.foodPlan, data.foodPlanDisclaimer);
  applyAmazonAffiliateUi(data.associateTag, data.amazonAssociateDisclosure);

  fillList(document.getElementById("out-safety"), [
    ...(data.watchouts || []),
    ...(data.whenToSeekCare || []),
  ]);
  const safetyFoot = document.getElementById("out-safety-footnote");
  if (safetyFoot) {
    const parts = [data.disclaimer, data.lensDisclaimer].filter(Boolean);
    safetyFoot.textContent = parts.join(" ");
  }
}
async function boot() {
  const form = document.getElementById("metrics-form");
  const badge = document.getElementById("plan-badge");
  const sub = document.getElementById("plan-sub");
  const upsell = document.getElementById("plus-upsell");
  const portalBtn = document.getElementById("portal-btn");
  const errorEl = document.getElementById("form-error");
  const statusEl = document.getElementById("form-status");
  const result = document.getElementById("result");
  let lastPayload = null;

  function setFormStatus(message, { isError = false } = {}) {
    if (statusEl) {
      if (message && !isError) {
        statusEl.hidden = false;
        statusEl.textContent = message;
      } else {
        statusEl.hidden = true;
        statusEl.textContent = "";
      }
    }
    if (errorEl) {
      if (message && isError) {
        errorEl.hidden = false;
        errorEl.textContent = message;
      } else if (!isError) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }
    }
  }

  function focusFirstInvalid() {
    const first = form.querySelector(":invalid");
    if (!first) return;
    const details = first.closest("details");
    if (details) details.open = true;
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      first.focus({ preventScroll: true });
    } catch {
      first.focus();
    }
  }

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
  try {
    const plans = await api("/v1/plans");
    applyAmazonAffiliateUi(plans.associateTag, plans.amazonAssociateDisclosure);
    fillKitBundles(plans.kitBundles);
  } catch {
    // affiliate tagging is optional
  }
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
    setFormStatus("");
    result.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      focusFirstInvalid();
      setFormStatus(
        "Please fill required fields: age, sex, height (ft + in), weight, activity, and goal.",
        { isError: true },
      );
      return;
    }

    const payload = buildPayloadFromForm();
    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = "Working…";
    setFormStatus("Generating your 7-day plan…");
    try {
      await runAdvice(payload);
      setFormStatus("Plan ready — scrolled to your results.");
    } catch (err) {
      setFormStatus(err.message || "Could not generate plan.", { isError: true });
      if (err.data?.upgrade) {
        errorEl.hidden = false;
        errorEl.innerHTML = `${err.message} <a href="/pricing.html">Upgrade to Plus</a>`;
      }
      errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
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
        updateBtn.textContent = "Update forecast";
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
      setFormStatus(
        "Demo loaded: high seated BP, orthostatic drop, and low saliva pH. Plan style unchanged.",
      );
    });
  }
}

boot().catch((err) => {
  const errorEl = document.getElementById("form-error");
  errorEl.hidden = false;
  errorEl.textContent = err.message || "Failed to load app";
});
