/* ============================================================
   views.js — all view renderers, shared cards/sheets, charts, modals
   ============================================================ */
"use strict";

/* ---------------- Shared builders ---------------- */
const DASH_SLIDES = [
  { bg: "https://picsum.photos/seed/tslms-hangar/1400/520", kicker: "AIR ZIMBABWE BASES", title: "Fleet readiness, live from the hangar", sub: "Every scanned part updates inventory, passports and AOG alerts in real time — terminal intelligence on your phone.", cta: "Scan a part", go: "openScanner()" },
  { bg: "https://picsum.photos/seed/tslms-cargo/1400/520", kicker: "ANY BARCODE, ANY COUNTRY", title: "Know where it was actually made", sub: "Reads EAN/UPC/GS1 plus the label itself — so origin reflects the factory, not just the GS1 office.", cta: "Retail Catalog", go: "route('#retail')" },
  { bg: "https://picsum.photos/seed/tslms-sky/1400/520", kicker: "AI FORECASTING", title: "Predict before the aircraft goes quiet", sub: "87% forecast accuracy on demand — consumption, shelf-life risk and AOG likelihood flagged ahead of time.", cta: "AI Forecast", go: "route('#forecast')" },
  { bg: "https://picsum.photos/seed/tslms-ledger/1400/520", kicker: "BLOCKCHAIN PASSPORT", title: "Every part. One immutable ledger.", sub: "Chain of custody from OEM to tag-out — cryptographic, tamper-evident and audit-ready.", cta: "Parts Passport", go: "route('#passport')" }
];
let slideN = 0;
function heroSlideHTML() {
  return `<div class="hero-slider" id="heroSlider" onmouseenter="pauseHero()" onmouseleave="resumeHero()">
    ${DASH_SLIDES.map((s2, i) => `
      <div class="hero-slide ${i === slideN ? "on" : ""}" style="background-image:linear-gradient(rgba(7,13,26,.82),rgba(7,13,26,.92)),url('${s2.bg}')">
        <div class="hero-inner">
          <div class="hero-kick">${s2.kicker}</div>
          <div class="hero-title">${s2.title}</div>
          <div class="hero-sub">${s2.sub}</div>
          <div class="hero-cta row"><button class="btn btn-accent" onclick="${s2.go}">${s2.cta}</button></div>
        </div>
      </div>`).join("")}
    <button class="hero-nav hero-prev" onclick="slideStep(-1)" aria-label="Previous">&#10094;</button>
    <button class="hero-nav hero-next" onclick="slideStep(1)" aria-label="Next">&#10095;</button>
    <div class="hero-dots">${DASH_SLIDES.map((_, i) => `<span class="hero-dot ${i === slideN ? "on" : ""}" onclick="slideGo(${i})"></span>`).join("")}</div>
  </div>`;
}
function slideGo(i) { slideN = ((i % DASH_SLIDES.length) + DASH_SLIDES.length) % DASH_SLIDES.length; const h = $("heroSlider"); if (h) h.innerHTML = heroSlideHTML(); }
function slideStep(d) { slideGo(slideN + d); }
let heroTimer = null;
function pauseHero() { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }
function resumeHero() { pauseHero(); heroTimer = setInterval(() => slideStep(1), 6000); }
function viewDashboard() {
  resumeHero();
  const aogActive = STORE.aog.filter((a) => a.step < 3);
  const lowStock = STORE.parts.filter((p) => p.stock < p.min);
  const risk = STORE.parts.filter((p) => p.life === "EXPIRING").length;
  const stockValue = STORE.parts.reduce((s, p) => s + p.stock * p.unit, 0);
  const spark = (vals, g) => vals.map((v) => `<i class="${g ? "g" : ""}" style="height:${v}%"></i>`).join("");
  $("viewBody").innerHTML = `
    ${heroSlideHTML()}
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Aircraft On Ground</span><span class="kpi-ic">&#9888;</span></div>
        <div class="kpi-value">${aogActive.length}</div><div class="kpi-sub">active AOG events</div>
        <div class="spark">${aogActive.length > 0 ? spark([30,45,38,55,70,80]) : spark([90,85,90,88,92,95])}</div></div>
      <div class="kpi accent"><div class="kpi-top"><span class="kpi-label">Stock Value</span><span class="kpi-ic">&#128181;</span></div>
        <div class="kpi-value">$${(stockValue / 1000).toFixed(1)}<span class="u">K</span></div><div class="kpi-sub">rotable + expendable</div>
        <div class="spark">${spark([60,62,58,66,64,70])}</div></div>
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">AI Forecast Accuracy</span><span class="kpi-ic">&#9680;</span></div>
        <div class="kpi-value">87<span class="u">%</span></div><div class="kpi-sub">90-day rolling</div>
        <div class="spark">${spark([70,75,72,80,84,87,87])}</div></div>
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Open Requisitions</span><span class="kpi-ic">&#8674;</span></div>
        <div class="kpi-value">${STORE.reqs.filter((r) => r.step < 3).length}</div><div class="kpi-sub">across all departments</div>
        <div class="spark">${spark([40,45,43,50,48,42])}</div></div>
      <div class="kpi ${risk ? "warn" : ""}"><div class="kpi-top"><span class="kpi-label">Shelf-Life Alerts</span><span class="kpi-ic">&#9881;</span></div>
        <div class="kpi-value">${risk}</div><div class="kpi-sub">expiry within 60 days</div>
        <div class="spark">${spark([20,20,20,20,60,100])}</div></div>
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Low Stock Items</span><span class="kpi-ic">&#9888;</span></div>
        <div class="kpi-value">${lowStock.length}</div><div class="kpi-sub">below AI reorder point</div>
        <div class="spark">${spark([40,50,60,70,60,55])}</div></div>
    </div>
    <div class="grid">${panelChart("Issues by ATA Chapter", "chartAta")}${panelChart("AI Demand — Actual vs Forecast", "chartDemand")}</div>
    <div class="grid">${panelChart("Stock on Hand vs Reorder", "chartStock")}${panelChart("AOG Averted by Predictive AI", "chartAogAverted")}</div>
    <div class="panel"><div class="panel-head"><div class="panel-title">Recent activity <span class="dim">live loop</span></div></div>
      <div class="panel-body" id="activityFeed">${activityFeedHTML()}</div></div>`;
  renderCharts();
}

function panelChart(title, id) {
  return `<div class="panel"><div class="panel-head"><div class="panel-title">${title}</div></div><div class="panel-body"><canvas id="${id}" height="120"></canvas></div></div>`;
}

function activityFeedHTML() {
  const items = [ ...STORE.events ].reverse().slice(0, 8);
  const icons = { ok: "var(--green)", warn: "var(--amber)", info: "var(--accent-2)", danger: "var(--red)" };
  return items.length ? items.map((e) => `
    <div class="notif-item"><i class="n-dot" style="background:${icons[e.kind]}"></i>
      <div><b>${e.title}</b><br>${e.msg}<small>${e.time.toLocaleTimeString("en-GB")}</small></div></div>`).join("")
    : `<div class="empty"><div class="e-ic">&#9832;</div>No activity yet &mdash; route an AOG to begin.</div>`;
}

function renderCharts() {
  if (typeof Chart === "undefined") { $("content").insertAdjacentHTML("afterbegin", '<div class="empty" style="margin-bottom:14px">Chart library failed to load &mdash; data views degraded, core functions still work.</div>'); return; }
  try { renderChartsNow(); } catch (err) { console.warn("Chart render skipped:", err); }
}

function renderChartsNow() {
  if ($("chartAta")) {
    killChart("chartAta");
    charts.chartAta = new Chart($("chartAta"), { type: "bar", data: {
      labels: ["AB 21","AP 24","FC 27","FUEL 28","LDG 32","DRS 52","ENG 72","START 80"],
      datasets: [{ label: "Issues (30d)", data: [18, 7, 15, 22, 31, 9, 24, 6], backgroundColor: ["#3f9bff","#9a7bff","#f5b12d","#18c98d","#f04e4e","#25c4e6","#e06aa8","#22c55e"], borderRadius: 6 }],
    }, options: baseOpts({ labels: false }) });
  }
  if ($("chartDemand")) {
    killChart("chartDemand");
    charts.chartDemand = new Chart($("chartDemand"), { type: "line", data: {
      labels: ["W1","W2","W3","W4","W5","W6","W7","W8"],
      datasets: [
        { label: "Actual", data: [12, 9, 14, 11, 16, 13, 15, 12], borderColor: "#3f9bff", backgroundColor: "rgba(63,155,255,0.08)", fill: true, tension: 0.35, pointRadius: 3 },
        { label: "AI Forecast", data: [10, 12, 15, 14, 18, 17, 22, 24], borderColor: "#f5b12d", borderDash: [6,4], tension: 0.35, pointRadius: 3, pointBackgroundColor: "#f5b12d" }
      ] }, options: baseOpts() });
  }
  if ($("chartStock")) {
    killChart("chartStock");
    charts.chartStock = new Chart($("chartStock"), { type: "bar", data: {
      labels: ["Brake","O-ring","Fuel Pmp","Hub","Gen","Seal"],
      datasets: [
        { label: "On hand", data: [2, 8, 12, 1, 1, 5], backgroundColor: "#3f9bff", borderRadius: 5 },
        { label: "Reorder", data: [6, 6, 5, 3, 2, 4], backgroundColor: "#f04e4e", borderRadius: 5 }
      ] }, options: baseOpts({ labels: true }) });
  }
  if ($("chartAogAverted")) {
    killChart("chartAogAverted");
    charts.chartAogAverted = new Chart($("chartAogAverted"), { type: "doughnut", data: {
      labels: ["Averted by AI", "Standard AOG"],
      datasets: [{ data: [63, 37], backgroundColor: ["#18c98d", "#f04e4e"], borderWidth: 0 }]
    }, options: { cutout: "62%", plugins: { legend: { position: "bottom", labels: { color: "#8496b4" } } } } });
  }
}

function baseOpts(o = {}) {
  return {
    plugins: { legend: { labels: { color: "#8496b4", boxWidth: 10, font: { size: 11 } } } },
    scales: {
      y: { beginAtZero: true, grid: { color: "#1e2c49" }, ticks: { color: "#8496b4", font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: "#8496b4", font: { size: 10 } } }
    },
    maintainAspectRatio: false
  };
}

/* ---------------- Inventory view ---------------- */
function viewInventory() {
  $("viewSub").textContent = "Searchable store-wide inventory with release certificates and AI reorder status.";
  $("viewActions").innerHTML = `<button class="btn btn-accent" onclick="openTransferModal()">+ Transfer / Issue</button>`;
  const q = (globalSearchValue || "").toLowerCase();
  const rows = STORE.parts
    .filter((p) => !q || p.pn.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.ata.includes(q))
    .map((p) => {
      const low = p.stock < p.min;
      const life = p.life === "EXPIRING";
      return `<tr>
        <td><span class="pn">${p.pn}</span></td>
        <td>${p.name}</td>
        <td>ATA ${p.ata}</td>
        <td>${p.loc}</td>
        <td class="num"><b>${p.stock}</b> / ${p.min}</td>
        <td>${low ? '<span class="tag danger">REORDER</span>' : '<span class="tag ok">HEALTHY</span>'}</td>
        <td>${life ? '<span class="tag warnb">QUARANTINED</span>' : '<span class="tag info">VALID</span>'}</td>
        <td>${p.cert}</td>
      </tr>`;
    }).join("");
  $("viewBody").innerHTML = `
    <div class="panel">
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Part No.</th><th>Description</th><th>ATA</th><th>Location</th><th>Stock / Min</th><th>Status</th><th>Shelf-Life</th><th>Release Cert</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8"><div class="empty">No parts match your search.</div></td></tr>'}</tbody>
      </table></div>
    </div>`;
}

function openTransferModal() {
  $("modalRoot").innerHTML = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head"><div class="modal-title">Transfer / Issue Part</div><button class="modal-x" onclick="closeModal(event)">&#10005;</button></div>
        <div class="modal-body">
          <label>Part Number</label>
          <select id="trPn">${STORE.parts.map((p) => `<option value="${p.pn}">${p.pn} &mdash; ${p.name} (${p.stock} available)</option>`).join("")}</select>
          <label>Quantity</label>
          <input type="number" id="trQty" value="1" min="1">
          <label>Destination / Aircraft</label>
          <input type="text" id="trDest" value="Z-WPV">
          <label>Issue Type</label>
          <select id="trType"><option>Line Issue</option><option>Hangar Issue</option><option>Inter-store Transfer</option></select>
          <button class="btn-primary" onclick="doTransfer()">Confirm Transfer</button>
        </div>
      </div>
    </div>`;
}

function closeModal(e) {
  if (e && e.target && e.target.classList && e.target.classList.contains("modal-backdrop")) { stopScanner(); $("modalRoot").innerHTML = ""; return; }
  stopScanner();
  $("modalRoot").innerHTML = "";
}
function viewRetail() {
  const items = Object.keys(CONSUMER_DB).map((code) => ({ code, product: CONSUMER_DB[code], mfr: RETAIL_DB[CONSUMER_DB[code].mfr] || null }));
  const brands = new Set(items.map((i) => i.product.brand));
  const origins = new Set(items.map((i) => (i.mfr ? i.mfr.country : "")).filter(Boolean));
  const low = Math.min(...items.map((i) => i.product.price)), high = Math.max(...items.map((i) => i.product.price));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const flagOf = (c) => c === "Zimbabwe" ? "🇿🇼" : c === "Italy" ? "🇮🇹" : c === "South Africa" ? "🇿🇦" : "🌍";
  const qHtml = (v) => v.replace(/</g, "&lt;");
  const drawer = (list) => list.map((i) => `
    <button class="r-card" onclick="retailInspect('${i.code}')">
      <div class="r-card-top"><span class="r-emoji">🛒</span><span class="tag ${i.mfr && i.mfr.country === "Zimbabwe" ? "info" : "violet"}">${flagOf(i.mfr ? i.mfr.country : "")} ${esc(i.mfr ? i.mfr.country : "origin traced")}</span></div>
      <div class="r-name">${esc(i.product.name)}</div>
      <div class="r-brand">${esc(i.product.brand)} · ${esc(i.product.category)}</div>
      <div class="r-foot"><span class="r-price">$${i.product.price.toFixed(2)}</span><span class="r-aisle">📍 ${esc(i.product.aisle)}</span></div>
    </button>`).join("");
  $("viewBody").innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);max-width:820px">
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Catalog Items</span><span class="kpi-ic">&#128722;</span></div><div class="kpi-value">${items.length}</div><div class="kpi-sub">sample retail registry</div><div class="spark"></div></div>
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Brands</span><span class="kpi-ic">&#127871;</span></div><div class="kpi-value">${brands.size}</div><div class="kpi-sub">consumer makers</div><div class="spark"></div></div>
      <div class="kpi"><div class="kpi-top"><span class="kpi-label">Origin Countries</span><span class="kpi-ic">&#127760;</span></div><div class="kpi-value">${origins.size}</div><div class="kpi-sub">from GS1 + labels</div><div class="spark"></div></div>
      <div class="kpi accent"><div class="kpi-top"><span class="kpi-label">Price Range</span><span class="kpi-ic">&#128176;</span></div><div class="kpi-value">$${low.toFixed(2)}<span class="u">–$${high.toFixed(2)}</span></div><div class="kpi-sub">USD retail</div><div class="spark"></div></div>
    </div>
    <div class="rbar"><input id="rSearch" class="scan-input" placeholder="Search name, brand, aisle or origin…" oninput="retailGrep(this.value)"><div class="rbar-count">${items.length} items · scan any GTIN to resolve</div></div>
    <div id="rGrid" class="r-grid">${drawer(items)}</div>`;
}
function retailGrep(v) {
  const q = String(v || "").toLowerCase().trim();
  const items = Object.keys(CONSUMER_DB).map((code) => ({ code, product: CONSUMER_DB[code], mfr: RETAIL_DB[CONSUMER_DB[code].mfr] || null }));
  const hit = items.filter((i) => !q || [i.product.name, i.product.brand, i.product.category, i.product.aisle, (i.mfr ? i.mfr.country : "")].join(" ").toLowerCase().includes(q));
  const drawer = (list) => list.map((i) => `
    <button class="r-card" onclick="retailInspect('${i.code}')">
      <div class="r-card-top"><span class="r-emoji">🛒</span><span class="tag violet">${esc(i.mfr ? i.mfr.country : "")}</span></div>
      <div class="r-name">${esc(i.product.name)}</div>
      <div class="r-brand">${esc(i.product.brand)} · ${esc(i.product.category)}</div>
      <div class="r-foot"><span class="r-price">$${i.product.price.toFixed(2)}</span><span class="r-aisle">📍 ${esc(i.product.aisle)}</span></div>
    </button>`).join("");
  const g = $("rGrid");
  if (g) g.innerHTML = hit.length ? drawer(hit) : `<div class="empty" style="padding:24px">No catalog item matches <b>${qHtml(v)}</b> — that barcode is simply not loaded in this sample registry.</div>`;
}
function retailInspect(code) {
  const a = analyzeCode(code, { format: "MANUAL" });
  $("viewBody").innerHTML = `<div class="scan-kicker"><span class="tag violet">RETAIL CATALOG</span> GTIN <span class="pn">${esc(code)}</span></div>
    ${renderAnalysis(a, { format: "MANUAL" })}
    <div style="margin-top:12px;display:flex;gap:8px;justify-content:center"><button class="btn btn-sm" onclick="viewRetail()">← Back to catalog</button><button class="btn btn-sm" onclick="manualScan('${esc(code)}')">Rescan as store part</button></div>`;
}

function renderAnalysis(a, meta) {
  const openActs = (pn) => `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
      <button class="btn btn-sm btn-accent" onclick="actIssue('${pn}')">Issue part</button>
      <button class="btn btn-sm" onclick="actAog('${pn}')">Raise AOG</button>
      <button class="btn btn-sm" onclick="route('#passport')">Passport</button>
    </div>`;
  const readout = codeReadout(a);

  if (a.status === "company") {
    return readout + companySheet(a.company);
  }
  if (a.status === "exact") {
    return readout + partSheet(a.part, 100) + companyCard(a.company) + openActs(a.part.pn);
  }
  if (a.status === "fuzzy" || a.status === "near") {
    const p = a.part;
    const cls = a.confidence >= 92 ? "tag ok" : a.confidence >= 82 ? "tag info" : "tag warnb";
    return readout + `<div style="margin-top:6px"><span class="tag ${cls}">AI MATCH ${a.confidence}%</span>
      <div style="font-weight:800;font-size:15px;margin-top:6px">${p.name}</div>
      <span class="pn">${p.pn}</span> &middot; ATA ${p.ata} &middot; Bin ${p.loc}</div>
      <div style="font-size:12px;color:var(--dim);margin-top:6px">Read <span class="pn">${esc(a.raw)}</span> — fuzzy-matched by intelligence engine ${a.confidence >= 92 ? "(near-perfect)" : "(low-confidence)"}. Verify against the physical label before issuing.</div>
      ${partSheetMini(p)}${companyCard(a.company)}${openActs(p.pn)}`;
  }
  // none / alternatives
  const alts = (a.alternatives || []).map((x) => `
    <button class="btn btn-sm alt-pill" onclick="manualScan('${x.p.pn}')">${x.p.pn} <span style="opacity:.6">(${x.d})</span></button>`).join("");
  const note = a.consumer
    ? `Decoded a retail / consumer product — not an aviation stores part.`
    : `No exact part for <b>${esc(a.raw)}</b>.`;
  return readout + companyCard(a.company) + (a.consumer ? consumerCard(a) : "") + `<div class="empty" style="padding:18px"><div class="e-ic">&#9888;</div>
    ${note}
    ${a.consumer ? "" : (alts ? `<div style="margin-top:10px;font-size:12px;color:var(--dim)">Closest stocked parts:</div><div style="margin-top:6px">${alts}</div>` : "")}
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      <button class="btn btn-sm btn-accent" onclick="actAog('${esc(a.raw)}')">Raise AOG</button>
      <button class="btn btn-sm" onclick="actRegister('${esc(a.raw)}')">Register new part</button>
    </div></div>`;
}

/* retail/supermarket product card (oil bottles, groceries…) */
function consumerCard(a) {
  if (!a || !a.consumer) return "";
  const p = a.consumer;
  const codeStr = (a.codeInfo && a.codeInfo.payload && (a.codeInfo.payload.gtin || a.codeInfo.payload["01"])) || "";
  const mfrC = a.company && a.company.company ? a.company.company : null;
  const origin = mfrC ? `<span style="color:var(--accent);font-weight:700">${flagOf(mfrC.country)} ${esc(mfrC.country)}</span>` : `<span style="color:var(--dim)">traced</span>`;
  return `<div class="co-card co-consumer">
    <div class="co-head">🛒 PRODUCT INTELLIGENCE <span>// ANY BARCODE</span></div>
    <div class="co-body">
      <div class="co-crest co-retail">🛒</div>
      <div>
        <div class="co-name">${esc(p.name)}</div>
        <div class="co-meta">${esc(p.brand)} &middot; ${esc(p.category)}</div>
        <div class="co-meta">${mfrC ? `<span class="pn">${esc(mfrC.name)}</span>` : ""} &middot; origin ${origin}</div>
      </div>
      <span class="tag violet">RETAIL ITEM</span>
    </div>
    <div class="co-focus"><span class="tag warnb">SAMPLE REGISTRY</span><span class="tag info">${typeof p.price === "number" ? "USD " + p.price.toFixed(2) : "price on enquiry"}</span>${p.aisle ? `<span class="tag neutral">${esc(p.aisle)}</span>` : ""}</div>
    <div class="co-foot"><span>registered retail product</span><span class="pn">GTIN ${codeStr ? esc(codeStr.slice(0, 14)) : "—"}</span><span class="co-stars">${"★".repeat(3)}${"☆".repeat(2)} 3.6</span></div>
  </div>`;
}

/* "2040" manufacturer / origin intelligence cards */
function companyCard(co) {
  if (!co) return "";
  if (co.company) {
    const c = co.company;
    const stars = "★".repeat(Math.round(c.trust)) + "☆".repeat(5 - Math.round(c.trust));
    const seal = c.verified ? '<span class="tag ok co-seal">✔ VERIFIED OEM</span>' : c.sample ? '<span class="tag warnb">SAMPLE REGISTRY</span>' : '<span class="tag warnb">DECLARED · UNVERIFIED</span>';
    return `<div class="co-card">
      <div class="co-head">🛰️ MANUFACTURER INTELLIGENCE <span>// 2040 TERMINAL</span></div>
      <div class="co-body">
        <div class="co-crest">${esc(c.short || c.name.slice(0, 3).toUpperCase())}</div>
        <div>
          <div class="co-name">${esc(c.name)}</div>
          <div class="co-meta">${flagOf(c.country)} ${esc(c.country)} &middot; ${esc(co.how.replace(/-/g, " "))}${co.prefix ? ` &middot; GS1 prefix <span class="pn">${esc(co.prefix)}</span>` : ""}</div>
        </div>
        ${seal}
      </div>
      <div class="co-focus">${(c.focus || []).map((t) => `<span class="tag info">${esc(t)}</span>`).join(" ")}${c.distributor ? '<span class="tag violet">MRO DISTRIBUTOR</span>' : ""}</div>
      <div class="co-foot"><span>assurance <b>${co.conf}%</b></span><span class="co-stars">${stars} ${c.trust.toFixed(1)}</span><span class="pn">${esc(c.ref || co.how + ":" + c.key)}</span></div>
    </div>`;
  }
  /* origin-only / made-in trace for unknown external codes */
  const region = co.gs1Region || co.origin;
  const regionNote = region === "South Africa"
    ? `<div style="font-size:11px;color:var(--dim);margin-top:8px">GS1 prefix <span class="pn">60XX</span> is a <b>regional registration office</b>, not a factory. Prefixes 600/601 are issued by <b>GS1 South Africa</b> to companies across <b>South Africa, Zimbabwe and Namibia</b> — so the actual factory country must come from the label.</div>`
    : "";
  return `<div class="co-card co-origin">
    <div class="co-head">${co.madeIn ? "🏭 MANUFACTURED IN" : "🛰️ ORIGIN TRACE"} <span>// AI</span></div>
    <div style="font-size:12.5px;line-height:1.6;padding:12px">${co.madeIn
      ? `Label declares <b>MADE IN ${esc(co.madeIn)}</b>${co.madeInLabel ? ` (<span class="pn">${esc(co.madeInLabel)}</span> on label)` : ""} — read from the label text by AI, not assumed from the prefix.${co.gs1Region ? ` GS1 office: ${esc(co.gs1Region)}.` : ""}`
      : `Barcode registered in the <b>${esc(region)}</b> GS1 region${co.gtin ? ` (GS1 prefix <span class="pn">${esc(co.gtin.replace(/^0(?=\d{13}$)/, "").slice(0, 3))}…</span>)` : ""}. This is the region where the GTIN was issued — not necessarily the factory. Use <b>Super Scan AI</b> (or a QR-JSON / GS1 label) so the model can read the actual <b>MADE IN</b> country off the label.`}
    ${regionNote}
    </div>
  </div>`;
}
function companySheet(co) {
  if (!co || !co.company) return "";
  const c = co.company;
  const rows = STORE.parts.filter((p) => p.mfrKey === c.key).slice(0, 6);
  return companyCard(co) + `<div class="co-parts"><div style="font-weight:700;font-size:11.5px;letter-spacing:.06em;color:var(--dim);padding:10px 12px 4px">${rows.length ? `${rows.length} part${rows.length === 1 ? "" : "s"} matching this OEM in your fleet` : "No parts from this maker in your fleet"}</div>` +
    rows.map((p) => `<div class="crow"><span class="pn">${p.pn}</span><b>${p.name}</b><span style="margin-left:auto;color:var(--dim)">${p.stock} pcs ${p.stock < p.min ? '<span class="tag danger">REORDER</span>' : ""}</span><button class="btn btn-sm" onclick="manualScan('${p.pn}')">Open</button></div>`).join("") +
    (rows.length >= 6 ? `<div class="crow" style="opacity:.7">+ more in inventory &rarr; <button class="btn btn-sm" onclick="route('#inventory')">inventory</button></div>` : "") +
    `</div>`;
}

/* "What does this code say" readout — GS1 AIs, GTIN checksum, prefix, payload fields */
function codeReadout(a) {
  const c = a && a.codeInfo;
  if (!c) return "";
  const chips = [c.sym, c.kind].filter(Boolean).map((x) => `<span class="tag ${c.kind === "GS1-128" ? "violet" : c.validGtin === true ? "ok" : c.validGtin === false ? "danger" : "info"}">${esc(x)}</span>`).join(" ");
  const pl = c.payload || {};
  const lines = [];
  const fields = [];
  if (c.consumer && c.consumer.product) {
    const prv = c.consumer.product;
    lines.push(`Product: <b>${esc(prv.name)}</b> — ${esc(prv.brand)} · ${esc(prv.category)}`);
  }
  if (pl.upca) lines.push(`Compact UPC-E expands to UPC-A <span class="pn">${esc(pl.upca)}</span>`);
  if (pl.gtin) {
    const valid = c.validGtin === true ? '<span class="tag ok">CHECK DIGIT OK</span>' : c.validGtin === false ? '<span class="tag danger">CHECK DIGIT INVALID</span>' : "";
    lines.push(`GTIN <span class="pn">${pl.gtin}</span> ${valid} — GS1 prefix: ${gtinRegion(String(pl.gtin))}`);
  }
  if (pl["01"]) {
    const validT = c.validGtin === true ? '<span class="tag ok">VALID GTIN</span>' : c.validGtin === false ? '<span class="tag danger">BAD CHECK DIGIT</span>' : "";
    lines.push(`Application Identifier 01 — GTIN <span class="pn">${pl["01"]}</span> ${validT}`);
  }
  [["10","Batch / lot"],["21","S/N"],["37","Qty"],["30","Qty"],["400","PO"],["241","Customer PN"]].forEach(([ai, lab]) => {
    if (pl[ai]) lines.push(`${lab}: <b>${esc(pl[ai])}</b>`);
  });
  [["11","Prod"],["13","Pack"],["15","Best-before"],["17","Expiry"]].forEach(([ai, lab]) => {
    if (pl[ai]) lines.push(`${lab}: <b>${esc(pl[ai + "Label"] || pl[ai])}</b>`);
  });
  if (pl.gtin === undefined && pl["01"] === undefined && c.payload && c.kind === "QR-JSON payload") {
    Object.keys(pl).forEach((k) => fields.push(`<div><span class="ai-k">${esc(k)}</span><b>${esc(String(pl[k]))}</b></div>`));
  }
  if (!lines.length && !fields.length && c.note) lines.push(esc(`${c.note}${c.kind === "Part number label" ? " — part resolved from label" : ""}`));
  return `<div class="ocr-raw readout">${chips ? `<div style="margin-bottom:6px">${chips}</div>` : ""}${lines.map((l) => `<div style="margin:2px 0">${l}</div>`).join("")}${fields.length ? `<div class="ai-prop-grid">${fields.join("")}</div>` : ""}</div>`;
}

function partSheet(p, conf) {
  const low = p.stock < p.min;
  const mfr = COMPANY_DB[p.mfrKey] || null;
  return `<div style="margin-top:6px"><span class="tag ok">${typeof conf === "number" ? "EXACT " + conf + "%" : "VERIFIED"}</span>
    <div style="font-weight:800;font-size:15px;margin-top:6px">${p.name}</div>
    <span class="pn">${p.pn}</span> &middot; ATA ${p.ata} &middot; Bin ${p.loc}</div>
    ${p.desc ? `<div style="font-size:12.5px;color:var(--dim);margin:6px 0 2px">${p.desc}</div>` : ""}
    <div class="dl">
      <div><div class="k">Stock on hand</div><div class="v">${p.stock} pcs (min ${p.min}) ${low ? '<span class="tag danger">REORDER</span>' : '<span class="tag ok">HEALTHY</span>'}</div></div>
      <div><div class="k">Manufacturer</div><div class="v">${mfr ? `${flagOf(mfr.country)} ${esc(mfr.name)} <span class="pn">${esc(mfr.short)}</span>` : "—"}</div></div>
      <div><div class="k">Release certificate</div><div class="v">${p.cert}</div></div>
      <div><div class="k">Shelf-life</div><div class="v">${p.life === "EXPIRING" ? '<span class="tag warnb">QUARANTINED</span>' : '<span class="tag info">VALID</span>'}</div></div>
      <div><div class="k">Blockchain passport</div><div class="v"><span class="pn">0x${(p.pn.split("").reduce((a, c) => a + c.charCodeAt(0), 0)).toString(16)}…</span></div></div>
    </div>`;
}

function partSheetMini(p) {
  const low = p.stock < p.min;
  return `<div class="dl" style="margin-top:10px">
      <div><div class="k">Stock</div><div class="v">${p.stock} pcs ${low ? '<span class="tag danger">REORDER</span>' : ""}</div></div>
      <div><div class="k">Certificate</div><div class="v">${p.cert}</div></div>
    </div>`;
}
/* ---------------- Bin Map ---------------- */
const RACKS = [
  { id: 1, name: "Rack A — Systems & Avionics", color: "#3f9bff", cols: 9, bins: [["21-01",14,18],["22-02",9,9],["24-03",7,5],["26-04",16,16],["27-05",11,11],["28-06",3,8],["29-07",12,12],["30-08",8,6],["31-09",15,15]] },
  { id: 2, name: "Rack B — Landing Gear", color: "#f5b12d", cols: 8, bins: [["32-01",2,9],["32-02",6,6],["32-03",14,10],["32-04",1,8],["32-05",9,9],["32-06",4,4],["32-07",7,5],["32-08",11,11]] },
  { id: 3, name: "Rack C — Engines & Interior", color: "#9a7bff", cols: 8, bins: [["52-01",10,10],["56-02",13,13],["72-03",6,4],["73-04",9,9],["74-05",5,3],["76-06",12,12],["78-07",8,8],["80-08",7,5]] }
];
const BINMATCH = { "28-06": "GEN-24-410", "73-04": "GST-304-88", "32-01": "BSC-64-73221", "74-05": "SEAL-74-061" };

function viewBins() {
  $("viewSub").textContent = "Interactive rack / shelf / bin grid, colour-coded by ATA Spec 100 chapter.";
  $("viewActions").innerHTML = `<span class="chip">Module 1</span><span class="chip">Module 8 <b>IoT</b></span>`;
  $("viewBody").innerHTML = `
    <div class="legend">
      <span><i class="swatch" style="background:#3f9bff"></i> ATA 21–36 Systems</span>
      <span><i class="swatch" style="background:#f5b12d"></i> ATA 32 Landing Gear</span>
      <span><i class="swatch" style="background:#9a7bff"></i> ATA 52+ Interior / 72–80 Engine</span>
      <span><i class="swatch" style="background:transparent;border:1px dashed #f04e4e"></i> Below reorder</span>
    </div>
    <div id="rackArea"></div>
    <div class="panel detail-sheet" id="binDetail"><div class="empty"><div class="e-ic">&#9642;</div>Select a bin to inspect stock, certificates & blockchain passport.</div></div>`;

  const area = $("rackArea");
  area.innerHTML = RACKS.map((r) => `
    <div class="rack">
      <div class="rack-title"><span class="r-ic">&#9783;</span> ${r.name} <span class="chip">${r.cols} columns</span></div>
      <div class="rack-row" style="--cols:${r.cols}">
        <div class="rack-side">R${r.id}</div>
        ${r.bins.map(([code, stock, min], i) => {
          const low = stock < min;
          const alpha = low ? 0.45 : 0.35;
          return `<div class="bin ${low ? "low" : ""}" style="background:rgba(${hexToRgb(r.color)},${alpha})" data-rack="${r.id}" data-idx="${i}" data-color="${r.color}">
            <div>${code}</div><small>${stock}</small>
          </div>`;
        }).join("")}
      </div>
    </div>`).join("");

  area.querySelectorAll(".bin").forEach((b) => b.addEventListener("click", selectBin));
}

function hexToRgb(hex) { const h = hex.replace("#", ""); const f = (i) => parseInt(h.substr(i, 2), 16); return `${f(0)},${f(2)},${f(4)}`; }

function selectBin(e) {
  const bin = e.currentTarget;
  document.querySelectorAll(".bin").forEach((b) => b.classList.remove("selected"));
  bin.classList.add("selected");
  const rack = RACKS.find((r) => r.id == bin.dataset.rack);
  const [code, stock, min] = rack.bins[parseInt(bin.dataset.idx, 10)];
  const loc = `R${rack.id}-B${parseInt(bin.dataset.idx, 10) + 1}`;
  const matched = Object.keys(BINMATCH).find((k) => rack.bins[parseInt(bin.dataset.idx, 10)][0] === k);
  const part = STORE.parts.find((p) => p.pn === BINMATCH[matched]) ||
    { pn: "MISC-ATA-" + code.replace("-", ""), name: "Consumable / hardware", cert: "Batch cert on file", life: "OK", unit: 0 };
  const pn = part.pn;
  $("binDetail").innerHTML = `
    <div class="panel-head"><div class="panel-title">Bin ${code} &mdash; ${rack.name.replace(" — ", " · ")}</div>
      <span class="${stock < min ? "tag danger" : "tag ok"}">${stock < min ? "BELOW REORDER" : "IN STOCK"}</span></div>
    <div class="panel-body">
      <div style="margin-bottom:8px"><b>${part.name}</b><br><span class="pn">${pn}</span></div>
      <div class="dl">
        <div><div class="k">Physical location</div><div class="v">${loc} · Rack ${rack.id}</div></div>
        <div><div class="k">Stock on hand</div><div class="v">${stock} pcs (min ${min})</div></div>
        <div><div class="k">Release certificate</div><div class="v">${part.cert}</div></div>
        <div><div class="k">Shelf-life status</div><div class="v">${part.life === "EXPIRING" ? '<span class="tag warnb">QUARANTINED</span>' : '<span class="tag info">VALID</span>'}</div></div>
        <div><div class="k">Blockchain passport</div><div class="v"><span class="pn">0x${Math.abs(((pn + "|" + code).split("").reduce((a, c) => a + c.charCodeAt(0), 0))).toString(16)}... </span></div></div>
        <div><div class="k">IoT condition</div><div class="v">${stock < min ? '<span class="tag warnb">AI FLAG</span>' : '<span class="tag ok">NOMINAL</span>'}</div></div>
      </div>
    </div>`;
}
/* ---------------- AOG Desk (kanban) ---------------- */
function viewAog() {
  $("viewSub").textContent = "Emergency parts pipeline — Requested → Picked → Issued → Installed.";
  $("viewActions").innerHTML = `<button class="btn btn-accent" onclick="openAogModal()">+ Raise AOG</button><span class="chip">Module 3</span>`;

  const cols = [
    ["requested", "Requested", STORE.aog.filter((a) => a.step === 0)],
    ["picked", "Picked", STORE.aog.filter((a) => a.step === 1)],
    ["issued", "Issued", STORE.aog.filter((a) => a.step === 2)],
    ["installed", "Installed", STORE.aog.filter((a) => a.step === 3)]
  ];
  $("viewBody").innerHTML = `
    <div class="kanban">${cols.map(([cls, label, items]) => `
      <div class="kb-col ${cls}">
        <div class="kb-head"><span class="kb-dot"></span>${label}<span class="cnt">${items.length}</span></div>
        <div class="kb-body">${items.map(kbCard).join("") || `<div class="empty" style="padding:24px 8px">No items</div>`}</div>
      </div>`).join("")}
    </div>
    <div class="panel"><div class="panel-head"><div class="panel-title">AOG activity log</div></div>
      <div class="panel-body" id="aogLog">${activityFeedHTML()}</div></div>`;
}

function kbCard(a) {
  const cls = a.urgency === "AOG" ? "kb-aog" : a.urgency === "HIGH" ? "kb-high" : "";
  const next = a.step < 3;
  return `<div class="kb-card ${cls}">
    <div class="kb-top"><span class="kb-ref">${a.ref}</span>
      <span class="tag ${a.urgency === "AOG" ? "danger" : a.urgency === "HIGH" ? "warnb" : "neutral"}">${a.urgency}</span></div>
    <div class="kb-part">${a.pn}</div>
    <div class="kb-meta">${a.reg} · ${a.wo}<br>${a.t}m elapsed</div>
    ${next ? `<div class="kb-actions"><button class="btn btn-sm btn-accent" onclick="advanceAog('${a.ref}')">Advance &rarr;</button></div>` : ""}
  </div>`;
}

function openAogModal() {
  $("modalRoot").innerHTML = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head"><div class="modal-title">Raise Emergency AOG</div><button class="modal-x" onclick="closeModal(event)">&#10005;</button></div>
        <div class="modal-body">
          <label>Part Number</label>
          <select id="aogPn">${STORE.parts.map((p) => `<option value="${p.pn}">${p.pn} — ${p.name}</option>`).join("")}</select>
          <label>Aircraft Registration</label>
          <input type="text" id="aogReg" value="Z-WPV">
          <label>Work Order</label>
          <input type="text" id="aogWo" value="WO-24519">
          <label>Urgency</label>
          <select id="aogUrg"><option value="AOG">AOG — Grounded</option><option value="HIGH">High — Next dispatch</option><option value="ROUTINE">Routine</option></select>
          <button class="btn-primary" onclick="doRaiseAog()">Raise Requisition</button>
        </div>
      </div>
    </div>`;
}

function doRaiseAog() {
  const pn = $("aogPn").value;
  const a = { ref: `AOG-${String(88214 + STORE.aog.length + 1)}`, pn, reg: $("aogReg").value || "Z-WPV", wo: $("aogWo").value || "WO-24519", urgency: $("aogUrg").value, step: 0, t: 0 };
  STORE.aog.unshift(a);
  closeModal();
  toast("danger", "AOG requisition raised", `${a.ref} — ${pn} for ${a.reg}. Store notified instantly.`);
  pushEvent("danger", a.ref + " raised", `${pn} for ${a.reg} — ${a.urgency}`, "danger");
  route(location.hash);
}

function advanceAog(ref) {
  const a = STORE.aog.find((x) => x.ref === ref);
  if (!a) return;
  const label = ["Requested", "Picked", "Issued", "Installed"];
  a.step++;
  if (a.step === 1) pushEvent("info", a.ref + " picked", `${a.pn} picked at store`, "info");
  if (a.step === 2) pushEvent("ok", a.ref + " issued", `${a.pn} released to ${a.reg}`, "ok");
  if (a.step === 3) { pushEvent("ok", a.ref + " installed", `${a.pn} installed — WO ${a.wo} cleared`, "ok"); toast("ok", "AOG resolved", `${a.ref} — ${a.pn} installed on ${a.reg}. Aircraft cleared for dispatch.`); }
  else toast("info", `Step advanced`, `${a.ref} is now ${label[a.step]}.`, "info");
  route(location.hash);
}

/* ---------------- Requisitions ---------------- */
function viewRequisitions() {
  $("viewSub").textContent = "Full requisition ledger with real-time status and digital signatures.";
  $("viewActions").innerHTML = `<button class="btn btn-accent" onclick="openReqModal()">+ New Requisition</button>`;
  const rows = [...STORE.reqs].reverse().map((r) => `
    <tr>
      <td><span class="pn">${r.ref}</span></td>
      <td><span class="pn">${r.pn}</span></td>
      <td>${r.qty}</td>
      <td>${r.reg}</td>
      <td>${r.wo}</td>
      <td><span class="tag ${r.urgency === "AOG" ? "danger" : r.urgency === "HIGH" ? "warnb" : "neutral"}">${r.urgency}</span></td>
      <td><span class="tag ${r.step === 3 ? "ok" : r.step === 2 ? "info" : r.step === 1 ? "neautral" : ""}">${["Requested","Picked","Issued","Installed"][r.step]}</span></td>
      <td>${r.by}</td>
      <td class="num">${r.t}m</td>
    </tr>`).join("");
  $("viewBody").innerHTML = `
    <div class="panel">
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Ref</th><th>Part</th><th>Qty</th><th>Aircraft</th><th>WO</th><th>Urgency</th><th>Status</th><th>Raised by</th><th>Elapsed</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
}

function openReqModal() {
  $("modalRoot").innerHTML = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-head"><div class="modal-title">New Store Requisition</div><button class="modal-x" onclick="closeModal(event)">&#10005;</button></div>
        <div class="modal-body">
          <label>Part Number</label>
          <select id="reqPn">${STORE.parts.map((p) => `<option value="${p.pn}">${p.pn} — ${p.name}</option>`).join("")}</select>
          <label>Quantity</label>
          <input type="number" id="reqQty" value="1" min="1">
          <label>Aircraft Registration</label>
          <input type="text" id="reqReg" value="Z-WRH">
          <label>Work Order</label>
          <input type="text" id="reqWo" value="WO-24520">
          <label>Urgency</label>
          <select id="reqUrg"><option value="ROUTINE">Routine</option><option value="HIGH">High — Next dispatch</option><option value="AOG">AOG — Grounded</option></select>
          <button class="btn-primary" onclick="doNewReq()">Create Requisition</button>
        </div>
      </div>
    </div>`;
}

function doNewReq() {
  const pn = $("reqPn").value;
  const qty = parseInt($("reqQty").value, 10) || 1;
  const r = addReq(pn, qty, $("reqWo").value || "WO-24520", $("reqReg").value || "Z-WRH", $("reqUrg").value);
  closeModal();
  toast("ok", "Requisition created", `${r.ref} — ${pn} × ${qty}.`);
  pushEvent("info", r.ref + " created", `${pn} × ${qty} for ${r.reg}`, "info");
  route(location.hash);
}

/* ---------------- Forecast view (model-driven) ---------------- */
function viewForecast() {
  $("viewSub").textContent = "AI predictive demand engine — Holt's method on live per-part history. Flags stockouts weeks ahead.";
  $("viewActions").innerHTML = `<span class="chip">Model: Holt-Trend</span><span class="chip">Horizon 8wk</span><span class="chip">Live recompute</span>`;

  // Rank every part by AI stockout risk
  const ranked = STORE.parts
    .map((p) => { const f = aiForecast(p.pn); const r = aiReorder(p.pn, f); return { p, r, f }; })
    .sort((a, b) => b.r.riskScore - a.r.riskScore);

  const riskCards = ranked.slice(0, 8).map(({ p, r }, i) => {
    const cls = r.risk === "HIGH" ? "warn" : r.risk === "MEDIUM" ? "" : "ok";
    const pill = r.risk === "HIGH" ? '<span class="tag danger">AOG RISK</span>'
      : r.risk === "MEDIUM" ? '<span class="tag warnb">WATCH</span>'
      : '<span class="tag ok">HEALTHY</span>';
    return `<div class="kpi ${cls}"><div class="kpi-label">#${i + 1} · ${p.pn}</div><div class="kpi-value" style="font-size:22px">${r.risk}</div><div class="kpi-sub">${r.daysTo === null ? "no stockout in 8w" : "stockout ≈ " + r.daysTo + "d · order " + r.qty + " pcs"} ${pill}</div></div>`;
  }).join("") + (ranked.length > 8 ? `<div class="kpi"><div class="kpi-label">Full list</div><div class="kpi-value" style="font-size:20px">${STORE.parts.length}<span class="u">LN</span></div><div class="kpi-sub">${ranked.length - 8} more items risk-ranked below</div></div>` : "");

  const top = ranked[0];
  const part = top.p;
  const hist = top.f.history.slice(-8);
  const fc = top.f.forecast;

  $("viewBody").innerHTML = `
    <div class="kpi-grid">${riskCards}</div>
    <div class="panel"><div class="panel-head"><div class="panel-title">Highest-risk part <span class="pn" style="font-size:13px">${part.pn}</span> — demand vs stock on hand <span class="dim">(recomputed from ${top.f.history.length} weeks)</span></div></div>
      <div class="panel-body"><canvas id="chartPred" height="130"></canvas></div></div>
    <div class="panel" style="margin-top:14px"><div class="panel-head"><div class="panel-title">AI reorder plan <span class="dim">auto-generated · risk-ordered</span></div></div>
      <div class="panel-body">
        ${ranked.filter((x) => x.r.risk !== "HEALTHY").slice(0, 15).map(({ p, r }) => `
          <div class="reorder-row" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)">
            <div><b><span class="pn">${p.pn}</span></b> &mdash; ${p.name}<br><small style="color:var(--dim)">${p.stock} on hand vs min ${p.min} · forecast ${Math.round(r.avgWk)}/wk · stockout ~<b style="color:var(--amber)">${r.daysTo === null ? ">8w" : r.daysTo + "d"}</b></small></div>
            <div style="text-align:right"><span class="tag warnb">ORDER ${r.qty} PCS</span><br><small style="color:var(--dim)">$${(r.qty * p.unit).toLocaleString()}</small></div></div>`).join("")}
        ${(() => {
          const rest = ranked.filter((x) => x.r.risk !== "HEALTHY").length - 15;
          if (rest > 0) return `<div class="empty" style="padding:12px">+ ${rest} more items below reorder point — see full inventory grid.</div>`;
          if (ranked.filter((x) => x.r.risk !== "HEALTHY").length === 0) return `<div class="empty" style="padding:14px">All parts carry enough stock vs forecast.</div>`;
          return "";
        })()}
      </div></div>`;
  try {
    killChart("chartPred");
    const labels = [...top.f.history.map((_, i) => "W" + (i - top.f.history.length + 1)), "+1", "+2", "+3", "+4", "+5", "+6", "+7", "+8"];
    charts.chartPred = new Chart($("chartPred"), { type: "line", data: {
      labels,
      datasets: [
        { label: "Demand (hist + forecast)", data: [...hist, ...fc], borderColor: "#f5b12d", backgroundColor: "rgba(245,177,45,0.10)", fill: true, tension: 0.35 },
        { label: "Stock on hand (proj.)", data: top.f.stockProj, borderColor: "#3f9bff", tension: 0.35 },
        { label: "Safety stock", data: top.f.safetyProj, borderColor: "#f04e4e", borderDash: [6,5], pointRadius: 0 }
      ] }, options: baseOpts() });
  } catch (err) { console.warn("Forecast chart skipped:", err); }
}

/* ---------------- Compliance ---------------- */
function viewCompliance() {
  $("viewSub").textContent = "Certificates, shelf-life controls and FOD evidence — EASA / FAA / CAA traceability.";
  $("viewActions").innerHTML = `<span class="chip">Part 145 MEM</span><span class="chip">EASA · FAA · CAA</span>`;
  $("viewBody").innerHTML = `
    <div class="kpi-grid">
      <div class="kpi warn"><div class="kpi-label">FOD Open Logs</div><div class="kpi-value">2</div><div class="kpi-sub">unreturned tools pending</div></div>
      <div class="kpi"><div class="kpi-label">Certificates Valid</div><div class="kpi-value">98<span class="u">%</span></div><div class="kpi-sub">of 112 on file</div></div>
      <div class="kpi"><div class="kpi-label">Shelf-Life Quarantines</div><div class="kpi-value">1</div><div class="kpi-sub">expiring batch held</div></div>
      <div class="kpi"><div class="kpi-label">E-Release Signed</div><div class="kpi-value">23</div><div class="kpi-sub">this month, no paper</div></div>
    </div>
    <div class="grid" style="margin-bottom:14px">
      <div class="panel"><div class="panel-head"><div class="panel-title">Shelf-life & certificates at risk</div></div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Part</th><th>Batch</th><th>Expiry</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td><span class="pn">WHB-32-881</span></td><td>B-22044</td><td class="num">22 days</td><td><span class="tag warnb">QUARANTINE</span></td></tr>
            <tr><td><span class="pn">SEAL-74-061</span></td><td>B-22193</td><td class="num">48 days</td><td><span class="tag info">FEFO QUEUE</span></td></tr>
          </tbody>
        </table></div></div>
      <div class="panel"><div class="panel-head"><div class="panel-title">FOD control — open tool logs</div></div>
        <div class="table-wrap"><table class="tbl">
          <thead><tr><th>Tool</th><th>WO</th><th>Checked out</th><th>Idle</th></tr></thead>
          <tbody>
            <tr><td>Torque wrench TQ-18</td><td>WO-24518</td><td>2h ago</td><td><span class="tag danger">MISSING</span></td></tr>
            <tr><td>Megger MT-4</td><td>WO-24505</td><td>5h ago</td><td><span class="tag warnb">UNRETURNED</span></td></tr>
          </tbody>
        </table></div></div>
    </div>
    <div class="panel"><div class="panel-head"><div class="panel-title">Recent legal e-releases <span class="dim">digitally signed, PKI-backed</span></div></div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Ref</th><th>Part</th><th>Released to</th><th>Signatory</th><th>Certificate</th><th>Time</th></tr></thead>
        <tbody>
          <tr><td><span class="pn">REL-3311</span></td><td>GST-304-88</td><td>WO-24497 / Z-WRH</td><td>K. Moyo (QP)</td><td>EASA F1 #E-20164</td><td>09:21</td></tr>
          <tr><td><span class="pn">REL-3310</span></td><td>OIL-79-112</td><td>WO-24490 / Z-WQA</td><td>M. Chikumba</td><td>FAA 8130-3 #F-88093</td><td>08:55</td></tr>
        </tbody>
      </table></div></div>
  `;
}

/* ---------------- Passport ---------------- */
function viewPassport() {
  $("viewSub").textContent = "Immutable chain-of-custody per serial number — verifiable by regulators and lessors.";
  $("viewActions").innerHTML = `<button class="btn btn-accent" onclick="scanPassport()">&#10026; Scan New Serial</button>`;
  const chain = [
    ["OEM Manufacturing", "Safran Landing Systems · Rev 2", "0x3f9a12c401d7e88344bb01fa"],
    ["Release to Service", "EASA Form 1 #E-88213", "0x77e4b1d205af64c9aa12c304"],
    ["Airline Acceptance", "Air Zimbabwe Stores · Bin R2-B1", "0x33aa90e8f4412b07de5f1190"],
    ["Line AOG Issue", "Issued WO-24518 · Z-WPV", "0x11c8d45f908ea232c9b022e1"],
    ["Installation Proof", "Installed on Z-WPV · Signed K. Moyo", "0x05eba2117f003dd8704ccf2a"]
  ];
  $("viewBody").innerHTML = `
    <div class="grid">
      <div class="panel"><div class="panel-body">
        <div class="passport-head"><div><div class="passport-sn">SERIAL BSC-64-73221-77412</div>
          <div style="color:var(--dim);font-size:13px">Wheel & Brake Assembly · Batch B-22044</div></div>
          <span class="verified">&#10003; VERIFIED · CHAIN INTACT</span></div>
        <div class="hint" style="font-size:12px;color:var(--dim);margin-bottom:6px">5 ledger entries · Hyperledger Fabric · immutability proof present</div>
        <div>${chain.map(([e, w, h], i) => `<div class="step ${i === chain.length - 1 ? "done" : "done"}"><div class="line"></div>
          <div><b>${e}</b><br><span class="who">${w}</span><span class="hash">${h.slice(0, 24)}…</span></div></div>`).join("")}</div>
      </div></div>
      <div class="panel"><div class="panel-head"><div class="panel-title">Regulator / Lessor audit vault</div></div>
        <div class="panel-body">
          <div class="notif-item"><i class="n-dot" style="background:var(--green)"></i><div>Tamper seal intact — no records altered since OEM issue.<small>last verification: today 08:00</small></div></div>
          <div class="notif-item"><i class="n-dot" style="background:var(--accent-2)"></i><div>Zero counterfeit risk — provenance rooted to OEM digital signature.<small>validate in 1 click</small></div></div>
          <div class="notif-item"><i class="n-dot" style="background:var(--violet)"></i><div>Lessor read-access granted: AFJ / ZWL lessors.<small>audit export ready</small></div></div>
        </div></div>
    </div>`;
}

function scanPassport() {
  toast("info", "Scanner active", "Scanning serial… BSC-64-73221. Passport verified — chain intact.");
  route("#passport");
}
/* ---------------- Reports ---------------- */
function viewReports() {
  $("viewSub").textContent = "Executive analytics — spend, velocity, reliability and compliance posture.";
  $("viewActions").innerHTML = `<button class="btn" onclick="exportReport()">&#8681; Export CSV</button>`;
  $("viewBody").innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">MRO Spend (30d)</div><div class="kpi-value">$218<span class="u">K</span></div><div class="kpi-sub">&#8595; 12% vs AI forecast baseline</div></div>
      <div class="kpi accent"><div class="kpi-label">AOG Cost Avoided</div><div class="kpi-value">$94<span class="u">K</span></div><div class="kpi-sub">predictive alerting this quarter</div></div>
      <div class="kpi"><div class="kpi-label">Pick-to-Issue Time</div><div class="kpi-value">11<span class="u">m</span></div><div class="kpi-sub">down from 47m at go-live</div></div>
      <div class="kpi"><div class="kpi-label">Inventory Accuracy</div><div class="kpi-value">99.2<span class="u">%</span></div><div class="kpi-sub">cycle-count reconciled</div></div>
    </div>
    <div class="grid">
      ${panelChart("Monthly spend by ATA chapter", "chartSpend")}
      ${panelChart("Fill-rate performance", "chartFill")}
    </div>`;
  try {
    killChart("chartSpend");
    charts.chartSpend = new Chart($("chartSpend"), { type: "bar", data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun"],
      datasets: [{ label: "Spend ($K)", data: [187, 164, 209, 198, 231, 218], backgroundColor: "#3f9bff", borderRadius: 6 }]
    }, options: baseOpts({ labels: false }) });
    killChart("chartFill");
    charts.chartFill = new Chart($("chartFill"), { type: "line", data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun"],
      datasets: [
        { label: "Fill rate %", data: [78, 83, 87, 91, 95, 97], borderColor: "#18c98d", tension: 0.35, fill: true, backgroundColor: "rgba(24,201,141,0.1)" },
        { label: "Target", data: [95, 95, 95, 95, 95, 95], borderColor: "#8496b4", borderDash: [5,5], pointRadius: 0 }
      ] }, options: baseOpts() });
  } catch (err) { console.warn("Report charts skipped:", err); }
}

function exportReport() {
  const csv = "Part,Stock,Min,Status\n" + STORE.parts.map((p) => `${p.pn},${p.stock},${p.min},${p.stock < p.min ? "REORDER" : "OK"}`).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "tslms_inventory_report.csv"; a.click();
  toast("ok", "Report exported", "inventory_report.csv downloaded.");
}
