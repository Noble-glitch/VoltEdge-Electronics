const CONFIRM_WEBHOOK_URL = "https://oicreativehub.app.n8n.cloud/webhook/voltedge-confirm-payment";
// Example: https://your-name.app.n8n.cloud/webhook/voltedge-confirm-payment

const $ = id => document.getElementById(id);
const configured = /^https?:\/\//.test(CONFIRM_WEBHOOK_URL);
if (!configured) $("cfgWarn").hidden = false;

$("f").addEventListener("submit", async e => {
  e.preventDefault();
  const out = $("result"); out.className = ""; out.textContent = "";
  const ref = $("ref").value.trim().toUpperCase(), key = $("key").value;
  if (!ref || !key) { out.className = "bad"; out.textContent = "Enter the order reference and the admin key."; return; }
  if (!configured) { out.className = "bad"; out.textContent = "The payment link has not been set up yet."; return; }
  $("btn").disabled = true; $("btn").textContent = "Confirming…";
  try {
    const res = await fetch(CONFIRM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_ref: ref, payment_reference: $("pay").value.trim(), admin_key: key })
    });
    let data = {}; try { data = await res.json(); } catch (_) {}
    if (res.ok && data.success) {
      out.className = "ok";
      out.textContent = "Payment confirmed for " + data.order_ref + ". " + (data.bonus_amount > 0 ? "Bonus of ₦" + Math.round(data.bonus_amount).toLocaleString("en-NG") + " activated. " : "") + "The customer has been emailed.";
    } else {
      out.className = "bad";
      out.textContent = data.message || "Something went wrong. Check the order reference and try again.";
    }
  } catch (err) {
    out.className = "bad"; out.textContent = "Could not reach n8n. Check the webhook address and your connection.";
  } finally {
    $("btn").disabled = false; $("btn").textContent = "Confirm payment";
  }
});
