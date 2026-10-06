/* Aircraft engineering workspace. All aircraft, limits and dates are demo data. */
"use strict";
const ATA_CHAPTERS = {"21":"Air conditioning","24":"Electrical power","25":"Equipment & furnishings","26":"Fire protection","27":"Flight controls","28":"Fuel","29":"Hydraulic power","30":"Ice & rain protection","31":"Indicating / recording","32":"Landing gear","33":"Lights","34":"Navigation","35":"Oxygen","36":"Pneumatic","49":"Auxiliary power unit","51":"Standard practices / structures","57":"Wings","72":"Engine","73":"Engine fuel & control","74":"Ignition","76":"Engine controls","77":"Engine indicating","78":"Exhaust","79":"Oil","80":"Starting"};
STORE.fleet = [
  {reg:"Z-WPV",type:"Boeing 737",station:"HRE · Hangar 1",hours:28420,cycles:19720,next:"A-check",due:120},
  {reg:"Z-WQA",type:"Boeing 767",station:"HRE · Apron",hours:42180,cycles:15840,next:"A-check",due:260},
  {reg:"Z-WRH",type:"Embraer ERJ",station:"HRE · Line",hours:18640,cycles:12380,next:"Weekly inspection",due:48}
];
const demoDate = new Date().toISOString().slice(0,10);
function relativeDate(days) { const d = new Date(demoDate+"T00:00:00Z"); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); }
STORE.components = [
  {sn:"BRK-88213",pn:"BSC-64-73221",reg:"Z-WPV",position:"LH main gear",hours:4870,cycles:2980,hLimit:5000,cLimit:3000,due:relativeDate(90)},
  {sn:"IDG-77481",pn:"GEN-24-410",reg:"Z-WQA",position:"Engine 1",hours:7620,cycles:3100,hLimit:8000,cLimit:5000,due:relativeDate(180)},
  {sn:"HYP-24510",pn:"HYP-100-2",reg:"Z-WRH",position:"System A",hours:3240,cycles:2320,hLimit:6000,cLimit:4000,due:relativeDate(365)},
  {sn:"APU-66077",pn:"APU-49-300",reg:"Z-WQA",position:"APU",hours:4500,cycles:2810,hLimit:5000,cLimit:3000,due:relativeDate(22)},
  {sn:"WHB-99104",pn:"WHB-32-881",reg:"Stores",position:"Quarantine · R2-B4",hours:1800,cycles:1400,hLimit:4000,cLimit:3000,due:relativeDate(-2)}
];
function componentState(c) {
  const hours=c.hLimit-c.hours, cycles=c.cLimit-c.cycles;
  const days=Math.ceil((Date.parse(c.due+"T00:00:00Z")-Date.parse(demoDate+"T00:00:00Z"))/86400000);
  return {hours,cycles,days,status:hours<=0||cycles<=0||days<=0?"OVERDUE":hours<=200||cycles<=100||days<=30?"DUE SOON":"WITHIN LIMITS"};
}
function engTag(label,tone="info") { return `<span class="tag ${tone}">${esc(label)}</span>`; }
function aircraftState(a) {
  if (STORE.aog.some(x=>x.reg===a.reg&&x.step<3)) return "AOG";
  if (STORE.components.some(c=>c.reg===a.reg&&componentState(c).status==="OVERDUE")) return "LIMIT EXCEEDED";
  return "NO ACTIVE HOLD";
}
function engMetric(label,value,sub,tone="") { return `<div class="kpi ${tone}"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-sub">${sub}</div></div>`; }
function engPanel(title,body,action="") { return `<section class="panel"><div class="panel-head"><div class="panel-title">${title}</div>${action}</div><div class="panel-body">${body}</div></section>`; }
function engTable(head,rows) { return `<div class="table-wrap"><table class="tbl"><thead><tr>${head.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${head.length}" class="empty">No matching records.</td></tr>`}</tbody></table></div>`; }
function fleetCards() { return STORE.fleet.map(a=>{
  const state=aircraftState(a), holds=STORE.aog.filter(x=>x.reg===a.reg&&x.step<3).length;
  return `<article class="aircraft-card"><div class="aircraft-top"><span class="aircraft-symbol">✈</span>${engTag(state,state==="NO ACTIVE HOLD"?"ok":"danger")}</div><h3>${a.reg}</h3><p>${a.type} · ${a.station}</p><div class="aircraft-data"><div><small>Flight hours</small><b>${a.hours.toLocaleString()}</b></div><div><small>Flight cycles</small><b>${a.cycles.toLocaleString()}</b></div></div><div class="aircraft-bottom"><span>${a.next} in <b>${a.due} FH</b></span><button class="btn btn-sm" onclick="openAircraft('${a.reg}')">Details →</button></div><small>${holds} active AOG · ${STORE.components.filter(c=>c.reg===a.reg).length} tracked components</small></article>`;
}).join(""); }
function viewEngineeringDashboard() {
  $("viewSub").textContent="Aircraft Engineering Department / Technical operations";
  $("viewActions").innerHTML=`<button class="btn" onclick="route('#fleet')">View fleet</button><button class="btn btn-accent" onclick="openAogModal()">+ Raise AOG</button>`;
  const holds=STORE.fleet.filter(a=>aircraftState(a)!=="NO ACTIVE HOLD").length;
  const due=STORE.components.filter(c=>componentState(c).status!=="WITHIN LIMITS");
  const shortages=STORE.parts.filter(p=>p.stock<p.min);
  $("viewBody").innerHTML=`<div class="engineering-banner"><div><div class="eyebrow">ENGINEERING CONTROL</div><h2>Every aircraft. Every component.<br>One technical picture.</h2><p>Track fleet holds, component limits and the parts needed by your maintenance teams.</p><div class="row"><button class="btn btn-accent" onclick="route('#components')">Component life tracking →</button><button class="btn" onclick="route('#logistics')">Logistics intelligence</button></div></div><div class="banner-emblem"><span>✈</span><small>TSLMS / ENGINEERING</small><b>${STORE.fleet.length} aircraft monitored</b><small>Demonstration workspace</small></div></div>
  <div class="kpi-grid engineering-kpis">${engMetric("Fleet monitored",STORE.fleet.length,"aircraft technical records")}${engMetric("Aircraft with holds",holds,"active AOG or exceeded limits","warn")}${engMetric("Component alerts",due.length,"hours · cycles · calendar","warn")}${engMetric("Parts below minimum",shortages.length,"technical stores catalogue")}</div>
  <div class="section-label"><h3>Fleet at a glance</h3><span>Live from this demo's records</span></div><div class="fleet-grid">${fleetCards()}</div>
  <div class="grid engineering-grid">${engPanel("Component attention",due.map(c=>{const s=componentState(c);return `<button class="attention-row" onclick="route('#components')"><div><b>${esc(c.pn)}</b><small>${c.sn} · ${c.reg}</small></div>${engTag(s.status,s.status==="OVERDUE"?"danger":"warnb")}</button>`;}).join(""))}${engPanel("Technical stores priorities",shortages.slice(0,4).map(p=>`<button class="attention-row" onclick="showAta('${p.ata}')"><div><b>${p.name}</b><small>${p.pn} · ATA ${p.ata}</small></div><span class="shortage">${p.stock} / ${p.min}<small>stock / minimum</small></span></button>`).join(""),`<button class="btn btn-sm" onclick="route('#inventory')">Open stores</button>`)}</div>
  ${engPanel("Engineering activity",`<div id="activityFeed">${activityFeedHTML()}</div>`)}`;
}
function viewFleet() {
  $("viewSub").textContent="Aircraft utilisation, maintenance planning and technical holds. All aircraft records are simulated.";
  $("viewActions").innerHTML=`<button class="btn btn-accent" onclick="openUtilisation()">+ Record utilisation</button>`;
  $("viewBody").innerHTML=`<div class="fleet-grid">${fleetCards()}</div>${engPanel("Maintenance planning",engTable(["Aircraft","Station","Next task","Remaining FH","Component alerts","Technical hold"],STORE.fleet.map(a=>`<tr><td class="pn">${a.reg}</td><td>${a.station}</td><td>${a.next}</td><td>${a.due}</td><td>${STORE.components.filter(c=>c.reg===a.reg&&componentState(c).status!=="WITHIN LIMITS").length}</td><td>${engTag(aircraftState(a),aircraftState(a)==="NO ACTIVE HOLD"?"ok":"danger")}</td></tr>`).join("")))}`;
}
function engineeringModal(title,body) { $("modalRoot").innerHTML=`<div class="modal-backdrop" onclick="closeModal(event)"><div class="modal" onclick="event.stopPropagation()"><div class="modal-head"><div class="modal-title">${title}</div><button class="modal-x" aria-label="Close" onclick="closeModal()">×</button></div><div class="modal-body">${body}</div></div></div>`; }
function openAircraft(reg) {
  const a=STORE.fleet.find(x=>x.reg===reg); if(!a)return;
  const cs=STORE.components.filter(c=>c.reg===reg);
  engineeringModal(`${a.reg} / Technical record`,`<p>${a.type} · ${a.station}</p><div class="dl"><div><div class="k">Flight hours</div><div class="v">${a.hours}</div></div><div><div class="k">Flight cycles</div><div class="v">${a.cycles}</div></div></div><h3>Installed components</h3>${cs.map(c=>`<div class="attention-row"><div><b>${c.pn}</b><small>${c.sn} · ${c.position}</small></div>${engTag(componentState(c).status)}</div>`).join("")}<button class="btn-primary" onclick="closeModal();route('#components')">Open component ledger</button>`);
}
function openUtilisation() {
  engineeringModal("Record aircraft utilisation",`<form onsubmit="event.preventDefault();saveUtilisation()"><label for="utilReg">Aircraft</label><select id="utilReg">${STORE.fleet.map(a=>`<option>${a.reg}</option>`).join("")}</select><label for="utilHours">Additional flight hours</label><input id="utilHours" type="number" min="0" step="0.1" required value="2.5"><label for="utilCycles">Additional flight cycles</label><input id="utilCycles" type="number" min="0" step="1" required value="1"><p class="form-note">Updates the aircraft and all tracked installed components. Demonstration values are held in memory.</p><button class="btn-primary" type="submit">Save utilisation</button></form>`);
}
function saveUtilisation() {
  const a=STORE.fleet.find(x=>x.reg===$("utilReg").value), h=Number($("utilHours").value), c=Number($("utilCycles").value);
  if(!a||!Number.isFinite(h)||!Number.isFinite(c)||h<0||c<0||!Number.isInteger(c)) {toast("warn","Invalid utilisation","Use non-negative hours and whole cycles.");return;}
  a.hours=Math.round((a.hours+h)*10)/10;a.cycles+=c;a.due=Math.max(0,Math.round((a.due-h)*10)/10);
  STORE.components.filter(x=>x.reg===a.reg).forEach(x=>{x.hours=Math.round((x.hours+h)*10)/10;x.cycles+=c;});
  pushEvent("info","Utilisation recorded",`${a.reg}: +${h} FH / +${c} FC`,"info");closeModal();route("#fleet");toast("ok","Utilisation saved","Aircraft and installed component counters updated.");
}
let componentFilter="all", componentQuery="";
function viewComponents() {
  $("viewSub").textContent="Serial-level usage against flight-hour, cycle and calendar limits. Limits are illustrative demo values.";
  $("viewActions").innerHTML=`<button class="btn" onclick="exportComponents()">Export ledger</button><button class="btn btn-accent" onclick="openUtilisation()">+ Record utilisation</button>`;
  const due=STORE.components.filter(c=>componentState(c).status==="DUE SOON").length, over=STORE.components.filter(c=>componentState(c).status==="OVERDUE").length;
  $("viewBody").innerHTML=`<div class="kpi-grid">${engMetric("Tracked serials",STORE.components.length,"installed + stores")}${engMetric("Due soon",due,"≤200 FH / ≤100 FC / ≤30 days","warn")}${engMetric("Limit exceeded",over,"any remaining limit ≤0","warn")}</div><div class="engineering-toolbar"><input id="componentSearch" placeholder="Search serial, part or aircraft" aria-label="Search components" value="${esc(componentQuery)}" oninput="componentQuery=this.value;renderComponentRows()"><select aria-label="Component status" onchange="componentFilter=this.value;renderComponentRows()"><option value="all" ${componentFilter==="all"?"selected":""}>All statuses</option><option value="alert" ${componentFilter==="alert"?"selected":""}>Needs attention</option><option value="overdue" ${componentFilter==="overdue"?"selected":""}>Limit exceeded</option></select></div><section class="panel">${engTable(["Component / Serial","Aircraft / Position","ATA","Hours remaining","Cycles remaining","Calendar due","Status"],"")}</section><p class="form-note">The first exhausted limit controls the alert. Store shelf life and installed component life are tracked separately. These records do not constitute an aircraft release.</p>`;
  renderComponentRows();
}
function renderComponentRows() {
  const q=componentQuery.toLowerCase();
  $("viewBody").querySelector("tbody").innerHTML=STORE.components.filter(c=>{
    const s=componentState(c);return (!q||`${c.pn} ${c.sn} ${c.reg}`.toLowerCase().includes(q))&&(componentFilter==="all"||componentFilter==="alert"&&s.status!=="WITHIN LIMITS"||componentFilter==="overdue"&&s.status==="OVERDUE");
  }).map(c=>{const s=componentState(c),p=STORE.parts.find(x=>x.pn===c.pn);return `<tr><td><b>${c.pn}</b><small class="table-sub">${c.sn}</small></td><td>${c.reg}<small class="table-sub">${c.position}</small></td><td>${p?p.ata:"—"}</td><td class="num">${s.hours.toLocaleString()} FH<small class="table-sub">${c.hours} / ${c.hLimit}</small></td><td class="num">${s.cycles} FC<small class="table-sub">${c.cycles} / ${c.cLimit}</small></td><td>${c.due}<small class="table-sub">${s.days} days remaining</small></td><td>${engTag(s.status,s.status==="OVERDUE"?"danger":s.status==="DUE SOON"?"warnb":"ok")}</td></tr>`;}).join("")||`<tr><td colspan="7" class="empty">No matching components.</td></tr>`;
}
function exportComponents() {
  const rows=[["Part","Serial","Aircraft","Hours used","Hour limit","Cycles used","Cycle limit","Calendar due","Status"],...STORE.components.map(c=>[c.pn,c.sn,c.reg,c.hours,c.hLimit,c.cycles,c.cLimit,c.due,componentState(c).status])];
  const url=URL.createObjectURL(new Blob([rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n")],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="tslms-component-life.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
let selectedAta="";
function showAta(ata) {selectedAta=ata;route("#ata");}
function viewAta() {
  $("viewSub").textContent="Browse aircraft systems and link each chapter to parts, requisitions and component alerts.";
  $("viewActions").innerHTML=`<button class="btn" onclick="selectedAta='';viewAta()">All chapters</button>`;
  const chapters=Object.keys(ATA_CHAPTERS);
  $("viewBody").innerHTML=`<div class="ata-layout"><div class="ata-chapters">${chapters.map(ata=>`<button class="ata-chapter ${selectedAta===ata?"selected":""}" onclick="selectedAta='${ata}';viewAta()"><span>${ata}</span><div><b>${ATA_CHAPTERS[ata]}</b><small>${STORE.parts.filter(p=>p.ata===ata).length} catalogue parts</small></div></button>`).join("")}</div><div>${engPanel(selectedAta?`ATA ${selectedAta} / ${ATA_CHAPTERS[selectedAta]}`:"All aircraft systems",engTable(["Part","Description","ATA","Stock / Min","Component alerts","Open requests"],STORE.parts.filter(p=>!selectedAta||p.ata===selectedAta).map(p=>`<tr><td class="pn">${p.pn}</td><td>${p.name}</td><td>${p.ata}</td><td>${engTag(`${p.stock} / ${p.min}`,p.stock<p.min?"danger":"ok")}</td><td>${STORE.components.filter(c=>c.pn===p.pn&&componentState(c).status!=="WITHIN LIMITS").length}</td><td>${STORE.reqs.filter(r=>r.pn===p.pn&&r.step<3).length}</td></tr>`).join("")))}</div></div>`;
}
function viewLogistics() {
  $("viewSub").textContent="Demand-based supply priorities linked to technical stores and active AOG requests. Forecasts use simulated demand history.";
  $("viewActions").innerHTML=`<button class="btn" onclick="route('#forecast')">Demand forecast</button><button class="btn btn-accent" onclick="openReqModal()">+ Requisition</button>`;
  const risks=STORE.parts.map(p=>({p,r:aiReorder(p.pn)})).sort((a,b)=>b.r.riskScore-a.r.riskScore||a.p.stock-b.p.stock);
  $("viewBody").innerHTML=`<div class="kpi-grid">${engMetric("High supply risk",risks.filter(x=>x.r.risk==="HIGH").length,"computed from stock & forecast","warn")}${engMetric("Active AOG demands",STORE.aog.filter(a=>a.step<3).length,"requested → installed")}${engMetric("Open requisitions",STORE.reqs.filter(r=>r.step<3).length,"maintenance parts pipeline")}</div>${engPanel("Supply priority queue",engTable(["Part / ATA","On hand / Min","Demand per week","Stockout estimate","Suggested quantity","Aircraft demand","Action"],risks.map(({p,r})=>`<tr><td><b>${p.pn}</b><small class="table-sub">ATA ${p.ata} · ${p.name}</small></td><td>${engTag(`${p.stock} / ${p.min}`,r.risk==="HIGH"?"danger":"info")}</td><td>${r.avgWk.toFixed(1)}</td><td>${r.daysTo===null?">56 days":r.daysTo+" days"}</td><td>${r.qty}</td><td>${STORE.aog.filter(a=>a.pn===p.pn&&a.step<3).map(a=>esc(a.reg)).join(", ")||"—"}</td><td><button class="btn btn-sm" onclick="draftSupply('${p.pn}')">Draft request</button></td></tr>`).join("")))}`;
}
function draftSupply(pn) { openReqModal();$("reqPn").value=pn; const qty=$("reqQty");if(qty)qty.value=Math.max(1,aiReorder(pn).qty); }
