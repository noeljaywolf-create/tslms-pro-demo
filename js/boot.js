/* ============================================================
   boot.js — live simulation loop, login/event bindings, console handle
   ============================================================ */
"use strict";

let globalSearchValue = "";
$("globalSearch").addEventListener("input", (e) => {
  globalSearchValue = e.target.value;
  if (location.hash === "#inventory") viewInventory();
});

/* ---------------- Transfer modal ---------------- */
/* ---------------- Live simulation loop ---------------- */
function liveLoop() {
  STORE.aog.forEach((a) => { a.t++; });
  STORE.reqs.forEach((r) => { r.t++; });
  $("clock").textContent = fmtTime(now());
  if (location.hash === "#dashboard" && $("activityFeed")) $("activityFeed").innerHTML = activityFeedHTML();
  if (location.hash === "#aog" && $("aogLog")) $("aogLog").innerHTML = activityFeedHTML();
  const badge = $("aogBadge");
  if (badge) badge.textContent = STORE.aog.filter((a) => a.step < 3).length;
}

setInterval(liveLoop, 1000);
setInterval(flashNotif, 15000);

/* ---------------- Login bindings ---------------- */
document.querySelectorAll(".role-card").forEach((c) => {
  c.addEventListener("click", () => {
    document.querySelectorAll(".role-card").forEach((x) => x.classList.remove("active"));
    c.classList.add("active");
    $("loginUser").value = c.dataset.user;
    $("loginPass").value = c.dataset.pass;
    $("userErr").textContent = ""; $("passErr").textContent = "";
  });
});

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  doLogin($("loginUser").value.trim(), $("loginPass").value);
});

$("scanBtn").addEventListener("click", openScanner);

$("logoutBtn").addEventListener("click", () => {
  session = null;
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("content").innerHTML = "";
  location.hash = "";
  toast("info", "Signed out", "Session ended securely.");
});

$("notifBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const p = $("notifPanel");
  p.classList.toggle("hidden");
  if (!p.classList.contains("hidden")) { $("notifDot").style.opacity = "0"; renderNotifs(); }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#notifPanel") && !e.target.closest("#notifBtn")) $("notifPanel").classList.add("hidden");
});

window.addEventListener("hashchange", () => route(location.hash));

/* init clock */
setInterval(() => { $("clock") && ($("clock").textContent = fmtTime(now())); }, 1000);

/* debug / console handle for demos */
if (typeof window !== "undefined") window.TSLMS = { STORE, get session() { return session; } };
