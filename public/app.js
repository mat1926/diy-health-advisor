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

async function boot() {
  const form = document.getElementById("metrics-form");
  const badge = document.getElementById("plan-badge");
  const sub = document.getElementById("plan-sub");
  const upsell = document.getElementById("plus-upsell");
  const portalBtn = document.getElementById("portal-btn");
  const errorEl = document.getElementById("form-error");
  const result = document.getElementById("result");

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    result.hidden = true;
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    for (const key of [
      "age",
      "heightFt",
      "heightIn",
      "weightLb",
      "sleepHours",
      "stressLevel",
      "restingHeartRate",
      "stepsPerDay",
      "waterLiters",
      "salivaPh",
      "urinePh",
    ]) {
      if (payload[key] === "" || payload[key] == null) delete payload[key];
      else if (payload[key] != null) payload[key] = Number(payload[key]);
    }

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "Working…";
    try {
      const data = await api("/v1/advice", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "start" });
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
}

boot().catch((err) => {
  const errorEl = document.getElementById("form-error");
  errorEl.hidden = false;
  errorEl.textContent = err.message || "Failed to load app";
});
