/* ============================================================
   scanner.js — camera scanner, Super Scan AI, OCR, manual lookup
   ============================================================ */
"use strict";

/* ============ INTELLIGENT SCANNER ============ */
/* Modes: 1) Smart Auto (barcode/QR via camera)  2) AI OCR (reads printed labels via Tesseract)
           3) Fuzzy part matching with confidence   4) Manual entry fallback            */

let scanner = null;
let aiMode = "auto";

function openScanner() {
  stopScanner();
  $("modalRoot").innerHTML = `
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal modal-scanner modal-xl" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div><div class="modal-title">Intelligent Scanner</div><div class="scan-subtitle">any code · GS1-128 · EAN/UPC · QR · fuzzy part matching</div></div>
          <button class="modal-x" onclick="closeModal(event)">&#10005;</button>
        </div>
        <div class="modal-body">
          <div class="scanner-tabs">
            <button class="btn btn-sm" id="tabAuto">&#10052; Smart Auto</button>
            <button class="btn btn-sm" id="tabOcr">&#128451; AI OCR</button>
            <button class="btn btn-sm" id="tabSuper">&#129302; Super Scan AI</button>
            <button class="btn btn-sm" id="tabMan">&#128221; Manual</button>
          </div>
          <div id="scannerPane">
            <div id="qrRegion" class="qr-region"><div class="empty" style="padding:70px 20px"><div class="e-ic">&#10052;</div>Starting camera…</div></div>
            <div class="scanner-help">Point at a part label.</div>
          </div>
          <div id="scanManual" class="hidden">
            <label>Enter part number / QR payload or paste OCR text</label>
            <input type="text" id="scanInput" placeholder="e.g. BSC-64-73221">
            <button class="btn-primary" onclick="manualScan()">Smart Lookup</button>
          </div>
          <div id="scanResult"></div>
        </div>
      </div>
    </div>`;
  $("tabAuto").addEventListener("click", () => setScanMode("auto"));
  $("tabOcr").addEventListener("click", () => setScanMode("ocr"));
  $("tabSuper").addEventListener("click", () => setScanMode("super"));
  $("tabMan").addEventListener("click", () => setScanMode("man"));
  setScanMode("auto");
}

function setScanMode(mode) {
  aiMode = mode;
  stopScanner();
  document.querySelectorAll(".scanner-tabs .btn").forEach((b) => b.classList.remove("btn-accent"));
  if (mode === "auto") {
    $("tabAuto").classList.add("btn-accent");
    $("scannerPane").classList.remove("hidden");
    $("scanManual").classList.add("hidden");
    $("scannerPane").innerHTML = `<div id="qrRegion" class="qr-region"><div class="empty" style="padding:70px 20px"><div class="e-ic">&#10052;</div>Starting camera…</div></div>
      <div class="scanner-help">Auto-decodes any barcode or QR in view. Works over <b>HTTPS</b> (GitHub Pages).</div>`;
    bootCamera();
  } else if (mode === "ocr") {
    $("tabOcr").classList.add("btn-accent");
    $("scannerPane").classList.remove("hidden");
    $("scanManual").classList.add("hidden");
    const hasOcr = typeof Tesseract !== "undefined";
    $("scannerPane").innerHTML = `<div id="qrRegion" class="qr-region">${hasOcr
        ? `<div class="empty" style="padding:70px 20px"><div class="e-ic">&#128451;</div>Starting camera…</div>`
        : `<div class="empty"><div class="e-ic">&#9888;</div>OCR engine not loaded.<br>Use Smart Auto or Manual.</div>`}</div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn btn-accent" id="snapBtn" ${hasOcr ? "" : "disabled"}>&#128451; Snapshot & Read</button>
        <span class="ocr-status" id="ocrStatus">Camera needed for snapshots</span>
      </div>
      <div class="scanner-help">AI OCR reads part numbers, serials and QR text directly off the printed label &mdash; no barcode required.</div>`;
    if (hasOcr) {
      $("snapBtn").addEventListener("click", snapshotOcr);
      bootCamera();
    }
  } else if (mode === "super") {
    $("tabSuper").classList.add("btn-accent");
    $("scannerPane").classList.remove("hidden");
    $("scanManual").classList.add("hidden");
    const hasOcr = typeof Tesseract !== "undefined";
    $("scanResult").innerHTML = "";
    superStateReset();
    $("scannerPane").innerHTML = `<div id="qrRegion" class="qr-region"><div class="empty" style="padding:70px 20px"><div class="e-ic">&#129302;</div>Starting camera + AI vision…</div></div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
        <span class="ocr-status pulse" id="superStatus">${hasOcr ? "AI listening — decoder + OCR fusion active…" : "OCR engine missing — barcode-decoder only"}</span>
      </div>
      <div class="scanner-help">Super Scan AI runs the barcode decoder <b>and</b> grabs OCR snapshots from the same camera feed until a confident match &mdash; then shows both channels as evidence. ${hasOcr ? "" : " (load OCR via the AI OCR tab first)"}</div>`;
    bootCamera();
    if (hasOcr) {
      clearInterval(superTimer);
      superTimer = setInterval(superOcrLoop, 4500);
      setTimeout(superOcrLoop, 1500);
    }
  } else {
    $("tabMan").classList.add("btn-accent");
    $("scannerPane").classList.add("hidden");
    $("scanManual").classList.remove("hidden");
    $("scanResult").innerHTML = "";
    setTimeout(() => $("scanInput") && $("scanInput").focus(), 60);
  }
}

let primedStream = null;

/* getUserMedia on iOS Safari must be invoked inside the user's tap — if the
   library defers it, capture is refused ("transient activation"). So we call
   getUserMedia synchronously from the tap here and hand the already-granted
   stream to html5-qrcode, which then never re-prompts or loses the gesture. */
function getUserMediaPatch(stream) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = (constraints) => (stream && stream.active) ? Promise.resolve(stream) : real(constraints);
}

function bootCamera() {
  stopScanner();
  if (typeof Html5Qrcode === "undefined") { showCamError({ message: "Scanner library did not load — hard-refresh the page." }); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { showCamError({}); return; }
  let req;
  try { req = navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); }
  catch (e) { showCamError(e); return; }
  req.then((stream) => {
    if (primedStream) { try { primedStream.getTracks().forEach((t) => t.stop()); } catch (e) {} }
    primedStream = stream;
    getUserMediaPatch(stream);
    startScanner();
  }).catch((err) => showCamError(err));
}

function startScanner(cb) {
  if (scanner || typeof Html5Qrcode === "undefined") return;
  const region = $("qrRegion");
  if (!region) return;
  const Fmts = (typeof Html5QrcodeSupportedFormats !== "undefined") ? Html5QrcodeSupportedFormats : null;
  const fmtList = Fmts ? [Fmts["QR_CODE"], Fmts["DATA_MATRIX"], Fmts["AZTEC"], Fmts["PDF_417"], Fmts["MAXICODE"], Fmts["CODE_128"], Fmts["CODE_39"], Fmts["CODE_93"], Fmts["CODABAR"], Fmts["ITF"], Fmts["UPC_A"], Fmts["UPC_E"], Fmts["EAN_8"], Fmts["EAN_13"]].filter((x) => x !== undefined) : [];
  try {
    scanner = new Html5Qrcode("qrRegion");
    scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: aiMode === "ocr" ? { width: 300, height: 220 } : { width: 240, height: 200 },
        formatsToSupport: fmtList.length ? fmtList : undefined
      },
      (decoded, decodedResult) => {
        if (aiMode === "auto" || aiMode === "super") handleScanCode(decoded, decodedResult);
      },
      () => {}
    ).catch((err) => {
      scanner = null;
      showCamError(err);
    });
  } catch (err) {
    scanner = null;
    showCamError(err);
  }
}

/* Camera-start diagnostics: real reason + retry/manual fallback */
function camFriendly(err) {
  const n = (err && (err.name || (err.error && err.error.name))) || "";
  const ua = (navigator.userAgent || "");
  const inapp = /Instagram|FBAN|FBAV|WhatsApp|Line|Messenger|Snapchat/i.test(ua);
  if (inapp) return "This looks like an <b>in-app browser</b> (e.g. WhatsApp, Facebook or Instagram). These apps block camera websites. Open the site in your phone's normal browser — Safari or Chrome — instead, then tap Scan.";
  if (n.indexOf("NotAllowed") === 0 || n === "PermissionDeniedError") return "Camera permission is <b>blocked</b>. Tap the &#128274; lock/camera icon next to the address bar &rarr; <b>Camera: Allow</b> (iPhone: Settings &rarr; Safari &rarr; Camera &rarr; Allow; Android: site settings). Then retry.";
  if (n === "NotFoundError" || n === "DevicesNotFoundError") return "No camera was found on this device. Use <b>Manual entry</b> instead — it works offline too.";
  if (n === "NotReadableError" || n === "AbortError" || n === "TrackStartError") return "The camera is in use by another app or already running. Close other camera apps and retry.";
  if (n === "OverconstrainedError") return "No rear camera matched the request. Try Manual entry, or retry once more.";
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return "This browser doesn't expose a camera API. Use <b>Manual entry</b>, or try Safari/Chrome on a phone for the camera.";
  return "Camera could not start" + (err && err.message ? " — <b>[" + err.message + "]</b>" : "") + ". Check permissions and retry, or use Manual entry.";
}

function showCamError(err) {
  const pane = $("scannerPane");
  if (pane) pane.innerHTML = `<div class="empty"><div class="e-ic">&#9888;</div><div style="max-width:330px;font-size:13px;line-height:1.6">${camFriendly(err)}</div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;justify-content:center">
      <button class="btn btn-sm btn-accent" onclick="bootCamera()">&#128247; Retry camera</button>
      <button class="btn btn-sm" onclick="setScanMode('man')">&#128221; Manual entry</button>
    </div></div>`;
  toast("warn", "Scanner", "Camera could not start — see message in scanner.");
}

function stopScanner() {
  clearInterval(superTimer); superTimer = null;
  if (scanner) {
    try { scanner.stop().then(() => scanner.clear()).catch(() => {}); } catch (e) {}
    scanner = null;
  }
}

function showScanMsg(msg, tone) {
  const pane = $("scannerPane");
  if (pane) pane.innerHTML = `<div class="empty"><div class="e-ic">&#9888;</div>${msg}</div>`;
  if (tone) toast("warn", "Scanner", msg);
}
/* ---------- Barcode / QR handling ---------- */
let superTimer = null;
let superOcrBusy = false;
let superBest = null;
let superBarcodePick = null;
let superOcrPick = null;
function superStateReset() {
  clearInterval(superTimer); superTimer = null;
  superBest = superBarcodePick = superOcrPick = null; superOcrBusy = false;
}
function handleScanCode(decoded, decodedResult) {
  if (aiMode === "super") { superAccum("barcode", decoded, decodedResult); return; }
  if (!scanner) return;
  stopScanner();
  const f = decodedResult && decodedResult.result && decodedResult.result.format && (decodedResult.result.format.format || decodedResult.result.format.toString());
  const meta = { src: "barcode-qr", format: f };
  const a = analyzeCode(decoded, meta);
  $("scanResult").innerHTML = `<div class="scan-kicker"><span class="tag info">SMART AUTO</span> decoded <span class="pn">${esc(decoded)}</span></div>` + renderAnalysis(a, meta);
  if (a.status === "exact") toast("ok", "Scan matched", decoded + " → " + a.part.pn);
  else if (a.status === "none") toast("warn", "No exact match", "Showing closest parts & actions.");
}

/* ----- Super Scan AI: decoder + OCR fusion ----- */
function superAccum(src, decoded, decodedResult) {
  const f = decodedResult && decodedResult.result && decodedResult.result.format && (decodedResult.result.format.format || decodedResult.result.format.toString());
  const a = analyzeCode(decoded, { src, format: src === "barcode" ? (f || undefined) : "OCR" });
  const conf = a.status === "exact" ? 100 : a.status === "company" ? a.confidence : (a.part ? a.confidence : 0);
  const pick = { a, src, raw: decoded, f, conf };
  if (src === "barcode") superBarcodePick = pick;
  if (src === "ocr") superOcrPick = pick;
  if (!superBest || conf > superBest.conf) superBest = pick;
  const st = $("superStatus");
  if (st) {
    if (a.part) st.innerHTML = `<span class="tag ${a.status === "exact" ? "ok" : "warnb"}">${a.status === "exact" ? "MATCH" : "CANDIDATE " + conf + "%"}</span> ${esc(a.part.pn)} — ${esc(a.part.name)} <span style="opacity:.6">via ${src === "barcode" ? "decoder" : "OCR"}</span>`;
    else if (a.codeInfo) st.innerHTML = `<span class="tag violet">CODE READ</span> ${esc(String(decoded).slice(0, 30))}`;
    else st.innerHTML = `<span class="tag neutral">SCANNING</span> reading … ${esc(String(decoded).slice(0, 24))}`;
  }
  /* finalize: confident match, or any fully-decoded code report */
  const hasRealInfo = a.codeInfo && a.codeInfo.kind !== "Barcode / QR text";
  if (a.status === "exact" || a.status === "company" || hasRealInfo || conf >= 82) return superFinalize(a, src, decoded, f);
  const r = $("scanResult");
  if (r && superBest) r.innerHTML = superPreview(superBest);
  return null;
}
function superPreview(pick) {
  return `<div class="scan-kicker"><span class="tag violet">SUPER SCAN AI</span> <span style="font-size:12px;color:var(--dim)">${pick.src === "barcode" ? "decoder" : "OCR"} · ${pick.a.status === "exact" ? "exact" : pick.conf + "%"} · best so far — camera listening</span></div>` +
    (pick.a.part ? renderAnalysis(pick.a) : `<div class="empty" style="padding:14px">No confident match yet… <b>${esc(pick.raw.slice(0, 32))}</b></div>`);
}
function superEvidence() {
  const row = (label, p, cls) => p ? `<div class="scan-ev"><span class="tag ${cls}">${label}</span> <span class="pn">${esc(p.raw)}</span>${p.a.part ? ` <span class="tag ${p.a.status === "exact" ? "ok" : "warnb"}">${p.a.status === "exact" ? "EXACT" : p.a.confidence + "%"}</span>` : ""}</div>` : "";
  return `<div class="scan-evidence"><div style="font-size:11px;color:var(--dim);font-weight:700;letter-spacing:.06em">EVIDENCE — FUSED CHANNELS</div>${row("Decoder", superBarcodePick, "info")}${row("OCR", superOcrPick, "violet")}</div>`;
}
function superFinalize(a, src, raw, f) {
  const b = superBarcodePick, o = superOcrPick;
  superStateReset();
  stopScanner();
  const verdict = a.status === "exact" ? "EXACT MATCH" : a.status === "company" ? "MAKER IDENTIFIED" : a.part ? "AI MATCH " + a.confidence + "%" : "CODE DECODED";
  const row = (label, p, cls) => p ? `<div class="scan-ev"><span class="tag ${cls}">${label}</span> <span class="pn">${esc(p.raw)}</span>${p.a.part ? ` <span class="tag ${p.a.status === "exact" ? "ok" : "warnb"}">${p.a.status === "exact" ? "EXACT" : p.a.confidence + "%"}</span>` : ""}</div>` : "";
  $("scanResult").innerHTML =
    `<div class="scan-kicker"><span class="tag violet">SUPER SCAN AI</span> <span class="tag ${a.status === "exact" ? "ok" : a.part ? "warnb" : "neutral"}">${verdict}</span> via ${src === "barcode" ? "blazing decoder" : "OCR snapshot"} &middot; <span class="pn">${esc(String(raw).slice(0, 40))}</span></div>` +
    `<div class="scan-evidence"><div style="font-size:11px;color:var(--dim);font-weight:700;letter-spacing:.06em">EVIDENCE — FUSED CHANNELS</div>${row("Decoder", b, "info")}${row("OCR", o, "violet")}</div>` +
    renderAnalysis(a, { src, format: src === "ocr" ? "OCR" : f });
  if (a.part) toast(a.status === "exact" ? "ok" : "info", "Super Scan AI", `${a.part.pn} resolved — ${a.status === "exact" ? "exact" : a.confidence + "% confidence"}.`);
  else if (a.status === "company" && a.company && a.company.company) toast("info", "Super Scan AI", "Maker identified: " + a.company.company.name);
  else toast("warn", "Super Scan AI", "Code decoded — not in local catalogue.");
}
async function superOcrLoop() {
  if (superOcrBusy || scanner === null || aiMode !== "super") return;
  if (typeof Tesseract === "undefined") return;
  superOcrBusy = true;
  const st = $("superStatus");
  try {
    const worker = await ocrEnsure();
    const canvas = captureFrame();
    if (st) st.textContent = "OCR reading…";
    const { data } = await worker.recognize(canvas);
    const text = (data && data.text || "").trim();
    if (text) superAccum("ocr", text);
    else if (st) st.textContent = "OCR: nothing readable yet — keep the label in frame";
  } catch (e) {
    if (st && aiMode === "super") st.textContent = "OCR: " + e.message;
  } finally {
    superOcrBusy = false;
  }
}

function manualScan(prefill) {
  const val = (prefill !== undefined ? prefill : ($("scanInput") || {}).value);
  if (prefill === undefined) stopScanner();
  if (!String(val).trim()) { toast("warn", "Empty code", "Enter a part number, QR payload or OCR text."); return; }
  const code = String(val).trim();
  const a = analyzeCode(code, { format: "MANUAL" });
  $("scanResult").innerHTML = `<div class="scan-kicker"><span class="tag ${a.status === "exact" ? "ok" : "neutral"}">SMART LOOKUP</span> input <span class="pn">${esc(code)}</span></div>` + renderAnalysis(a);
  if (a.status === "exact") toast("ok", "Match found", a.part.pn + " verified in inventory.");
  else if (a.status === "none") toast("warn", "No exact match", "Showing closest parts & actions.");
}

/* ---------- AI OCR (Tesseract) ---------- */
const ocrEng = { worker: null, ready: false };

async function ocrEnsure() {
  if (ocrEng.worker) return ocrEng.worker;
  if (typeof Tesseract === "undefined") throw new Error("OCR library missing");
  const st = $("ocrStatus");
  if (st) { st.textContent = "Loading OCR engine… (~12 MB, one-time)"; st.classList.add("pulse"); }
  ocrEng.worker = await Tesseract.createWorker("eng", 1, {
    workerPath: "vendor/tesseract/worker.min.js",
    corePath: "vendor/tesseract/",
    langPath: "vendor/tesseract",
    gzip: true,
    logger: (m) => {
      const s = $("ocrStatus");
      if (s && typeof m.status === "string" && !s.dataset.done) s.textContent = "OCR: " + m.status + (m.progress ? " " + Math.round(m.progress * 100) + "%" : "");
    }
  });
  ocrEng.ready = true;
  if (st) { st.textContent = "OCR engine ready"; st.classList.remove("pulse"); }
  return ocrEng.worker;
}

function captureFrame() {
  const video = document.querySelector("#qrRegion video");
  if (!video || !video.videoWidth) throw new Error("No camera feed — snapshot needs the camera running.");
  const canvas = document.createElement("canvas");
  const scale = 640 / video.videoWidth;
  canvas.width = 640;
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  ctx.filter = "grayscale(1) contrast(1.5)";
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function snapshotOcr() {
  const st = $("ocrStatus");
  try {
    const canvas = captureFrame();
    st.textContent = "Reading label…";
    const worker = await ocrEnsure();
    const { data } = await worker.recognize(canvas);
    const text = (data && data.text || "").trim();
    st.textContent = "AI read complete";
    $("scanResult").innerHTML = `<div class="scan-kicker"><span class="tag violet">AI OCR</span> <span style="font-size:12px;color:var(--dim)">confidence ${Math.round(((data && data.confidence) || 0))}%</span></div>
      <div class="ocr-raw"><b>Raw text</b><br>${esc(text) || "<i>nothing readable</i>"}</div>`;
    if (!text) { toast("warn", "OCR read nothing", "Try better lighting / closer focus, or use Manual."); return; }
    const a = analyzeCode(text, { format: "OCR" });
    $("scanResult").innerHTML += renderAnalysis(a);
    if (a.status === "exact") toast("ok", "OCR matched", text.replace(/\s+/g, " ").slice(0, 28) + " → " + a.part.pn);
    else if (a.status === "none") toast("warn", "OCR read but no exact PN", "Showing nearest parts.");
  } catch (err) {
    st.textContent = err.message;
    toast("danger", "OCR error", err.message);
  }
}
