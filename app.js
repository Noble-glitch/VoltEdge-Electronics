/* ===========================  SETTINGS  =========================== */
const CONFIG = {
  // Paste the PRODUCTION webhook URL from the "Order Webhook" node in n8n, e.g.
  // https://your-name.app.n8n.cloud/webhook/voltedge-order
  ORDER_WEBHOOK_URL: "https://oicreativehub.app.n8n.cloud/webhook/voltedge-order",
  BONUS_THRESHOLD: 500000,
  BONUS_RATE: 0.05
};

/* Catalogue: names and prices must match the n8n workflow exactly. */
const PRODUCTS = [
  { name: "MacBook Air M4",             price: 1850000, cat: "Laptop",         tint: "#dfe6ff", icon: '<rect x="9" y="12" width="30" height="20" rx="2"/><path d="M5 36h38l-3 4H8z"/>' },
  { name: "Samsung Galaxy S25 Ultra",   price: 1650000, cat: "Smartphone",     tint: "#e3f4ec", icon: '<rect x="16" y="6" width="16" height="36" rx="3"/><path d="M22 37h4"/>' },
  { name: "PlayStation 5 Slim",         price: 950000,  cat: "Game console",   tint: "#fde7e7", icon: '<path d="M19 6c-3 0-4 2-4 4v28c0 2 1 4 4 4h1V6zM29 6h-1v36h1c3 0 4-2 4-4V10c0-2-1-4-4-4z"/>' },
  { name: "iPad Air",                   price: 1100000, cat: "Tablet",         tint: "#efe6fb", icon: '<rect x="10" y="7" width="28" height="34" rx="3"/><circle cx="24" cy="36" r="1"/>' },
  { name: "Sony WH-1000XM5 Headphones", price: 650000,  cat: "Headphones",     tint: "#fff0d6", icon: '<path d="M10 28v-4a14 14 0 0 1 28 0v4"/><rect x="8" y="27" width="7" height="12" rx="3"/><rect x="33" y="27" width="7" height="12" rx="3"/>' },
  { name: "Samsung 55-inch 4K TV",      price: 1400000, cat: "Television",     tint: "#dcf1f5", icon: '<rect x="6" y="9" width="36" height="24" rx="2"/><path d="M18 40h12M24 33v7"/>' },
  { name: "Logitech Wireless Mouse",    price: 180000,  cat: "Computer mouse", tint: "#eaf0d9", icon: '<rect x="15" y="8" width="18" height="32" rx="9"/><path d="M24 8v10"/>' },
  { name: "Anker Power Bank",           price: 95000,   cat: "Power bank",     tint: "#fbe4f0", icon: '<rect x="14" y="6" width="20" height="36" rx="4"/><path d="M25 14l-5 9h6l-4 9"/>' }
];

/* ===========================  STATE  =========================== */
const cart = {};                       // product name -> quantity
const $ = id => document.getElementById(id);
const naira = n => "₦" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const configured = () => /^https?:\/\//.test(CONFIG.ORDER_WEBHOOK_URL);

/* ===========================  PRICE LIST  =========================== */
function renderRows() {
  $("rows").innerHTML = PRODUCTS.map((p, i) => {
    const q = cart[p.name] || 0;
    const control = q === 0
      ? `<button class="add" data-add="${i}" aria-label="Add ${esc(p.name)} to order">Add</button>`
      : `<span class="step"><button data-dec="${i}" aria-label="Remove one ${esc(p.name)}">−</button><output aria-label="Quantity">${q}</output><button data-inc="${i}" aria-label="Add one more ${esc(p.name)}">+</button></span>`;
    return `<div class="row">
      <div class="tile" style="background:${p.tint}"><svg viewBox="0 0 48 48" aria-hidden="true">${p.icon}</svg></div>
      <div><div class="pname">${esc(p.name)}</div><div class="pcat">${esc(p.cat)}</div></div>
      <div class="price">${naira(p.price)}</div>
      <div class="ctl">${control}</div>
    </div>`;
  }).join("");
}

/* ===========================  ORDER TICKET  =========================== */
function totals() {
  let total = 0, count = 0;
  PRODUCTS.forEach(p => { const q = cart[p.name] || 0; total += q * p.price; count += q; });
  return { total, count };
}

function renderTicket() {
  const { total, count } = totals();
  $("empty").hidden = count > 0;
  $("lines").innerHTML = PRODUCTS.filter(p => cart[p.name]).map(p =>
    `<li class="line"><span>${esc(p.name)}<br><small>${cart[p.name]} × ${naira(p.price)}</small></span><b>${naira(cart[p.name] * p.price)}</b>
     <button type="button" data-remove="${esc(p.name)}">Remove</button></li>`).join("");
  $("total").textContent = naira(total);
  $("topCount").textContent = count;
  $("mCount").textContent = count;
  $("mTotal").textContent = naira(total);

  const hit = total >= CONFIG.BONUS_THRESHOLD;
  const pct = Math.min(100, (total / CONFIG.BONUS_THRESHOLD) * 100);
  $("meter").classList.toggle("hit", hit);
  $("meterFill").style.width = pct + "%";
  $("meter").querySelector(".bar").setAttribute("aria-valuenow", Math.min(total, CONFIG.BONUS_THRESHOLD));
  if (hit) {
    $("meterText").innerHTML = `This order qualifies for a <b>${naira(Math.round(total * CONFIG.BONUS_RATE))}</b> store-credit bonus (5%).`;
  } else if (count === 0) {
    $("meterText").innerHTML = `Spend ${naira(CONFIG.BONUS_THRESHOLD)} or more to earn a <b>5% store-credit bonus</b>.`;
  } else {
    $("meterText").innerHTML = `Add <b>${naira(CONFIG.BONUS_THRESHOLD - total)}</b> more to earn a 5% store-credit bonus.`;
  }
}

function refresh() { renderRows(); renderTicket(); }

$("rows").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const d = b.dataset;
  if (d.add !== undefined) cart[PRODUCTS[d.add].name] = 1;
  if (d.inc !== undefined) cart[PRODUCTS[d.inc].name] = Math.min(99, (cart[PRODUCTS[d.inc].name] || 0) + 1);
  if (d.dec !== undefined) { const n = PRODUCTS[d.dec].name; cart[n] = (cart[n] || 1) - 1; if (cart[n] <= 0) delete cart[n]; }
  const focusSel = b.dataset.add ?? b.dataset.inc ?? b.dataset.dec;
  refresh();
  const again = document.querySelector(`[data-inc="${focusSel}"],[data-add="${focusSel}"]`);
  if (again) again.focus();
});
$("lines").addEventListener("click", e => {
  const b = e.target.closest("button[data-remove]"); if (!b) return;
  delete cart[b.dataset.remove]; refresh();
});

/* ===========================  CHECKOUT  =========================== */
const fields = {
  name:  v => v.trim().length >= 2 ? "" : "Enter your full name.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address, for example name@example.com.",
  phone: v => /^\+?\d{10,15}$/.test(v.replace(/[\s\-().]/g, "")) ? "" : "Enter a phone number with 10 to 15 digits."
};

function showFieldErrors(errors) {
  Object.keys(fields).forEach(k => {
    const msg = errors[k] || "";
    document.querySelector(`.err[data-for="${k}"]`).textContent = msg;
    $(k).classList.toggle("invalid", !!msg);
  });
}
function showFormError(msg, list) {
  const box = $("formError");
  if (!msg) { box.hidden = true; box.innerHTML = ""; return; }
  box.hidden = false;
  box.innerHTML = esc(msg) + (list && list.length ? "<ul>" + list.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>" : "");
}

$("orderForm").addEventListener("submit", async e => {
  e.preventDefault();
  showFormError("");
  const { count } = totals();
  const errors = {};
  Object.keys(fields).forEach(k => { const m = fields[k]($(k).value); if (m) errors[k] = m; });
  showFieldErrors(errors);
  if (count === 0) { showFormError("Add at least one product to your order."); return; }
  if (Object.keys(errors).length) { $(Object.keys(errors)[0]).focus(); return; }
  if (!configured()) { $("cfgWarn").hidden = false; showFormError("The order link has not been set up yet."); return; }

  const payload = {
    customer_name: $("name").value.trim(),
    customer_email: $("email").value.trim(),
    customer_phone: $("phone").value.trim(),
    order_notes: $("notes").value.trim(),
    items: PRODUCTS.filter(p => cart[p.name]).map(p => ({ product_name: p.name, quantity: cart[p.name], unit_price: p.price })),
    source: "voltedge-website",
    submitted_at: new Date().toISOString()
  };

  const btn = $("submitBtn");
  btn.disabled = true; btn.textContent = "Placing your order…";
  try {
    const res = await fetch(CONFIG.ORDER_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (res.ok && data && data.success) {
      showConfirmation(data, payload.customer_email);
    } else if (data && data.errors && data.errors.length) {
      showFormError(data.message || "We could not accept your order.", data.errors);
    } else {
      showFormError((data && data.message) || "Something went wrong while sending your order. Please try again in a moment.");
    }
  } catch (err) {
    showFormError("We could not reach the order system. Check your internet connection and try again.");
  } finally {
    btn.disabled = false; btn.textContent = "Place order";
  }
});

function showConfirmation(data, email) {
  $("doneRef").textContent = data.order_ref;
  $("doneTotal").textContent = naira(data.total_amount);
  $("doneEmail").textContent = email;
  $("doneMsg").textContent = data.message || "";
  if (data.bonus_amount > 0) {
    $("doneBonusLabel").textContent = "Store-credit bonus";
    $("doneBonus").innerHTML = naira(data.bonus_amount) + ' <span class="pill">Pending</span>';
  } else {
    $("doneBonusLabel").textContent = "Store-credit bonus";
    $("doneBonus").textContent = "Not eligible";
  }
  $("orderPanel").style.display = "none";
  $("donePanel").style.display = "block";
  $("ticket").scrollIntoView({ block: "start" });
}

$("againBtn").addEventListener("click", () => {
  Object.keys(cart).forEach(k => delete cart[k]);
  $("orderForm").reset(); showFieldErrors({}); showFormError("");
  $("donePanel").style.display = "none"; $("orderPanel").style.display = "block";
  refresh(); window.scrollTo({ top: 0 });
});

if (!configured()) $("cfgWarn").hidden = false;
refresh();
