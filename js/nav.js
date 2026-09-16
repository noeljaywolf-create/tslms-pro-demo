/* ============================================================
   nav.js — role-based navigation and the view router
   ============================================================ */
"use strict";

function renderNav() {
  const nav = $("sideNav");
  const menu = {
    stores: [
      { s: "Operations", items: [["#dashboard","Dashboard","&#9678;"],["#inventory","Inventory","&#9745;"],["#bins","Bin Map","&#9642;"],["#retail","Retail Catalog","&#128722;"],["#aog","AOG Desk","&#9888;", "aogBadge"],["#requisitions","Requisitions","&#8674;"],["#reports","Analytics","&#9661;"]] },
      { s: "Intelligence", items: [["#assistant","AI Assistant","&#10052;"],["#forecast","AI Forecast","&#9680;"],["#passport","Parts Passport","&#9632;"]] }
    ],
    engineer: [
      { s: "Maintenance", items: [["#dashboard","Dashboard","&#9678;"],["#aog","AOG Desk","&#9888;", "aogBadge"],["#requisitions","Requisitions","&#8674;"]] },
      { s: "Intelligence", items: [["#assistant","AI Assistant","&#10052;"],["#forecast","AI Forecast","&#9680;"],["#passport","Parts Passport","&#9632;"]] }
    ],
    inspector: [
      { s: "Quality", items: [["#dashboard","Dashboard","&#9678;"],["#compliance","Compliance","&#10003;"],["#reports","Audit Analytics","&#9661;"]] },
      { s: "Traceability", items: [["#assistant","AI Assistant","&#10052;"],["#passport","Parts Passport","&#9632;"]] }
    ]
  };
  const aogCount = STORE.aog.filter((a) => a.step < 3).length;
  nav.innerHTML = (menu[session.role] || menu.stores).map((sec) => `
    <div class="nav-section">${sec.s}</div>
    ${sec.items.map(([href, label, ic, badge]) => `
      <button class="nav-link" data-href="${href}">
        <span class="n-ic">${ic}</span><span class="nav-txt">${label}</span>
        ${badge ? `<span class="n-badge" id="${badge}">${aogCount}</span>` : ""}
      </button>`).join("")}
  `).join("");
  document.querySelectorAll(".nav-link").forEach((b) => b.addEventListener("click", () => route(b.dataset.href)));
}

/* ---------------- Mobile navigation (bottom bar + drawer) ---------------- */
const MOBILE_NAV = {
  stores: [["#dashboard", "Dashboard", "&#9678;"], ["#aog", "AOG", "&#9888;", "aogBadgeM"], ["__scan__", "Scan", "&#10052;"], ["#requisitions", "Requests", "&#8674;"]],
  engineer: [["#dashboard", "Dashboard", "&#9678;"], ["#aog", "AOG", "&#9888;", "aogBadgeM"], ["__scan__", "Scan", "&#10052;"], ["#requisitions", "Requests", "&#8674;"]],
  inspector: [["#dashboard", "Dashboard", "&#9678;"], ["#reports", "Reports", "&#9661;"], ["__scan__", "Scan", "&#10052;"], ["#assistant", "AI", "&#10052;"]]
};

function renderMobileNav() {
  const bar = $("mobileNav");
  if (!bar) return;
  const items = MOBILE_NAV[(session && session.role) || "stores"] || MOBILE_NAV.stores;
  const aogCount = STORE.aog.filter((a) => a.step < 3).length;
  bar.innerHTML = items.map(([href, label, ic, badge]) =>
    href === "__scan__"
      ? `<button class="mb-scan" data-scan="1" aria-label="Scan"><span class="mb-ic">${ic}</span><span class="mb-txt">${label}</span></button>`
      : `<button class="nav-link mb-link" data-href="${href}"><span class="mb-ic">${ic}</span><span class="mb-txt">${label}</span>${badge ? `<span class="n-badge" id="${badge}">${aogCount}</span>` : ""}</button>`
  ).join("");
  bar.querySelectorAll(".nav-link").forEach((b) => b.addEventListener("click", () => { closeNav(); route(b.dataset.href); }));
  const scan = bar.querySelector("[data-scan]");
  if (scan) scan.addEventListener("click", () => { closeNav(); openScanner(); });
}

function openNav() {
  document.body.classList.add("nav-open");
}
function closeNav() {
  document.body.classList.remove("nav-open");
}

/* ---------------- Router ---------------- */
/* Lazy wrappers so views defined in later scripts (ai.js) resolve without load-order errors */
const VIEWS = {
  dashboard: () => viewDashboard(),
  inventory: () => viewInventory(),
  bins: () => viewBins(),
  aog: () => viewAog(),
  requisitions: () => viewRequisitions(),
  forecast: () => viewForecast(),
  compliance: () => viewCompliance(),
  passport: () => viewPassport(),
  reports: () => viewReports(),
  assistant: () => viewAssistant(),
  retail: () => viewRetail()
};

function route(hash) {
  const key = (hash || "#dashboard").replace("#", "");
  document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b.dataset.href === "#" + key));
  const titles = { dashboard: "Operations Dashboard", inventory: "Inventory Control", bins: "Digital Bin & Storage Mapper", aog: "AOG Response Desk", requisitions: "Requisitions", forecast: "AI Predictive Intelligence", compliance: "Compliance & Certificates", passport: "Blockchain Parts Passport", reports: "Analytics & Reports", assistant: "AI Assistant", retail: "Retail Catalog" };
  $("pageTitle").textContent = titles[key] || "Dashboard";
  const view = VIEWS[key] || viewDashboard;
  $("content").innerHTML = `<div class="view-head"><div class="view-title"><h2>${titles[key] || "Dashboard"}</h2><p id="viewSub"></p></div><div class="view-actions" id="viewActions"></div></div><div id="viewBody"></div>`;
  view();
}
