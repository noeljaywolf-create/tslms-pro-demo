/* ============================================================
   intel.js — barcode inspection + analyzeCode: any barcode to store
   part, retail product, or manufacturer trace
   ============================================================ */
"use strict";

/* ============ RETAIL / CONSUMER PRODUCT INTELLIGENCE ("ANY BARCODE") ============ */
/* Sample consumer-goods registry so real-world barcodes (oil bottles, groceries,
   toiletries…) resolve to a product + maker. Uses GS1 "restricted-distribution"
   prefix 20 (safe for demo items) with valid check digits. */
const RETAIL_DB = {
  goldenfields: { key: "goldenfields", name: "GoldenFields Edible Oils", short: "GFE", country: "Zimbabwe", focus: ["Edible oils", "Fats"], verified: false, trust: 3.6, sample: true, ref: "RZ/2000/001" },
  "olive-md": { key: "olive-md", name: "MareTre Olivari", short: "MTO", country: "Italy", focus: ["Olive oils"], verified: false, trust: 3.9, sample: true, ref: "RZ/2000/002" },
  sunray: { key: "sunray", name: "SunRay Mills", short: "SRM", country: "Zimbabwe", focus: ["Soybean oils", "Maize"], verified: false, trust: 3.5, sample: true, ref: "RZ/2000/003" },
  cleapure: { key: "cleapure", name: "CleaPure Consumer Brands", short: "CPB", country: "Zimbabwe", focus: ["Personal care", "Home goods"], verified: false, trust: 3.4, sample: true, ref: "RZ/2000/004" },
  blueburst: { key: "blueburst", name: "BlueBurst Beverages", short: "BBV", country: "Zimbabwe", focus: ["Soft drinks", "Juices"], verified: false, trust: 3.5, sample: true, ref: "RZ/2000/005" },
  aquavale: { key: "aquavale", name: "AquaVale Springs", short: "AVS", country: "Zimbabwe", focus: ["Mineral water"], verified: false, trust: 3.7, sample: true, ref: "RZ/2000/006" },
  dairyhigh: { key: "dairyhigh", name: "DairyHigh Producers", short: "DHP", country: "Zimbabwe", focus: ["Dairy", "Margarine"], verified: false, trust: 3.6, sample: true, ref: "RZ/2000/007" },
  nutrich: { key: "nutrich", name: "NutRich Foods", short: "NRF", country: "Zimbabwe", focus: ["Spreads", "Snacks"], verified: false, trust: 3.4, sample: true, ref: "RZ/2000/008" },
  sugarc: { key: "sugarc", name: "SugArc Refineries", short: "SAR", country: "Zimbabwe", focus: ["Sugar", "Sweeteners"], verified: false, trust: 3.5, sample: true, ref: "RZ/2000/009" },
  millgood: { key: "millgood", name: "MillGood Grains", short: "MGG", country: "Zimbabwe", focus: ["Maize meal", "Grains"], verified: false, trust: 3.6, sample: true, ref: "RZ/2000/010" },
  trafoods: { key: "trafoods", name: "TRA Foods SA", short: "TRF", country: "South Africa", focus: ["Rice", "Pasta"], verified: false, trust: 3.5, sample: true, ref: "RZ/2000/011" },
  saltline: { key: "saltline", name: "SaltLine Foods", short: "SLF", country: "Zimbabwe", focus: ["Salt", "Seasonings"], verified: false, trust: 3.3, sample: true, ref: "RZ/2000/012" },
  sudzy: { key: "sudzy", name: "Sudzy Homecare", short: "SZY", country: "Zimbabwe", focus: ["Soap", "Detergents"], verified: false, trust: 3.4, sample: true, ref: "RZ/2000/013" }
};
const CONSUMER_ITEMS = [
  ["Sunflower Cooking Oil 5L", "GoldenFields", "goldenfields", "Oils & Fats", 18.5, "Aisle 1 · Cooking Oils"],
  ["Extra Virgin Olive Oil 1L", "MareTre", "olive-md", "Oils & Fats", 14.99, "Aisle 1 · Cooking Oils"],
  ["Corn Oil 2L", "GoldenFields", "goldenfields", "Oils & Fats", 8.9, "Aisle 1 · Cooking Oils"],
  ["Soybean Fine Oil 3L", "SunRay Mills", "sunray", "Oils & Fats", 10.5, "Aisle 1 · Cooking Oils"],
  ["Cooking Oil 750ml", "CleaPure", "cleapure", "Oils & Fats", 3.2, "Aisle 1 · Cooking Oils"],
  ["Sparkling Cola 330ml", "BlueBurst", "blueburst", "Beverages", 1.5, "Aisle 4 · Beverages"],
  ["Orange Juice 1L", "BlueBurst", "blueburst", "Beverages", 2.8, "Aisle 4 · Beverages"],
  ["Natural Spring Water 500ml", "AquaVale", "aquavale", "Beverages", 0.9, "Aisle 4 · Beverages"],
  ["Whole Milk 1L", "DairyHigh", "dairyhigh", "Dairy", 1.8, "Aisle 3 · Dairy & Chilled"],
  ["Margarine 500g", "DairyHigh", "dairyhigh", "Dairy", 2.3, "Aisle 3 · Dairy & Chilled"],
  ["Peanut Butter 400g", "NutRich", "nutrich", "Food", 3.6, "Aisle 5 · Pantry"],
  ["White Sugar 1kg", "SugArc", "sugarc", "Food", 2.1, "Aisle 5 · Pantry"],
  ["Maize Meal 10kg", "MillGood", "millgood", "Food", 11.9, "Aisle 5 · Pantry"],
  ["Rice 5kg", "TRA Foods", "trafoods", "Food", 9.5, "Aisle 5 · Pantry"],
  ["Cooking Salt 500g", "SaltLine", "saltline", "Food", 0.85, "Aisle 5 · Pantry"],
  ["Bath Soap 3-pack", "Sudzy", "sudzy", "Home Care", 2.4, "Aisle 6 · Home Care"],
  ["Shampoo 250ml", "CleaPure", "cleapure", "Personal Care", 4.2, "Aisle 6 · Personal Care"],
  ["Hand Soap 500ml", "CleaPure", "cleapure", "Personal Care", 3.1, "Aisle 6 · Personal Care"]
];
const CONSUMER_DB = {};
(function buildConsumerDb() {
  CONSUMER_ITEMS.forEach((it, i) => {
    const body = "2000" + String(i + 1).padStart(8, "0");
    CONSUMER_DB[body + gtinCheckDigit(body)] = { name: it[0], brand: it[1], mfr: it[2], category: it[3], price: it[4], aisle: it[5] };
  });
})();
function upcEexpand(u8) {
  /* UPC-E (8-digit compact UPC-A) -> 12-digit UPC-A, per GS1/GTIN-12 conversion */
  if (!/^\d{8}$/.test(u8)) return null;
  const k = u8[6];
  if (k <= "2") return u8.slice(0, 3) + k + "0000" + u8.slice(3, 6) + u8[7];
  if (k === "3") return u8.slice(0, 4) + "00000" + u8.slice(4, 6) + u8[7];
  if (k === "4") return u8.slice(0, 5) + "00000" + u8[5] + u8[7];
  return u8.slice(0, 6) + "0000" + u8[6] + u8[7];
}
function consumerLookup(digits) {
  const d = String(digits || "").replace(/\D/g, "");
  const cands = [d, upcEexpand(d)].filter(Boolean);
  for (const x of cands) if (CONSUMER_DB[x]) return { product: CONSUMER_DB[x], code: x };
  return null;
}
const CODE_PREFIX = { "PN": "Part number label", "P/N": "Part number label", "BAR": "Barcode label", "SERIAL": "Serialised part tag", "SN": "Serial number tag", "AOG": "AOG request", "LOC": "Bin location code" };
function inspectCode(raw, fmt) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const sym = symName(fmt);
  const info = { sym };
  /* structured QR/JSON payload */
  if (/^\{/.test(s)) {
    try {
      const o = JSON.parse(s);
      info.kind = "QR-JSON payload";
      info.payload = o;
      info.note = "Machine-readable structured payload";
      return info;
    } catch (e) { /* fall through */ }
  }
  /* GS1-128 Application Identifiers */
  const gs = parseGS1(s);
  if (gs) {
    info.kind = "GS1-128";
    info.payload = gs;
    const gtin = gs["01"] || "";
    info.validGtin = /^\d{14}$/.test(gtin) ? gtinCheckOk(gtin) : null;
    info.note = "GS1 Application Identifier barcode — decoded above";
    if (gtin) { const hit = indexLookup(gtin.slice(gtin.length === 14 ? 1 : 0)); if (hit) info.mapped = hit; }
    if (gtin) { const c = consumerLookup(gtin.replace(/^0(?=\d{13}$)/, "")); if (c) info.consumer = c; }
    return info;
  }
  /* key:value prefix (PN:, BAR:, SERIAL:, SN:, AOG:, LOC:) */
  const pm = s.match(/^(P\/?N|SERIAL|SN|BAR|AOG|LOC):\s*(.+)$/i);
  if (pm) {
    const key = pm[1].toUpperCase();
    info.kind = CODE_PREFIX[key] || key + " payload";
    info.payload = { [key]: pm[2] };
    info.key = key;
    info.note = info.kind;
    const hit = indexLookup(pm[2]);
    if (hit) info.mapped = hit;
    return info;
  }
  /* pure numeric EAN/UPC/GTIN */
  const digits = s.replace(/\s+/g, "");
  if (/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(digits)) {
    const isUpce = /^\d{8}$/.test(digits) && /^[01]/.test(digits);
    const upca8 = isUpce ? upcEexpand(digits) : null;
    const vk = upca8 ? gtinCheckOk(upca8) : gtinCheckOk(digits);
    info.kind = gtinKind(digits);
    info.payload = { gtin: digits };
    if (upca8) info.payload.upca = upca8;
    info.validGtin = vk;
    info.note = `${gtinKind(digits)} retail/global code — check digit ${vk ? "VALID" : "INVALID"}, GS1 prefix ${gtinRegion(digits)}`;
    const hit = indexLookup(digits);
    if (hit) info.mapped = hit;
    const c = consumerLookup(digits);
    if (c) info.consumer = c;
    return info;
  }
  /* plain barcode text (PN or arbitrary) */
  if (sym) {
    info.kind = "Barcode / QR text";
    info.note = null;
  }
  return info.kind ? info : null;
}
function analyzeCode(input, meta) {
  const raw = String(input || "").trim();
  const parts = STORE.parts;
  const codeInfo = inspectCode(raw, meta && meta.format) || (meta && meta.format ? { sym: symName(meta.format), kind: "Barcode / QR text", note: null } : null);

  /* direct hit via the resolution index (PN variants, aliases, mapped GTIN…) */
  const mapped = (codeInfo && codeInfo.mapped) || indexLookup(raw);
  if (mapped) return { status: "exact", part: mapped, confidence: 100, raw, candidates: [], text: "", codeInfo, company: companyIntelligence(raw, mapped, codeInfo) };

  // exact
  const exact = parts.find((p) => low(p.pn) === low(raw));
  if (exact) return { status: "exact", part: exact, confidence: 100, raw, candidates: [], text: "", codeInfo, company: companyIntelligence(raw, exact, codeInfo) };

  // GS1 GTIN that is not ours — report the code itself
  const gtin = codeInfo && codeInfo.payload && (codeInfo.payload.gtin || codeInfo.payload["01"]);
  if (codeInfo && codeInfo.validGtin === true && gtin && !mapped) {
    const consumer = (codeInfo.consumer && codeInfo.consumer.product) || null;
    return { status: "none", part: null, confidence: 0, raw, candidates: tail(raw), text: "", codeInfo, alternatives: consumer ? [] : nearest(raw), company: companyIntelligence(raw, null, codeInfo), consumer };
  }

  // collect candidate tokens (whole string or extracted PN patterns) — fuzzy matching
  // is restricted to short PN-like codes so payloads (GS1/JSON/prose) can't mis-match
  const lookPN = (t) => { const n = norm(t); return n.length >= 3 && n.length <= 20 && /[A-Z]/.test(n) && /\d/.test(n); };
  const tokens = [...new Set([raw, ...extractPN(raw)])].filter(lookPN);
  let best = null;
  for (const t of tokens) {
    const tn = norm(t);
    if (!tn) continue;
    for (const p of parts) {
      const d = lev(tn, norm(p.pn));
      const maxLen = Math.max(tn.length, norm(p.pn).length);
      const conf = Math.max(0, Math.round(100 - (d / maxLen) * 100));
      if (!best || conf > best.conf) best = { part: p, conf, dist: d };
    }
  }
  if (best && best.conf >= 75) {
    return { status: best.conf >= 92 ? "fuzzy" : "near", part: best.part, confidence: best.conf, raw, candidates: tail(raw), text: "", codeInfo, company: companyIntelligence(raw, best.part, codeInfo) };
  }
  // alternatives sorted by distance
  const co = companyIntelligence(raw, null, codeInfo);
  if (co && co.how !== "ORIGIN-ONLY" && co.conf >= 90) {
    return { status: "company", company: co, confidence: co.conf, raw, candidates: [], text: "", codeInfo, alternatives: nearest(raw) };
  }
  const consumer = (codeInfo && codeInfo.consumer && codeInfo.consumer.product) || null;
  return { status: "none", part: null, confidence: 0, raw, candidates: tail(raw), text: "", codeInfo, alternatives: consumer ? [] : nearest(raw), company: co, consumer };
}

function nearest(raw) {
  return STORE.parts.map((p) => ({ p, d: lev(norm(raw), norm(p.pn)) })).sort((a, b) => a.d - b.d).slice(0, 4);
}

function tail(raw) {
  const s = String(raw || "").trim();
  if (s.length < 6) return [];
  return extractPN(s).slice(1, 4);
}
