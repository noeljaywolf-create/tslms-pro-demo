/* ============================================================
   nav.js — role-based navigation and the view router
   ============================================================ */
"use strict";

function renderNav() {
  const nav = $("sideNav");
  const engineering = { s: "Aircraft Engineering", items: [["#dashboard","Engineering Overview","◈"],["#fleet","Fleet Management","✈"],["#components","Component Life","◷"],["#resources","Resource Planning","▤"],["#serviceable","Component Tags","▧"],["#profiles","People & Profiles","◎"],["#ata","ATA Chapters","▦"],["#aog","AOG Response","!","aogBadge"]] };
  const stores = { s: "Technical Operations", items: [["#inventory","Technical Stores","▣"],["#bins","Storage & Bins","▤"],["#logistics","Logistics Intelligence","↗"],["#requisitions","Requisitions","⇢"]] };
  const quality = { s: "Assurance & Intelligence", items: [["#compliance","Compliance","✓"],["#passport","Parts Traceability","⬡"],["#forecast","Demand Forecast","◔"],["#assistant","AI Assistant","✧"]] };
  const menu = {stores:[engineering,stores,quality],engineer:[engineering,stores,quality],inspector:[engineering,{s:"Technical Stores",items:[["#inventory","Technical Stores","▣"],["#logistics","Logistics Intelligence","↗"]]},quality]};
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
  inspector: [["#dashboard", "Dashboard", "&#9678;"], ["#components", "Life", "◷"], ["__scan__", "Scan", "&#10052;"], ["#assistant", "AI", "&#10052;"]]
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
  dashboard: () => viewEngineeringDashboard(),
  fleet: () => viewFleet(),
  resources: () => viewResources(),
  serviceable: () => viewServiceable(),
  profiles: () => viewProfiles(),
  components: () => viewComponents(),
  ata: () => viewAta(),
  logistics: () => viewLogistics(),
  inventory: () => viewInventory(),
  bins: () => viewBins(),
  aog: () => viewAog(),
  requisitions: () => viewRequisitions(),
  forecast: () => viewForecast(),
  compliance: () => viewCompliance(),
  passport: () => viewPassport(),
  reports: () => viewLogistics(),
  assistant: () => viewAssistant(),
  retail: () => viewInventory()
};

function route(hash) {
  closeNav();
  let key = (hash || "#dashboard").replace("#", "");
  if(key === "retail") key="inventory";
  if(key === "reports") key="logistics";
  if(!VIEWS[key]) key="dashboard";
  pauseHero();
  Object.keys(charts).forEach(killChart);
  if(location.hash !== "#"+key) history.replaceState(null,"","#"+key);
  document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b.dataset.href === "#" + key));
  const titles = { dashboard: "Engineering Overview", fleet: "Fleet Management", resources: "Resource Planning", serviceable: "Digital Component Tags", profiles: "People & Profiles", components: "Component Life Tracking", ata: "ATA Chapters", logistics: "Logistics Intelligence", inventory: "Technical Stores", bins: "Digital Bin & Storage Mapper", aog: "AOG Response Desk", requisitions: "Requisitions", forecast: "AI Predictive Intelligence", compliance: "Compliance & Certificates", passport: "Parts Traceability", reports: "Logistics Intelligence", assistant: "AI Assistant", retail: "Technical Stores" };
  $("pageTitle").textContent = titles[key] || "Dashboard";
  const view = VIEWS[key] || viewEngineeringDashboard;
  $("content").innerHTML = `<div class="view-head"><div class="view-title"><h2>${titles[key] || "Dashboard"}</h2><p id="viewSub"></p></div><div class="view-actions" id="viewActions"></div></div><div id="viewBody"></div>`;
  view();
}
