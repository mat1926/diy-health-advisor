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
    throw err;
  }
  return data;
}

const form = document.getElementById("upgrade-form");
const errorEl = document.getElementById("upgrade-error");
const note = document.getElementById("upgrade-note");

if (new URLSearchParams(location.search).get("canceled")) {
  note.textContent = "Checkout canceled — you can try again anytime.";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.hidden = true;
  const email = new FormData(form).get("email") || undefined;
  try {
    const { url } = await api("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ email: email || undefined }),
    });
    location.href = url;
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = err.message;
    if (err.data?.setup) {
      note.textContent =
        "Dev tip: set STRIPE_SECRET_KEY, STRIPE_PRICE_PLUS, and APP_URL, then redeploy.";
    }
  }
});
