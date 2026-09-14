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
