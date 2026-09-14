/* ============================================================
   actions.js — store operations: issue, AOG, register, transfer, reqs
   ============================================================ */
"use strict";

/* ---------- Smart actions ---------- */
function actIssue(pn) {
  const p = STORE.parts.find((x) => x.pn === pn);
  closeModal();
  toast("ok", "Part issued", `${pn} released to the line.`);
  pushEvent("ok", `Issued: ${pn}`, p ? p.name : "", "ok");
  route("#requisitions");
}

function actAog(pnVal) {
  const pn = (STORE.parts.find((x) => x.pn === pnVal) || {}).pn || pnVal;
  closeModal();
  const a = { ref: `AOG-${String(88214 + STORE.aog.length + 1)}`, pn, reg: "Z-WPV", wo: "WO-24522", urgency: "AOG", step: 0, t: 0 };
  STORE.aog.unshift(a);
  pushEvent("danger", a.ref + " raised", `${pn} — urgent store action`, "danger");
  toast("danger", "AOG raised", a.ref + " — store staff notified.");
  route("#aog");
}

function actRegister(pnVal) {
  if (STORE.parts.some((p) => p.pn === pnVal)) { toast("warn", "Already exists", pnVal + " is already registered."); return; }
  STORE.parts.push({ pn: pnVal, name: "Newly registered part", ata: "00", stock: 0, min: 1, loc: "R3-B8", cert: "Cert pending", life: "OK", unit: 0, mfrKey: mfrKeyForPart({ pn: pnVal, ata: "00" }) });
  toast("ok", "Part registered", pnVal + " added to inventory (0 stock, awaiting receipt).");
  pushEvent("info", "Registered", pnVal + " added to inventory", "info");
  closeModal();
  route("#inventory");
}
function doTransfer() {
  const pn = $("trPn").value;
  const qty = parseInt($("trQty").value, 10) || 1;
  const dest = $("trDest").value || "Z-WPV";
  const p = STORE.parts.find((x) => x.pn === pn);
  if (!p || qty > p.stock) { toast("danger", "Transfer failed", "Quantity exceeds available stock."); return; }
  p.stock -= qty;
  closeModal();
  toast("ok", "Transfer completed", `${qty} × ${pn} issued to ${dest}. Inventory updated in real time.`);
  pushEvent("ok", `Stock out: ${pn} × ${qty}`, `Issued to ${dest} — ${p.name}`, "ok");
  route(location.hash);
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
