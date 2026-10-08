/* ============================================================
   nav.js — role-based navigation and the view router
   ============================================================ */
"use strict";

function renderNav() {
  const nav = $("sideNav");
  const engineering = { s: "Aircraft Engineering", items: [["#dashboard","Engineering Overview","◈"],["#fleet","Fleet Management","✈"],["#components","Component Life","◷"],["#resources","Resource Planning","▤"],["#maintenance","Maintenance Outlook","◴"],["#defects","Technical Log","▥"],["#lifecycle","Component Lifecycle","⇄"],["#serviceable","Component Tags","▧"],["#profiles","People & Profiles","◎"],["#ata","ATA Chapters","▦"],["#aog","AOG Response","!","aogBadge"]] };
  const stores = { s: "Technical Operations", items: [["#inventory","Technical Stores","▣"],["#bins","Storage & Bins","▤"],["#logistics","Logistics Intelligence","↗"],["#requisitions","Requisitions","⇢"]] };
  const quality = { s: "Assurance & Intelligence", items: [["#calibration","Calibration","⊙"],["#life-inspection","Life Inspection","✓"],["#laboratory","Laboratory & NDT","⌬"],["#compliance","Compliance","✓"],["#passport","Parts Traceability","⬡"],["#forecast","Demand Forecast","◔"],["#assistant","AI Assistant","✧"]] };
  const department = {s:"Department workflow",items:[["#department-chain","Teams & Handoffs","⇢"],["#intake","Equipment Intake","▣"],["#supply","Supply & Repair","⇄"],["#work-packages","Work Packages","▤"],["#flight-records","Flight Records","✈"],["#handover","Shift Handover","⇆"],["#deferrals","Deferral Control","▥"],["#engineering-support","Engineering Support","◎"]]};
  const menu = {stores:[engineering,stores,quality],engineer:[engineering,stores,quality],inspector:[engineering,{s:"Technical Stores",items:[["#inventory","Technical Stores","▣"],["#logistics","Logistics Intelligence","↗"]]},quality]};
  const roleSections={
    flightops:[{s:"Flight technical records",items:[["#fleet","Fleet records","✈"],["#defects","Technical log","▥"]]}],
    procurement:[stores,{s:"Supply evidence",items:[["#passport","Parts traceability","⬡"],["#forecast","Demand forecast","◔"]]}],
    records:[{s:"Technical evidence",items:[["#fleet","Fleet records","✈"],["#components","Component life","◷"],["#serviceable","Component tags","▧"],["#passport","Parts traceability","⬡"],["#compliance","Compliance","✓"]]}],
    planner:[{s:"Maintenance planning",items:[["#resources","Resource planning","▤"],["#maintenance","Maintenance outlook","◴"],["#components","Component life","◷"],["#fleet","Fleet records","✈"]]},stores],
    control:[{s:"Maintenance control",items:[["#fleet","Fleet status","✈"],["#defects","Technical log","▥"],["#aog","AOG response","!"],["#maintenance","Maintenance outlook","◴"],["#logistics","Logistics intelligence","↗"]]}],
    workshop:[{s:"Workshop evidence",items:[["#components","Component life","◷"],["#lifecycle","Component custody","⇄"],["#laboratory","Laboratory & NDT","⌬"],["#calibration","Calibration","⊙"]]}],
    certifier:[{s:"Completion review",items:[["#fleet","Fleet status","✈"],["#defects","Technical log","▥"],["#components","Component life","◷"],["#life-inspection","Independent life review","✓"],["#compliance","Compliance","✓"]]}],
    reliability:[{s:"Engineering analysis",items:[["#components","Component life","◷"],["#laboratory","Laboratory & NDT","⌬"],["#maintenance","Maintenance outlook","◴"],["#forecast","Demand forecast","◔"]]}]
  };
  const aogCount = STORE.aog.filter((a) => a.step < 3).length;
  nav.innerHTML = [department,...(menu[session.role] || roleSections[session.role] || [engineering,stores,quality])].map((sec) => `
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
  calibration: () => viewCalibration(),
  "life-inspection": () => viewLifeInspection(),
  laboratory: () => viewLaboratory(),
  "department-chain": () => viewDepartmentChain(),
  "flight-records": () => viewFlightRecords(),
  intake: () => viewIntake(),
  supply: () => viewSupply(),
  "work-packages": () => viewWorkPackages(),
  deferrals: () => viewDeferrals(),
  handover: () => viewHandover(),
  "engineering-support": () => viewEngineeringSupport(),
  dashboard: () => viewEngineeringDashboard(),
  fleet: () => viewFleet(),
  resources: () => viewResources(),
  maintenance: () => viewForecastPlanning(),
  defects: () => viewDefects(),
  lifecycle: () => viewLifecycle(),
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
  if(!session) return;
  closeNav();
  let key = (hash || "#dashboard").replace("#", "");
  if(key === "retail") key="inventory";
  if(key === "reports") key="logistics";
  if(!VIEWS[key]) key="dashboard";
  pauseHero();
  Object.keys(charts).forEach(killChart);
  if(location.hash !== "#"+key) history.replaceState(null,"","#"+key);
  document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b.dataset.href === "#" + key));
  const titles = { deferrals:"Controlled Defect Deferrals", "flight-records":"Flight Utilisation & Source Records", "department-chain":"Engineering Teams & Handoffs", intake:"Stores Equipment Intake", supply:"Supply, Repair & Custody", "work-packages":"Controlled Work Packages", handover:"Shift & Department Handover", "engineering-support":"Engineering Support & Reliability", calibration: "Calibration & Tool Control", "life-inspection": "Inspector Life Review", laboratory: "Laboratory & NDT", dashboard: "Engineering Overview", fleet: "Fleet Management", resources: "Resource Planning", maintenance: "Maintenance Outlook", defects: "Aircraft Technical Log", lifecycle: "Component Lifecycle", serviceable: "Digital Component Tags", profiles: "People & Profiles", components: "Component Life Tracking", ata: "ATA Chapters", logistics: "Logistics Intelligence", inventory: "Technical Stores", bins: "Digital Bin & Storage Mapper", aog: "AOG Response Desk", requisitions: "Requisitions", forecast: "AI Predictive Intelligence", compliance: "Compliance & Certificates", passport: "Parts Traceability", reports: "Logistics Intelligence", assistant: "AI Assistant", retail: "Technical Stores" };
  $("pageTitle").textContent = titles[key] || "Dashboard";
  const view = VIEWS[key] || viewEngineeringDashboard;
  $("content").innerHTML = `<div class="view-head"><div class="view-title"><h2>${titles[key] || "Dashboard"}</h2><p id="viewSub"></p></div><div class="view-actions" id="viewActions"></div></div><div id="viewBody"></div>`;
  view();
}
