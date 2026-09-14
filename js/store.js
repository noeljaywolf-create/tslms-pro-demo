/* ============================================================
   store.js — requisition seeding, notifications, toasts,
   login/auth
   ============================================================ */
"use strict";

/* Seed requisitions + AOG queue */
function seedData() {
  const base = [
    { pn: "BRG-27-230", qty: 2, wo: "WO-24490", reg: "Z-WQA", by: "T. Ndlovu", step: 3, urgency: "HIGH", t: 14 },
    { pn: "GST-304-88", qty: 1, wo: "WO-24497", reg: "Z-WRH", by: "T. Ndlovu", step: 2, urgency: "HIGH", t: 9 },
    { pn: "SEAL-74-061", qty: 4, wo: "WO-24501", reg: "Z-WPV", by: "T. Ndlovu", step: 1, urgency: "ROUTINE", t: 6 },
    { pn: "GEN-24-410", qty: 1, wo: "WO-24505", reg: "Z-WQA", by: "T. Ndlovu", step: 1, urgency: "ROUTINE", t: 4 }
  ];
  base.forEach((b) => addReq(b.pn, b.qty, b.wo, b.reg, b.urgency, b.step, b.t));
  // Active AOG
  STORE.aog.push({ ref: "AOG-88214", pn: "BSC-64-73221", reg: "Z-WPV", wo: "WO-24518", urgency: "AOG", step: 0, t: 8 });
  pushEvent("AOG","AOG-88214 raised for Z-WPV — brake assembly required, aircraft on ground","danger",now());
}

let reqSeq = 24460;
function addReq(pn, qty, wo, reg, urgency, step = 0, t = 0) {
  const r = { ref: `REQ-${reqSeq++}`, pn, qty, wo, reg, urgency, step, t, by: "T. Ndlovu", created: now() };
  STORE.reqs.push(r);
  return r;
}

/* ---------------- Notifications ---------------- */
const NOTIFS = [
  { dot: "var(--red)", txt: "AOG-88214 — part BSC-64-73221 now Requested. Aircraft Z-WPV grounded.", time: "2m ago" },
  { dot: "var(--amber)", txt: "Shelf-life: WHB-32-881 expires in 22 days — quarantined.", time: "18m ago" },
  { dot: "var(--accent-2)", txt: "AI forecast: stockout of CSK-740-77 predicted in 9 days.", time: "41m ago" },
  { dot: "var(--green)", txt: "REQ-24462 Issued, awaiting installation on Z-WRH.", time: "1h ago" }
];
function renderNotifs() {
  $("notifList").innerHTML = NOTIFS.map((n) => `
    <div class="notif-item"><i class="n-dot" style="background:${n.dot}"></i>
      <div>${n.txt}<small>${n.time}</small></div></div>`).join("");
}
function flashNotif() {
  const dot = $("notifDot");
  setTimeout(() => dot.style.opacity = "1", 100);
  setTimeout(() => dot.style.opacity = "0", 2600);
}

/* ---------------- Toasts ---------------- */
function toast(kind, title, msg) {
  const ic = { ok: "&#10003;", warn: "!", info: "i", danger: "!" };
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<div class="t-ic">${ic[kind] || "i"}</div><div><b>${title}</b><small>${msg}</small></div>`;
  $("toasts").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .4s"; setTimeout(() => el.remove(), 400); }, 3600);
}

function pushEvent(kind, title, msg, tone) {
  STORE.events.push({ kind, title, msg, tone, icon: { ok: "&#10003;", warn: "!", info: "i", danger: "!" }[kind] || "i", time: now() });
}

/* ---------------- Auth ---------------- */
let session = null;

function doLogin(user, pass) {
  const u = STORE.users.find((x) => x.user.toLowerCase() === user.toLowerCase() && x.pass === pass);
  if (!u) {
    if (!$("loginUser").value) $("userErr").textContent = "Enter a username.";
    else $("userErr").textContent = "Unknown user.";
    if (!$("loginPass").value) $("passErr").textContent = "Enter a password.";
    else $("passErr").textContent = "Incorrect password. Use a demo role card.";
    return;
  }
  session = u;
  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("userName").textContent = u.name;
  $("userRole").textContent = u.title;
  $("avatar").textContent = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  renderNav();
  route(location.hash || "#dashboard");
  toast("ok", `Welcome back, ${u.name.split(" ")[0]}`, `Signed in as ${u.title}`);
  seedData();
  renderNotifs();
}
