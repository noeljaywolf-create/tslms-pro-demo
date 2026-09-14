/* ============================================================
   data.js — manufacturer & origin intelligence: OEM registry,
   ATA/PN family rules, company label bank, MADE-IN detection
   ============================================================ */
"use strict";

/* ============ MANUFACTURER & ORIGIN INTELLIGENCE (2040 AI SCAN) ============ */
const FLAG = { "United States": "🇺🇸", "United Kingdom": "🇬🇧", "Germany": "🇩🇪", "France": "🇫🇷", "Japan": "🇯🇵", "Canada": "🇨🇦", "China": "🇨🇳", "India": "🇮🇳", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Australia": "🇦🇺", "European Union": "🇪🇺", "Italy": "🇮🇹", "Netherlands": "🇳🇱", "Brazil": "🇧🇷" };
const flagOf = (c) => FLAG[c] || "🏳️";
const COMPANY_DB = {
  sterling: { key: "sterling", name: "Sterling Brake Systems Ltd", short: "SBS", country: "United Kingdom", focus: ["Landing gear", "Brakes", "Wheel assemblies"], verified: true, trust: 4.9, ref: "MM-UK/8821-ORG" },
  fenz: { key: "fenz", name: "Fenz Hydraulik GmbH", short: "FHZ", country: "Germany", focus: ["Hydraulics", "Linear actuation", "Reservoirs"], verified: true, trust: 4.7, ref: "MM-DE/3310-ORG" },
  qualitron: { key: "qualitron", name: "Qualitron Power Corp", short: "QPC", country: "United States", focus: ["Power generation", "Inverters", "Electrical distribution"], verified: true, trust: 4.8, ref: "MM-US/2077-ORG" },
  aeroflow: { key: "aeroflow", name: "AeroFlow Systems Inc", short: "AFS", country: "United States", focus: ["Fuel systems", "Valves", "Flow regulation"], verified: true, trust: 4.6, ref: "MM-US/5540-ORG" },
  nova: { key: "nova", name: "NovaAvionics", short: "NAV", country: "United States", focus: ["Avionics", "Sensors", "Flight instruments"], verified: true, trust: 4.8, ref: "MM-US/7788-ORG" },
  turbex: { key: "turbex", name: "Turbex Engineering", short: "TEX", country: "United Kingdom", focus: ["Turbine modules", "Engine sections", "Ignition"], verified: true, trust: 4.9, ref: "MM-UK/4456-ORG" },
  ventus: { key: "ventus", name: "Ventus Aerospace SA", short: "VAS", country: "France", focus: ["Pneumatics", "Environmental systems", "Fire & oxygen"], verified: true, trust: 4.5, ref: "MM-FR/6621-ORG" },
  photon: { key: "photon", name: "Photon Air Lighting", short: "PAL", country: "Japan", focus: ["Lighting", "Signaling", "Cabin power"], verified: true, trust: 4.4, ref: "MM-JP/2210-ORG" },
  harlok: { key: "harlok", name: "Harlock Precision Industries", short: "HPI", country: "United States", focus: ["Bearings", "Fasteners", "Precision mechanical"], verified: true, trust: 4.8, ref: "MM-US/1190-ORG" },
  aeroint: { key: "aeroint", name: "CabinWorks Interiors", short: "CWI", country: "United Kingdom", focus: ["Cabins", "Doors", "Interior actuation"], verified: true, trust: 4.3, ref: "MM-UK/7730-ORG" },
  aeronova: { key: "aeronova", name: "AeroNova Group", short: "ANO", country: "South Africa", focus: ["MRO distribution", "OEM partnership", "Compliance"], verified: true, trust: 4.2, distributor: true, ref: "MM-ZA/0001-DST" }
};
const ATA_MFR = { "21": "ventus", "22": "ventus", "24": "qualitron", "25": "aeroint", "26": "ventus", "27": "harlok", "28": "aeroflow", "29": "fenz", "30": "harlok", "31": "nova", "32": "sterling", "33": "photon", "34": "nova", "35": "ventus", "36": "ventus", "47": "nova", "49": "turbex", "51": "harlok", "53": "harlok", "55": "harlok", "56": "nova", "57": "nova", "72": "turbex", "73": "turbex", "74": "turbex", "75": "turbex", "76": "turbex", "77": "nova", "78": "turbex", "79": "turbex", "80": "turbex" };
const MFR_HINTS = {
  BSC: "sterling", BRK: "sterling", SFT: "sterling", HPS: "sterling", STR: "sterling", WLR: "sterling", WHB: "sterling", BTR: "sterling",
  CSK: "harlok", TUE: "turbex", CMP: "turbex", IGN: "turbex", MAG: "turbex", THR: "turbex", OIL: "turbex", APU: "turbex",
  ANLG: "nova", IND: "nova", TEM: "nova", QTY: "nova", NVL: "nova", RSE: "nova", SNS: "nova", RAD: "nova", PRB: "nova",
  LGT: "photon", BUS: "photon", INV: "qualitron",
  ALT: "qualitron", ELC: "qualitron", FUSE: "qualitron", GEN: "qualitron", RLY: "qualitron",
  HYP: "fenz", SYR: "fenz", SPM: "fenz", RCP: "fenz",
  PMP: "aeroflow", FFT: "aeroflow", FIL: "aeroflow", FLO: "aeroflow", VAL: "aeroflow", GST: "aeroflow",
  CAB: "aeroint", CPR: "aeroint",
  OXY: "ventus", CHK: "ventus", DET: "ventus", SOV: "ventus", FAN: "ventus", HTC: "ventus", CFG: "ventus", PHC: "ventus"
};
function mfrKeyForPart(p) { return MFR_HINTS[p.pn.slice(0, 3)] || MFR_HINTS[p.pn.slice(0, 2)] || ATA_MFR[p.ata] || "aeronova"; }
const KNOWN_LABELS = {
  "boeing": { key: "boeing", name: "The Boeing Company", short: "Boe", country: "United States", focus: ["Airframes", "Systems integration"], verified: true, trust: 5.0 },
  "airbus": { key: "airbus", name: "Airbus SE", short: "AB", country: "European Union", focus: ["Airframes", "Programmes"], verified: true, trust: 5.0 },
  "honeywell": { key: "honeywell", name: "Honeywell Aerospace", short: "HNW", country: "United States", focus: ["Avionics", "Bleed air", "APUs"], verified: true, trust: 4.9 },
  "ge aviation": { key: "ge", name: "GE Aerospace", short: "GE", country: "United States", focus: ["Engines", "Power"], verified: true, trust: 5.0 },
  "collins aerospace": { key: "collins", name: "Collins Aerospace (RTX)", short: "CLN", country: "United States", focus: ["Avionics", "Interiors", "Systems"], verified: true, trust: 4.9 },
  "parker hannifin": { key: "parker", name: "Parker Hannifin Corp", short: "PH", country: "United States", focus: ["Hydraulics", "Fluid power"], verified: true, trust: 4.8 },
  "parker": { key: "parker", name: "Parker Hannifin Corp", short: "PH", country: "United States", focus: ["Hydraulics", "Fluid power"], verified: true, trust: 4.8 },
  "eaton": { key: "eaton", name: "Eaton Aerospace", short: "ETN", country: "United States", focus: ["Fluid power", "Actuation"], verified: true, trust: 4.7 },
  "safran": { key: "safran", name: "Safran Group", short: "SFN", country: "France", focus: ["Propulsion", "Aircraft interiors", "Electronics"], verified: true, trust: 4.9 },
  "thales": { key: "thales", name: "Thales", short: "THL", country: "France", focus: ["Electronics", "Defence & aerospace"], verified: true, trust: 4.8 },
  "bombardier": { key: "bombardier", name: "Bombardier", short: "BBD", country: "Canada", focus: ["Business aircraft"], verified: true, trust: 4.7 },
  "pratt whitney": { key: "pw", name: "Pratt & Whitney", short: "PW", country: "United States", focus: ["Engines", "Turbofans"], verified: true, trust: 5.0 },
  "rolls royce": { key: "rr", name: "Rolls-Royce", short: "RR", country: "United Kingdom", focus: ["Engines", "Mission systems"], verified: true, trust: 5.0 },
  "lockheed martin": { key: "lmt", name: "Lockheed Martin", short: "LM", country: "United States", focus: ["Airframes", "Defence"], verified: true, trust: 4.9 },
  "textron": { key: "textron", name: "Textron Aviation", short: "TXT", country: "United States", focus: ["General aviation"], verified: true, trust: 4.6 },
  "leonardo": { key: "leonardo", name: "Leonardo", short: "LDO", country: "Italy", focus: ["Helicopters", "Electronics"], verified: true, trust: 4.7 },
  "diehl": { key: "diehl", name: "Diehl Aerospace", short: "DLH", country: "Germany", focus: ["Cabin systems", "Electronics"], verified: true, trust: 4.5 }
};
function findCompanyInText(text) {
  const t = " " + low(String(text || "").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim()) + " ";
  const hits = [];
  for (const alias of Object.keys(KNOWN_LABELS)) if (t.includes(" " + alias + " ")) hits.push(KNOWN_LABELS[alias]);
  return hits;
}
/* ---- MADE-IN / COUNTRY OF ORIGIN reading (label text, OCR, GS1 free text) ---- */
const COUNTRY_ALIAS = {
  "USA": "United States", "US": "United States", "U.S.A.": "United States", "UNITED STATES OF AMERICA": "United States",
  "UK": "United Kingdom", "U.K.": "United Kingdom", "GB": "United Kingdom", "GREAT BRITAIN": "United Kingdom", "ENGLAND": "United Kingdom",
  "RSA": "South Africa", "Z.A": "South Africa", "ZA": "South Africa",
  "UAE": "United Arab Emirates", "PRC": "China", "P.R.C.": "China", "P.R.C": "China", "PEOPLES REPUBLIC OF CHINA": "China",
  "VIET NAM": "Vietnam", "S.KOREA": "South Korea", "SOUTH KOREA": "South Korea", "NORTH KOREA": "North Korea",
  "CZECH REPUBLIC": "Czech Republic", "COTE D IVOIRE": "Côte d'Ivoire", "HONG KONG": "Hong Kong", "HONG KONG SAR": "Hong Kong"
};
function findMadeIn(text) {
  let u = String(text || "").toUpperCase().replace(/\s+/g, " ").replace(/\.(?!\s)/g, ". ").replace(/\s+/g, " ");
  const m = u.match(/(?:MADE IN|MANUFACTURED IN|M[FR][A-Z]?\.?\s+IN|PRODUCED IN|BUILT IN|COUNTRY OF ORIGIN\s*[:=]|ORIGIN\s*[:=]\s*|PRODUCT OF)\s+([A-Z][A-Z0-9\s.'-]{1,45})/);
  if (!m) return null;
  let raw = m[1].trim();
  const STOP = /(?:BATCH|LOT\b|EXP(?:IRY)?\b|BEST\b|BEFORE\b|SERIAL\b|SN\b|DATE\b|QTY\b|NET\b|EAN\b|GTIN\b|UPC\b|MFR\b|MFG\b|RF\b|LLC\b|LTD\b|PTY\b|PVT\b|CO\b|INC\b|CORP\b|DISTRIBUTED|IMPORTED|PACKED|BY\b|KEEP\b|NET\s|WEIGHT\b|VOL\b|ML\b|G\b|KG\b)/;
  const sm = raw.match(STOP);
  if (sm && sm.index > 0) raw = raw.slice(0, sm.index);
  raw = raw.replace(/[.\s-]+$/, "").trim();
  if (raw.length < 2 || raw.length > 28) return null;
  const fixed = COUNTRY_ALIAS[raw] || COUNTRY_ALIAS[raw.replace(/\s+/g, " ")] || COUNTRY_ALIAS[raw.replace(/\./g, "")] || null;
  if (fixed) return { country: fixed, label: raw };
  const words = raw.replace(/\./g, " ").trim().split(/\s+/);
  const capped = words.map((w) => w === "SAINT" ? "Saint" : w.length <= 2 ? w + "" : w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
  return { country: capped, label: raw };
}
const COMPANY_GTIN = { "8901234": "sample-harlingen", "40012345": "sample-bavaria" };
const COMPANY_SAMPLES = {
  "sample-harlingen": { key: "sample-harlingen", name: "Harlingen Aero Components", short: "HAC", country: "India", focus: ["Aero components"], verified: false, trust: 3.1, sample: true },
  "sample-bavaria": { key: "sample-bavaria", name: "BavariaFlo GmbH", short: "BFG", country: "Germany", focus: ["Fluid systems"], verified: false, trust: 3.3, sample: true }
};
function gtinCompany(digits) {
  const d = String(digits || "").replace(/\D/g, "").replace(/^0(?=\d{13}$)/, "");
  for (let L = 8; L >= 5; L--) {
    const p = d.slice(0, L);
    if (COMPANY_GTIN[p]) { const c = COMPANY_SAMPLES[COMPANY_GTIN[p]]; return { company: c, prefix: p, conf: 93 }; }
  }
  return null;
}
function companyIntelligence(raw, part, codeInfo) {
  if (part && part.mfrKey) return { how: "OEM-RESOLUTION", company: COMPANY_DB[part.mfrKey] || COMPANY_DB.aeronova, conf: 100, prefix: null };
  const csm = codeInfo && codeInfo.consumer && codeInfo.consumer.product;
  if (csm && RETAIL_DB[csm.mfr]) return { how: "RETAIL-RESOLUTION", company: RETAIL_DB[csm.mfr], conf: 92, prefix: null, sample: true, consumer: csm };
  const fromText = findCompanyInText(raw);
  if (fromText.length) return { how: "LABEL-DECLARED", company: fromText[0], conf: 95, prefix: null };
  const pl = codeInfo && codeInfo.payload;
  const gtin = pl && (pl["01"] || pl.gtin);
  /* MADE IN read off the label / OCR / GS1 free text (AI 96, 240, 703, QR-JSON fields) */
  const extraText = [pl && pl["96"], pl && pl["240"], pl && pl["703"], pl && (pl.origin || pl.country || pl.madeIn)].filter(Boolean).join(" ") || "";
  const madeIn = findMadeIn(raw) || findMadeIn(extraText);
  if (gtin) {
    const g = gtinCompany(gtin);
    if (g) return { how: "GS1-COMPANY-PREFIX", company: g.company, prefix: g.prefix, conf: g.conf, sample: true, madeIn: madeIn && madeIn.country };
    const region = gtinRegion(String(gtin).replace(/^0(?=\d{13}$)/, "").slice(0, 3));
    if (madeIn) return { how: "MADE-IN", origin: madeIn.country, conf: 82, gtin: String(gtin), gs1Region: region, madeInLabel: madeIn.label, madeIn: madeIn.country };
    return { how: "ORIGIN-ONLY", origin: region, conf: 55, gtin: String(gtin), gs1Region: region };
  }
  if (madeIn) return { how: "MADE-IN", origin: madeIn.country, conf: 82, madeInLabel: madeIn.label, madeIn: madeIn.country };
  return null;
}
