/* ==========================================================================
   TSLMS AI CORE — client-side intelligence layer
   Real, interpretable algorithms running 100% in the browser (GitHub Pages OK):
     · Seeded demand model (deterministic per part number)
     · Holt's linear-trend forecasting (double exponential smoothing)
     · Rolling z-score anomaly detection
     · Reorder intelligence (risk · days-to-stockout · order quantity)
     · Natural-language intent engine + AI assistant with approval flows
   No external services, no API keys, no network needed.
   ========================================================================== */
"use strict";

/* ---------------- Deterministic RNG + demand model ---------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* 12 weeks of weekly demand, seeded by PN — trend + seasonality + noise */
function demandHistory(pn, weeks = 12) {
  const rng = mulberry32(hashStr(pn));
  const p = STORE.parts.find((x) => x.pn === pn) || STORE.parts[0];
  const base = Math.max(1, Math.round(rng() * 2 + 0.8));
  const out = [];
  for (let i = 0; i < weeks; i++) {
    const trend = 1 + i * 0.08;
    const season = 1 + 0.22 * Math.sin(i / 3.1 + (hashStr(pn) % 7));
    const noise = 0.85 + rng() * 0.3;
    out.push(Math.max(0, Math.round(base * trend * season * noise)));
  }
  return out;
}

/* Holt's linear trend — level + trend smoothing, RMSE-bounded forecast */
function holt(series, horizon, alpha = 0.5, beta = 0.3) {
  const n = series.length;
  if (!n) return { level: 0, trend: 0, forecast: [], rmse: 0, fitted: [] };
  let level = series[0];
  let trend = (series[1] - series[0]) || 0.1;
  const fitted = [];
  for (let i = 1; i < n; i++) {
    const prevL = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevL) + (1 - beta) * trend;
    fitted.push(level);
  }
  const err = series.slice(1).map((v, i) => v - fitted[i]);
  const rmse = Math.sqrt(err.reduce((s, e) => s + e * e, 0) / Math.max(1, err.length));
  const forecast = [];
  for (let k = 1; k <= horizon; k++) forecast.push(Math.max(0, Math.round(level + k * trend)));
  return { level, trend, forecast, rmse, fitted };
}

/* Anomaly detection — rolling window z-score */
function anomalies(series, window = 4, z = 2) {
  const flags = series.map(() => false);
  for (let i = window; i < series.length; i++) {
    const w = series.slice(i - window, i);
    const mean = w.reduce((a, b) => a + b, 0) / w.length;
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - mean) * (b - mean), 0) / w.length) || 1;
    if (Math.abs(series[i] - mean) / sd > z) flags[i] = true;
  }
  return flags;
}

/* Full forecast package for one part */
function aiForecast(pn) {
  const p = STORE.parts.find((x) => x.pn === pn);
  const history = demandHistory(pn);
  const H = holt(history, 8);
  const flags = anomalies(history);
  const stockProj = [];
  const safetyProj = [];
  let bal = p ? p.stock : 0;
  const safety = p ? p.min : 0;
  [...history.slice(-8), ...H.forecast].forEach((d) => {
    bal = Math.max(0, bal - d);
    stockProj.push(Math.round(bal));
    safetyProj.push(safety);
  });
  return { pn, history, forecast: H.forecast, rmse: H.rmse, flags, stockProj, safetyProj, horizon: 8 };
}

/* Reorder intelligence — risk level, days-to-stockout, suggested order qty */
function aiReorder(pn, f) {
  f = f || aiForecast(pn);
  const p = STORE.parts.find((x) => x.pn === pn) || STORE.parts[0];
  const avgWk = f.forecast.reduce((a, b) => a + b, 0) / Math.max(1, f.forecast.length) || 1;
  let bal = p.stock;
  let daysTo = null;
  for (let i = 0; i < f.forecast.length; i++) {
    bal -= f.forecast[i];
    if (bal < 0) { daysTo = (i + 1) * 7; break; }
  }
  const safetyGap = Math.max(0, p.min - p.stock);
  let risk, riskScore;
  if (p.stock < p.min || (daysTo !== null && daysTo <= 7)) { risk = "HIGH"; riskScore = 3; }
  else if (daysTo !== null && daysTo <= 21) { risk = "MEDIUM"; riskScore = 2; }
  else if (p.stock >= p.min) { risk = "HEALTHY"; riskScore = 0; }
  else { risk = "LOW"; riskScore = 1; }
  const suggest = p.stock < p.min ? safetyGap + Math.ceil(avgWk * 2) : (risk === "HIGH" || risk === "MEDIUM") ? Math.ceil(avgWk * 2) : 0;
  return { pn, risk, riskScore, daysTo, avgWk, qty: suggest };
}

/* ---------------- NLP INTENT ENGINE ---------------- */
function aiParse(text) {
  const t = String(text || "").trim();
  const low = t.toLowerCase();
  const out = { intent: "help", pn: null, qty: 1, reg: null, wo: null, urgency: "ROUTINE", confidence: 0.5, raw: t };

  const intents = [
    ["help", /\b(help|what can you do|commands|capabilities|features)\b/i],
    ["summary", /\b(summary|overview|how are we|how are things|kpi|status report|give me the numbers)\b/i],
    ["stock", /\b(stock|how many|have left|on hand|quantity|count|available|level)\b/i],
    ["forecast", /\b(forecast|predict|run out|stockout|demand|out of stock|reorder|expire)\b/i],
    ["aog", /\b(aog|grounded|ground|emergency|aircraft on ground)\b/i],
    ["req", /\b(raise|create|order|buy|purchase|requisition|need|procure|get.*(qty|units|pieces|pcs))\b/i],
    ["issue", /\b(issue|release|dispatch)\b/i]
  ];
  let best = 0, bestKey = "help";
  for (const [key, re] of intents) {
    const m = low.match(re);
    if (m && m[0].length / Math.max(1, low.length) > best) { best = m[0].length / Math.max(1, low.length); bestKey = key; }
  }
  out.intent = bestKey;

  /* part resolution: exact PN / name / alias / fuzzy */
  const pnHit = STORE.parts.find((p) => low.includes(p.pn.toLowerCase()) || low.includes(p.name.toLowerCase()));
  if (pnHit) out.pn = pnHit.pn;
  if (!out.pn) {
    const aliases = {
      "brake": "BSC-64-73221", "wheel": "BSC-64-73221",
      "hydraulic": "HYP-100-2", "fuel flow": "FFT-450-A", "transmitter": "FFT-450-A",
      "hub": "WHB-32-881", "seal": "SEAL-74-061", "generator": "GEN-24-410",
      "starter": "APU-49-300", "apu": "APU-49-300", "bearing": "BRG-27-230",
      "valve": "GST-304-88", "cooler": "OIL-79-112",
      "pump": "PMP-28-92", "boost": "PMP-28-92"
    };
    for (const k of Object.keys(aliases)) { if (low.includes(k)) { out.pn = aliases[k]; break; } }
  }
  if (!out.pn) {
    let bestP = null, bestD = 99;
    for (const p of STORE.parts) {
      if (lev(norm(t), norm(p.pn)) < bestD) { bestD = lev(norm(t), norm(p.pn)); bestP = p; }
    }
    if (bestP && bestD <= 2) out.pn = bestP.pn;
  }

  const nm = t.match(/\b(\d{1,3})\b/);
  if (nm && !/\b\d{1,2}\s*(d|hr|hrs|hours?|wks?|weeks?)\b/i.test(t)) out.qty = parseInt(nm[1], 10) || 1;
  const rm = t.match(/\bZ-W[A-Z]{2}\b/i); if (rm) out.reg = rm[0].toUpperCase();
  const wm = t.match(/\bWO-\d+\b/i); if (wm) out.wo = wm[0].toUpperCase();
  if (/\b(aog|grounded|ground|emergency)\b/i.test(t)) out.urgency = "AOG";
  else if (/\b(urgent|high|rush|asap)\b/i.test(t)) out.urgency = "HIGH";

  if (out.intent === "req" && /raise.*aog|aog.*req|grounded/i.test(low)) out.urgency = "AOG";
  out.confidence = Math.min(0.98, 0.5 + best * 0.6 + (out.pn ? 0.2 : 0));
  if (!out.pn && /stock|forecast/.test(out.intent)) out.confidence = Math.min(0.85, out.confidence);
  return out;
}

/* ---------------- ASSISTANT VIEW ---------------- */
function viewAssistant() {
  $("viewSub").textContent = "Ask the TSLMS AI anything — natural language becomes live store actions.";
  $("viewActions").innerHTML = `<span class="chip">NLP intent engine</span><span class="chip">Holt forecast</span><span class="chip">actions need approval</span>`;
  $("viewBody").innerHTML = `
    <div class="ai-shell">
      <div class="ai-thread" id="aiThread"></div>
      <div class="ai-quick" id="aiQuick">
        ${(["How much stock of brakes do we have?", "Forecast demand for pumps", "Any AOG right now?", "Order 2 GST-304-88 urgent", "Summary please", "What can you do?"])
          .map((q) => `<button class="btn btn-sm chip-btn" onclick="aiQuick('${esc(q)}')">${q}</button>`).join("")}
      </div>
      <div class="ai-composer">
        <input type="text" id="aiInput" placeholder='Ask… e.g. "order 4 SEAL-74-061 for Z-WRH"'>
        <button class="btn btn-accent" id="aiSend">Ask AI</button>
      </div>
    </div>`;
  $("aiSend").addEventListener("click", () => aiSend());
  $("aiInput").addEventListener("keydown", (e) => { if (e.key === "Enter") aiSend(); });
  aiSay("ai", `Hello <b>${session.name.split(" ")[0]}.</b> I run on a live in-browser AI core — deterministic demand model, Holt's trend forecasting, anomaly detection and an NLP intent engine. Ask about stock, forecasts or AOGs, or have me raise requisitions — I'll prepare the transaction for your approval first.`);
}

let aiPending = {};
const aiChartSeq = { n: 0 };

function aiSay(role, html) {
  const th = $("aiThread");
  if (!th) return null;
  const b = document.createElement("div");
  b.className = "ai-bubble " + role;
  b.innerHTML = html;
  th.appendChild(b);
  th.scrollTop = th.scrollHeight;
  return b;
}

function aiTyping(on) {
  const th = $("aiThread");
  if (!th) return;
  const existing = th.querySelector(".ai-typing");
  if (on && !existing) {
    const b = document.createElement("div");
    b.className = "ai-bubble ai ai-typing";
    b.innerHTML = '<span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>';
    th.appendChild(b);
    th.scrollTop = th.scrollHeight;
  } else if (!on && existing) existing.remove();
}

function aiSend() {
  const inp = $("aiInput");
  const t = (inp && inp.value || "").trim();
  if (!t) return;
  aiSay("you", esc(t));
  inp.value = "";
  aiTyping(true);
  setTimeout(() => {
    aiTyping(false);
    const v = aiAsk(t);
    if (v) aiSay("ai", v);
  }, 550 + Math.random() * 450);
}

function aiQuick(q) {
  aiSay("you", esc(q));
  const v = aiAsk(q);
  if (v) aiSay("ai", v);
}

function aiAsk(text) {
  const q = aiParse(text);
  const head = `<div class="ai-conf">intent <b>${q.intent}</b> · parse confidence ${Math.round(q.confidence * 100)}%</div>`;
  switch (q.intent) {
    case "summary": return head + aiSummary();
    case "aog": return head + aiAogStatus();
    case "stock": return head + aiStock(q);
    case "forecast": return head + aiForecastAnswer(q);
    case "req": return head + aiPropose("req", q);
    case "issue": return head + aiPropose("issue", q);
    default: return head + aiHelp();
  }
}

/* ---------------- ANSWER BUILDERS ---------------- */
function aiHelp() {
  return `<div style="font-weight:700;margin-bottom:6px">Natural-language commands I understand:</div>
    <div style="font-size:13px;line-height:2.1;color:var(--dim)">
      &#9679; "How much stock of <b>brakes</b> do we have?"<br>
      &#9679; "Forecast demand for <b>pumps</b>" &mdash; actual model output<br>
      &#9679; "Any <b>AOG</b> right now?"<br>
      &#9679; "<b>Order 2 GST-304-88</b> urgent" &mdash; I'll draft it for your approval<br>
      &#9679; "<b>Issue 1 BSC-64-73221</b> to Z-WPV"<br>
      &#9679; "Summary please"
    </div>`;
}

function aiSummary() {
  const aogActive = STORE.aog.filter((a) => a.step < 3).length;
  const low = STORE.parts.filter((p) => p.stock < p.min).length;
  const risk = STORE.parts.filter((p) => p.life === "EXPIRING").length;
  const value = STORE.parts.reduce((s, p) => s + p.stock * p.unit, 0);
  const open = STORE.reqs.filter((r) => r.step < 3).length;
  return `<b>Live store posture</b>
    <div class="ai-kpis">
      <div><div class="ai-k">AOG</div><div class="ai-v` + (aogActive ? " warn" : "") + `">${aogActive}</div></div>
      <div><div class="ai-k">Stock value</div><div class="ai-v">$${(value / 1000).toFixed(1)}K</div></div>
      <div><div class="ai-k">Low stock</div><div class="ai-v` + (low ? " warn" : "") + `">${low}</div></div>
      <div><div class="ai-k">Open reqs</div><div class="ai-v">${open}</div></div>
      <div><div class="ai-k">Shelf-life risk</div><div class="ai-v` + (risk ? " warn" : "") + `">${risk}</div></div>
    </div>
    <div style="font-size:12px;color:var(--dim);margin-top:8px">${aogActive ? '<span class="tag danger">' + aogActive + ' aircraft on ground — action needed</span>' : '<span class="tag ok">no AOG in progress</span>'} · ${low} part(s) below reorder · ${open} requisition(s) open.</div>`;
}

function aiAogStatus() {
  const active = STORE.aog.filter((a) => a.step < 3);
  if (!active.length) return `<b>AOG status</b><div class="empty" style="padding:12px"><div class="e-ic">&#10003;</div>No aircraft on ground right now — pipeline is clear.</div>`;
  return `<b>AOG pipeline — ${active.length} aircraft on ground</b>
    ${active.map((a) => `<div class="ai-aog"><div><span class="kb-ref">${a.ref}</span> <span class="tag danger">${a.urgency}</span></div>
      <b>${a.pn}</b> · ${a.reg} · ${a.wo} · ${["Requested", "Picked", "Issued", "Installed"][a.step]} · ${a.t}m elapsed</div>`).join("")}
    <div style="font-size:12px;color:var(--dim);margin-top:6px">Oldest first — route each card in the AOG Desk to advance.</div>`;
}

function aiStock(q) {
  if (!q.pn) {
    const low = STORE.parts.filter((p) => p.stock < p.min);
    return `<b>Store-wide stock</b>
      <div style="font-size:13px;color:var(--dim);margin:6px 0 8px">${STORE.parts.length} stocked parts · ${low.length} below reorder. Try naming a part — e.g. "how much stock of brakes?"</div>
      ${low.map((p) => `<div class="ai-aog"><b>${p.pn}</b> — ${p.name} · ${p.stock}/${p.min} stock<span class="tag danger">REORDER</span></div>`).join("")}`;
  }
  const p = STORE.parts.find((x) => x.pn === q.pn);
  const low = p.stock < p.min;
  return `<b>${p.name}</b> <span class="pn">${p.pn}</span>
    <div class="ai-kpis">
      <div><div class="ai-k">On hand</div><div class="ai-v">${p.stock}</div></div>
      <div><div class="ai-k">Min</div><div class="ai-v">${p.min}</div></div>
      <div><div class="ai-k">ATA</div><div class="ai-v">${p.ata}</div></div>
      <div><div class="ai-k">Bin</div><div class="ai-v">${p.loc}</div></div>
    </div>
    <div style="margin-top:8px">${low ? '<span class="tag danger">BELOW REORDER — consider ordering</span>' : '<span class="tag ok">HEALTHY</span>'} · ${p.cert}</div>
    <div style="margin-top:10px"><button class="btn btn-sm" onclick="route('#inventory')">Open inventory</button></div>`;
}

function aiForecastAnswer(q) {
  if (!q.pn) {
    const ranked = STORE.parts.map((p) => ({ p, r: aiReorder(p.pn) })).filter((x) => x.r.risk !== "HEALTHY").sort((a, b) => b.r.riskScore - a.r.riskScore);
    return `<b>AI forecast — highest stockout risk</b>
      ${ranked.map(({ p, r }) => `<div class="ai-aog"><b>${p.pn}</b> ${p.name}<span class="tag ${r.risk === "HIGH" ? "danger" : "warnb"}">${r.risk}</span><br><small style="color:var(--dim)">${p.stock} on hand · stockout ~${r.daysTo === null ? ">8w" : r.daysTo + "d"} · order ~${r.qty}</small></div>`).join("")}
      <div style="font-size:12px;color:var(--dim);margin-top:6px">Name a part to see its full forecast chart, e.g. "forecast demand for seals".</div>`;
  }
  const p = STORE.parts.find((x) => x.pn === q.pn);
  const f = aiForecast(q.pn);
  const r = aiReorder(q.pn, f);
  const anom = f.flags.map((x, i) => x ? i : null).filter((x) => x !== null);
  const id = "aiChart" + (++aiChartSeq.n);
  setTimeout(() => renderAssistChart(id, f), 40);
  return `<b>${p.name}</b> <span class="pn">${q.pn}</span>
    <div class="ai-kpis">
      <div><div class="ai-k">On hand</div><div class="ai-v">${p.stock}</div></div>
      <div><div class="ai-k">Avg demand/wk</div><div class="ai-v">${r.avgWk.toFixed(1)}</div></div>
      <div><div class="ai-k">Forecast rsme</div><div class="ai-v">${f.rmse.toFixed(1)}</div></div>
      <div><div class="ai-k">Risk</div><div class="ai-v ${r.risk === "HIGH" ? "warn" : r.risk === "MEDIUM" ? "warn" : ""}">${r.risk}</div></div>
    </div>
    <div style="margin-top:8px;font-size:13px;color:var(--dim)">
      Stockout ${r.daysTo === null ? "<b>not predicted</b> in the next 8 weeks" : "predicted in <b style='color:var(--amber)'>≈" + r.daysTo + " days</b>"}.
      ${r.qty ? `Suggested reorder <b>${r.qty} pcs</b> ($${(r.qty * p.unit).toLocaleString()}).` : ""}
      ${anom.length ? `<span class="tag warnb">${anom.length} demand anomaly(s) detected</span>` : "<span class='tag ok'>no demand anomalies</span>"}
    </div>
    <canvas id="${id}" height="70" style="margin-top:8px;max-width:100%"></canvas>
    <div style="margin-top:8px"><button class="btn btn-sm" onclick="route('#forecast')">Full forecast board</button></div>`;
}

function renderAssistChart(id, f) {
  const el = $ ? $(id) : null;
  if (!el || typeof Chart === "undefined") return;
  killChart("assist_" + id);
  const labels = f.history.slice(-8).map((_, i) => "W" + (i - 8 + 1)).concat(["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"]);
  charts["assist_" + id] = new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Demand", data: [...f.history.slice(-8), ...f.forecast], borderColor: "#f5b12d", backgroundColor: "rgba(245,177,45,0.10)", fill: true, tension: 0.35, pointRadius: 2 },
        { label: "Stock projection", data: f.stockProj, borderColor: "#3f9bff", tension: 0.35, pointRadius: 2 },
        { label: "Safety stock", data: f.safetyProj, borderColor: "#f04e4e", borderDash: [6, 5], pointRadius: 0 }
      ]
    },
    options: { plugins: { legend: { labels: { color: "#8496b4", boxWidth: 8, font: { size: 10 } } } }, maintainAspectRatio: false }
  });
}

/* ---------------- ACTION PROPOSALS (approval required) ---------------- */
function aiPropose(type, q) {
  if (!q.pn) {
    return `<b>${type === "issue" ? "Issue" : "Order"} — which part?</b>
      <div style="font-size:13px;color:var(--dim);margin:6px 0">Say e.g. "${type === "issue" ? "issue 1 BSC-64-73221 to Z-WPV" : "order 2 GST-304-88 urgent"}".</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${STORE.parts.slice(0, 6).map((p) => `<button class="btn btn-sm chip-btn" onclick="aiQuick('${type} 2 ${p.pn}')">${p.pn}</button>`).join("")}</div>`;
  }
  const p = STORE.parts.find((x) => x.pn === q.pn);
  const key = "a" + (++aiChartSeq.n);
  const isIssue = type === "issue";
  const aff = isIssue ? "issue" : q.urgency === "AOG" ? "raise an AOG requisition" : "raise a requisition";
  aiPending[key] = { type, pn: q.pn, qty: q.qty, reg: q.reg || "Z-WQA", wo: q.wo || null, urgency: q.urgency, part: p };
  return `<b>Ready to ${aff}</b>
    <div class="ai-propose ai-approve-${key}">
      <div class="ai-prop-grid">
        <div><span class="ai-k">Part</span><b>${p.pn}</b> · ${p.name}</div>
        <div><span class="ai-k">Qty</span><b>${q.qty}</b></div>
        <div><span class="ai-k">Aircraft</span><b>${q.reg || "—"}</b></div>
        <div><span class="ai-k">WO</span><b>${q.wo || "auto"}</b></div>
        <div><span class="ai-k">Priority</span><span class="tag ${q.urgency === "AOG" ? "danger" : q.urgency === "HIGH" ? "warnb" : "neutral"}">${q.urgency}</span></div>
      </div>
      ${isIssue && p.stock < q.qty ? '<div class="error">Insufficient stock: only ' + p.stock + ' on hand.</div>' : ""}
      <div class="ai-actions">
        <button class="btn btn-sm btn-accent" onclick="aiApprove('${key}')">&#10003; Approve</button>
        <button class="btn btn-sm" onclick="aiCancel('${key}')">&#10005; Cancel</button>
      </div>
    </div>
    <div style="font-size:12px;color:var(--dim);margin-top:8px">Transactions are staged for your review — nothing mutates the store until you approve.</div>`;
}

function aiApprove(key) {
  const act = aiPending[key];
  if (!act) { toast("warn", "No pending action", "That proposal is gone."); return; }
  delete aiPending[key];
  const card = document.querySelector(".ai-approve-" + key);
  if (card) card.remove();
  try {
    const msg = execAiAction(act);
    aiSay("ai", '<span class="tag ok">EXECUTED</span> ' + msg);
    toast("ok", "AI action executed", msg);
  } catch (err) {
    aiSay("ai", '<span class="tag danger">FAILED</span> ' + esc(err.message));
    toast("danger", "AI action failed", err.message);
  }
}

function aiCancel(key) {
  if (!aiPending[key]) return;
  delete aiPending[key];
  const card = document.querySelector(".ai-approve-" + key);
  if (card) card.remove();
  aiSay("ai", '<span style="color:var(--dim)">Cancelled — no changes made.</span>');
}

function execAiAction(act) {
  if (act.type === "issue") {
    const p = act.part;
    if (!p || p.stock < act.qty) throw new Error("Insufficient stock on hand.");
    p.stock -= act.qty;
    pushEvent("ok", "AI issue: " + p.pn + " × " + act.qty, "Released to " + act.reg, "ok");
    return `<b>${p.pn}</b> × <b>${act.qty}</b> issued to ${act.reg}. Stock on hand now ${p.stock}${p.stock < p.min ? ' — <span class="tag danger">BELOW REORDER</span>' : ""}.`;
  }
  if (act.urgency === "AOG") {
    const a = { ref: "AOG-" + String(88214 + STORE.aog.length + 1), pn: act.pn, reg: act.reg, wo: act.wo || "WO-" + String(24520 + STORE.reqs.length), urgency: "AOG", step: 0, t: 0 };
    STORE.aog.unshift(a);
    pushEvent("danger", "AI raised " + a.ref, act.pn + " — urgent store action", "danger");
    return `<b>${a.ref}</b> raised for ${act.pn} on ${a.reg} — aircraft grounded. Track it in the AOG Desk.`;
  }
  const r = addReq(act.pn, act.qty, act.wo || "WO-" + String(24520 + STORE.reqs.length), act.reg, act.urgency);
  return `<b>${r.ref}</b> created — ${act.urgency} ${act.urgency === "AOG" ? "AOG " : ""}requisition for ${act.qty} × ${act.pn} on ${act.reg}.`;
}

/* debug / console handle */
if (typeof window !== "undefined") window.TSLMS = Object.assign(window.TSLMS || {}, {
  AI: { aiForecast, aiReorder, aiParse, demandHistory, holt, anomalies, mulberry32, hashStr }
});