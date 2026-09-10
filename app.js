/* ============================================================
   TSLMS Pro — Aviation Technical Stores Intelligence Platform
   Simulated intelligence layer (100% client-side, GitHub Pages ready)
   ============================================================ */
"use strict";

/* ---------------- Helpers ---------------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const now = () => new Date();
const fmtTime = (d) => d.toLocaleTimeString("en-GB");
const pad = (n) => String(n).padStart(2, "0");

let charts = {};
function killChart(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

/* ---------------- Data store ---------------- */
const STORE = {
  users: [
    { user: "m.chikumba", pass: "stores123", role: "stores", name: "M. Chikumba", title: "Stores Controller" },
    { user: "t.ndlovu", pass: "eng123", role: "engineer", name: "T. Ndlovu", title: "Maintenance Engineer" },
    { user: "k.moyo", pass: "insp123", role: "inspector", name: "K. Moyo", title: "Quality Inspector" }
  ],
  parts: [
    { pn: "BSC-64-73221", name: "Wheel & Brake Assembly", ata: "32", stock: 2, min: 6, loc: "R1-B1", cert: "EASA F1 #E-88213", life: "OK", unit: 5300 },
    { pn: "HYP-100-2", name: "Hydraulic Pump", ata: "29", stock: 9, min: 5, loc: "R1-B7", cert: "FAA 8130-3 #F-24510", life: "OK", unit: 1870 },
    { pn: "FFT-450-A", name: "Fuel Flow Transmitter", ata: "28", stock: 8, min: 4, loc: "R1-B6", cert: "CAA ZW #C-1109", life: "OK", unit: 940 },
    { pn: "WHB-32-881", name: "Wheel Hub LDG", ata: "32", stock: 1, min: 3, loc: "R2-B4", cert: "EASA F1 #E-99104", life: "EXPIRING", unit: 2100 },
    { pn: "CSK-740-77", name: "Combustion Seal Kit", ata: "74", stock: 3, min: 4, loc: "R2-B2", cert: "FAA 8130-3 #F-30177", life: "OK", unit: 180 },
    { pn: "GST-304-88", name: "Gas Starter Valve", ata: "80", stock: 7, min: 3, loc: "R3-B8", cert: "EASA F1 #E-20164", life: "OK", unit: 3200 },
    { pn: "PMP-28-92", name: "Booster Pump", ata: "28", stock: 12, min: 5, loc: "R1-B8", cert: "CAA ZW #C-8821", life: "OK", unit: 760 },
    { pn: "OIL-79-112", name: "Oil Cooler Core", ata: "79", stock: 4, min: 2, loc: "R3-B6", cert: "FAA 8130-3 #F-88093", life: "OK", unit: 4150 },
    { pn: "BRG-27-230", name: "Control Bearing Set", ata: "27", stock: 3, min: 4, loc: "R1-B5", cert: "EASA F1 #E-33019", life: "OK", unit: 620 },
    { pn: "SEAL-74-061", name: "High-Temp Seal", ata: "74", stock: 5, min: 2, loc: "R2-B7", cert: "CAA ZW #C-5512", life: "OK", unit: 95 },
    { pn: "GEN-24-410", name: "IDG Generator", ata: "24", stock: 1, min: 2, loc: "R1-B3", cert: "FAA 8130-3 #F-77481", life: "OK", unit: 88500 },
    { pn: "APU-49-300", name: "APU Starter Motor", ata: "49", stock: 6, min: 2, loc: "R3-B1", cert: "EASA F1 #E-66077", life: "OK", unit: 24000 }
  ],
  reqs: [],
  aog: [],
  events: []
};

/* Expanded catalogue — realistic aviation spares (existing 12 untouched) */
const CATALOG_EXTRAS = [
  { pn: "ACT-27-315", name: "Aileron Actuator", ata: "27", stock: 8, min: 4, loc: "R1-B1", cert: "EASA F1 #E-20177", life: "OK", unit: 480 },
  { pn: "ALT-24-110", name: "AC Alternator", ata: "24", stock: 5, min: 3, loc: "R1-B2", cert: "FAA 8130-3 #F-99012", life: "OK", unit: 2600 },
  { pn: "ANLG-31-205", name: "Mach / Airspeed Indicator", ata: "31", stock: 4, min: 2, loc: "R1-B9", cert: "CAA ZW #C-4471", life: "OK", unit: 1900 },
  { pn: "BTR-29-504", name: "Brake Pressure Transducer", ata: "29", stock: 6, min: 3, loc: "R2-B3", cert: "EASA F1 #E-55511", life: "OK", unit: 340 },
  { pn: "BRK-32-112", name: "Brake Disc (Carbon)", ata: "32", stock: 3, min: 6, loc: "R2-B1", cert: "FAA 8130-3 #F-21440", life: "OK", unit: 860 },
  { pn: "BUS-33-222", name: "Wing Tip Lamp Assembly", ata: "33", stock: 14, min: 10, loc: "R2-B8", cert: "CAA ZW #C-3320", life: "OK", unit: 120 },
  { pn: "CAB-25-118", name: "Lavatory Module Actuator", ata: "25", stock: 2, min: 2, loc: "R3-B5", cert: "EASA F1 #E-73014", life: "OK", unit: 1050 },
  { pn: "CFG-21-409", name: "Air Cycle Machine", ata: "21", stock: 1, min: 1, loc: "R1-B12", cert: "EASA F1 #E-90122", life: "OK", unit: 14200 },
  { pn: "CHK-36-121", name: "Check Valve", ata: "36", stock: 18, min: 10, loc: "R3-B7", cert: "FAA 8130-3 #F-11890", life: "OK", unit: 95 },
  { pn: "CMP-72-220", name: "HP Compressor Blade", ata: "72", stock: 9, min: 6, loc: "R3-B2", cert: "EASA F1 #E-28841", life: "OK", unit: 640 },
  { pn: "CPR-25-117", name: "Cockpit Door Latch", ata: "25", stock: 11, min: 6, loc: "R2-B5", cert: "CAA ZW #C-8810", life: "OK", unit: 240 },
  { pn: "DET-36-112", name: "Thermal Detector", ata: "36", stock: 7, min: 4, loc: "R3-B4", cert: "FAA 8130-3 #F-55220", life: "OK", unit: 310 },
  { pn: "ELC-24-205", name: "Static Inverter", ata: "24", stock: 3, min: 2, loc: "R1-B4", cert: "EASA F1 #E-64550", life: "OK", unit: 5200 },
  { pn: "FAN-21-330", name: "Cooling Fan Drive", ata: "21", stock: 5, min: 3, loc: "R1-B11", cert: "FAA 8130-3 #F-33211", life: "OK", unit: 780 },
  { pn: "FIL-28-410", name: "Main Fuel Filter", ata: "28", stock: 16, min: 12, loc: "R1-B8", cert: "CAA ZW #C-9907", life: "OK", unit: 140 },
  { pn: "FLO-28-511", name: "Flow Regulator Valve", ata: "28", stock: 6, min: 4, loc: "R1-B7", cert: "EASA F1 #E-11203", life: "OK", unit: 420 },
  { pn: "FUSE-24-311", name: "Generator Control Fuse", ata: "24", stock: 25, min: 15, loc: "R1-B6", cert: "FAA 8130-3 #F-40113", life: "OK", unit: 18 },
  { pn: "GEN-24-405", name: "APU Generator", ata: "24", stock: 2, min: 1, loc: "R1-B3", cert: "EASA F1 #E-76098", life: "OK", unit: 9800 },
  { pn: "HPS-32-118", name: "Nose Strut Seal Kit", ata: "32", stock: 4, min: 3, loc: "R2-B6", cert: "CAA ZW #C-5513", life: "OK", unit: 220 },
  { pn: "HTC-21-750", name: "Pressurization Controller", ata: "21", stock: 5, min: 3, loc: "R1-B13", cert: "EASA F1 #E-33095", life: "OK", unit: 2900 },
  { pn: "IGN-74-220", name: "Igniter Plug", ata: "74", stock: 12, min: 8, loc: "R2-B9", cert: "FAA 8130-3 #F-94015", life: "OK", unit: 180 },
  { pn: "IND-31-118", name: "Fuel Quantity Indicator", ata: "31", stock: 4, min: 2, loc: "R1-B10", cert: "CAA ZW #C-1209", life: "OK", unit: 1450 },
  { pn: "INV-33-330", name: "Cabin Lighting Inverter", ata: "33", stock: 9, min: 5, loc: "R2-B7", cert: "EASA F1 #E-84210", life: "OK", unit: 650 },
  { pn: "LGT-33-211", name: "Taxi Light Assembly", ata: "33", stock: 6, min: 4, loc: "R2-B8", cert: "FAA 8130-3 #F-77105", life: "OK", unit: 330 },
  { pn: "MAG-76-110", name: "Ignition Exciter", ata: "76", stock: 5, min: 3, loc: "R2-B11", cert: "EASA F1 #E-55124", life: "OK", unit: 1750 },
  { pn: "NVL-57-110", name: "Navigation Light", ata: "57", stock: 8, min: 6, loc: "R2-B10", cert: "CAA ZW #C-6604", life: "OK", unit: 190 },
  { pn: "NUT-51-118", name: "Spacer Bearing Set", ata: "51", stock: 30, min: 20, loc: "R2-B4", cert: "FAA 8130-3 #F-55241", life: "OK", unit: 45 },
  { pn: "OIL-79-215", name: "Oil Cooler Fan", ata: "79", stock: 3, min: 2, loc: "R3-B6", cert: "EASA F1 #E-13305", life: "OK", unit: 3300 },
  { pn: "OXY-35-110", name: "Oxygen Mask Regulator", ata: "35", stock: 9, min: 6, loc: "R3-B3", cert: "EASA F1 #E-40521", life: "OK", unit: 560 },
  { pn: "PHC-26-115", name: "Fire Bottle Detector", ata: "26", stock: 5, min: 3, loc: "R2-B12", cert: "FAA 8130-3 #F-88440", life: "OK", unit: 990 },
  { pn: "PRB-77-515", name: "EGT Thermocouple", ata: "77", stock: 7, min: 4, loc: "R3-B2", cert: "CAA ZW #C-7721", life: "OK", unit: 350 },
  { pn: "RAD-34-105", name: "VOR / LOC Antenna", ata: "34", stock: 10, min: 6, loc: "R1-B14", cert: "EASA F1 #E-99551", life: "OK", unit: 520 },
  { pn: "RCP-29-201", name: "Ram Air Turbine", ata: "29", stock: 1, min: 1, loc: "R1-B15", cert: "EASA F1 #E-67110", life: "OK", unit: 13400 },
  { pn: "RLY-24-301", name: "Landing Gear Relay", ata: "24", stock: 15, min: 10, loc: "R1-B5", cert: "FAA 8130-3 #F-31002", life: "OK", unit: 120 },
  { pn: "RSE-34-410", name: "Weather Radar Unit", ata: "34", stock: 2, min: 2, loc: "R1-B16", cert: "EASA F1 #E-20551", life: "OK", unit: 6400 },
  { pn: "SFT-32-120", name: "Brake Cooling Fan", ata: "32", stock: 5, min: 3, loc: "R2-B13", cert: "FAA 8130-3 #F-66412", life: "OK", unit: 1180 },
  { pn: "SNS-34-215", name: "TAWS Computer", ata: "34", stock: 3, min: 2, loc: "R1-B17", cert: "EASA F1 #E-77314", life: "OK", unit: 8900 },
  { pn: "SOV-36-118", name: "Solenoid Valve", ata: "36", stock: 9, min: 6, loc: "R3-B5", cert: "CAA ZW #C-6208", life: "OK", unit: 210 },
  { pn: "SPM-29-310", name: "Starter Valve Actuator", ata: "29", stock: 4, min: 3, loc: "R1-B18", cert: "FAA 8130-3 #F-99210", life: "OK", unit: 920 },
  { pn: "STR-32-122", name: "Upper Pivot Pin", ata: "32", stock: 8, min: 5, loc: "R2-B14", cert: "CAA ZW #C-3299", life: "OK", unit: 260 },
  { pn: "SYR-29-119", name: "Hydraulic Reservoir", ata: "29", stock: 3, min: 2, loc: "R1-B7", cert: "EASA F1 #E-44027", life: "OK", unit: 3400 },
  { pn: "TEM-31-111", name: "Outside Air Temp Probe", ata: "31", stock: 6, min: 4, loc: "R1-B10", cert: "FAA 8130-3 #F-12088", life: "OK", unit: 180 },
  { pn: "THR-78-112", name: "Thrust Reverser Latch", ata: "78", stock: 4, min: 3, loc: "R3-B8", cert: "EASA F1 #E-55409", life: "OK", unit: 640 },
  { pn: "TUE-73-415", name: "Turbine Disc", ata: "73", stock: 2, min: 2, loc: "R3-B2", cert: "EASA F1 #E-65201", life: "OK", unit: 21000 },
  { pn: "VAL-28-113", name: "Fuel Shutoff Valve", ata: "28", stock: 5, min: 4, loc: "R1-B8", cert: "CAA ZW #C-9090", life: "OK", unit: 2850 },
  { pn: "WIN-30-116", name: "Windshield Wiper Motor", ata: "30", stock: 6, min: 4, loc: "R3-B7", cert: "FAA 8130-3 #F-44082", life: "OK", unit: 310 },
  { pn: "WLR-32-118", name: "Main Wheel Assembly", ata: "32", stock: 2, min: 4, loc: "R1-B1", cert: "EASA F1 #E-91821", life: "OK", unit: 1450 },
  { pn: "QTY-31-119", name: "Fuel Quantity Transmitter", ata: "31", stock: 7, min: 4, loc: "R1-B10", cert: "CAA ZW #C-8847", life: "OK", unit: 720 }
];
STORE.parts.push(...CATALOG_EXTRAS);

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
  if (gtin) {
    const g = gtinCompany(gtin);
    if (g) return { how: "GS1-COMPANY-PREFIX", company: g.company, prefix: g.prefix, conf: g.conf, sample: true };
    return { how: "ORIGIN-ONLY", origin: gtinRegion(String(gtin).replace(/^0(?=\d{13}$)/, "").slice(0, 3)), conf: 55, gtin: String(gtin) };
  }
  return null;
}
/* ============ UNSCANNED-CODE RESOLUTION INDEX ============ */
/* Maps every plausible label variant of a part (PN with/without dashes,
   PN:/BAR:/SERIAL:/P/N prefixes, part-name aliases, numeric GTIN forms)
   to that part, so any scanned code resolves to the exact item. */
const CODE_INDEX = new Map();
const ALIASES = {
  brake: "BSC-64-73221", wheel: "BSC-64-73221", hydraulic: "HYP-100-2",
  "fuel flow": "FFT-450-A", transmitter: "FFT-450-A", hub: "WHB-32-881",
  seal: "SEAL-74-061", generator: "GEN-24-410", starter: "APU-49-300",
  apu: "APU-49-300", bearing: "BRG-27-230", valve: "GST-304-88",
  cooler: "OIL-79-112", pump: "PMP-28-92", boost: "PMP-28-92",
  actuator: "ACT-27-315", alternator: "ALT-24-110", disc: "BRK-32-112",
  filter: "FIL-28-410", inverter: "ELC-24-205", relay: "RLY-24-301",
  oxygen: "OXY-35-110", regulator: "OXY-35-110", radar: "RSE-34-410",
  oil: "OIL-79-215", igniter: "IGN-74-220", tyre: "WLR-32-118",
  tire: "WLR-32-118", light: "LGT-33-211", navigation: "NVL-57-110"
};
function buildIndex() {
  const reg = (k, p) => {
    const n = norm(k);
    if (n && n.length >= 3 && !CODE_INDEX.has(n)) CODE_INDEX.set(n, p);
  };
  for (const p of STORE.parts) {
    p.mfrKey = mfrKeyForPart(p);
    const n = norm(p.pn);
    reg(p.pn, p); reg(p.name, p); reg(n, p);
    reg("PN" + n, p); reg("P/N" + n, p); reg("BAR" + n, p);
    reg("SERIAL" + n, p); reg("SN" + n, p); reg("CHK" + n, p);
    if (n.length > 3) reg(n.slice(0), p);
    const digits = n.replace(/[^0-9]/g, "");
    if (digits.length >= 6) {
      [12, 13].forEach((len) => {
        const p13 = digits.slice(0, Math.min(len - 1, digits.length)).padStart(len - 1, "0");
        reg(p13 + gtinCheckDigit(p13), p);
      });
    }
  }
  for (const k of Object.keys(ALIASES)) { const p = STORE.parts.find((x) => x.pn === ALIASES[k]); if (p) reg(k, p); }
}
buildIndex();
function indexLookup(text) { return CODE_INDEX.get(norm(text)) || null; }

/* ---- GTIN / EAN-13 / UPC-A check digit ---- */
function gtinCheckDigit(body) {
  const d = String(body || "").replace(/\D/g, "");
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    const fromRight = d.length - i;
    sum += (+d[i]) * (fromRight % 2 === 1 ? 3 : 1);
  }
  return String((10 - (sum % 10)) % 10);
}
function gtinCheckOk(code) {
  const d = String(code || "").replace(/\D/g, "");
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(d)) return false;
  return gtinCheckDigit(d.slice(0, -1)) === d.slice(-1);
}
const GS1_PREFIX = {
  "00":"US & Canada","01":"US & Canada","02":"US & Canada","03":"US & Canada","04":"US & Canada",
  "05":"US & Canada","06":"US & Canada","07":"US & Canada","08":"US & Canada","09":"US & Canada",
  "20":"Restricted distribution","21":"Restricted distribution","22":"Restricted distribution",
  "23":"Restricted distribution","24":"Restricted distribution","29":"Restricted distribution",
  "30":"France","31":"France","32":"France","33":"France","34":"France","35":"France","36":"France","37":"France",
  "400":"Germany","401":"Germany","404":"Germany","410":"Germany","414":"Germany","419":"Germany",
  "45":"Japan","46":"Russia","471":"Taiwan","475":"Latvia","476":"Azerbaijan","484":"Moldova",
  "485":"Armenia","529":"Cyprus","500":"UK","501":"UK","502":"UK","503":"UK","504":"UK","505":"UK","506":"UK","507":"UK","508":"UK","509":"UK",
  "520":"Greece","527":"Lebanon","528":"Israel","530":"Albania","531":"North Macedonia",
  "535":"Malta","539":"Ireland","540":"Belgium","541":"Belgium","542":"Belgium","543":"Belgium","544":"Belgium","545":"Belgium","546":"Belgium","547":"Belgium","548":"Belgium","549":"Belgium",
  "560":"Portugal","569":"Iceland","570":"Denmark","590":"Poland","594":"Romania",
  "599":"Hungary","600":"South Africa","601":"South Africa","609":"Mauritius","611":"Morocco",
  "690":"China","691":"China","692":"China","693":"China","694":"China","695":"China","696":"China","697":"China","698":"China","699":"China",
  "70":"Norway","729":"Argentina","730":"Sweden","731":"Sweden","732":"Sweden","733":"Sweden","734":"Sweden","735":"Sweden","736":"Sweden","737":"Sweden","738":"Sweden","739":"Sweden",
  "740":"Guatemala","741":"El Salvador","742":"Honduras","743":"Nicaragua","744":"Costa Rica",
  "745":"Panama","746":"Dominican Republic","750":"Mexico","754":"Canada","755":"Canada",
  "759":"Venezuela","760":"Switzerland","761":"Switzerland","762":"Switzerland","763":"Switzerland","764":"Switzerland","765":"Switzerland","766":"Switzerland","767":"Switzerland","768":"Switzerland","769":"Switzerland",
  "770":"Colombia","773":"Uruguay","775":"Peru","777":"Bolivia","779":"Argentina","780":"Chile",
  "784":"Paraguay","785":"Peru","786":"Ecuador","789":"Brazil","790":"Brazil","791":"Brazil",
  "800":"Italy","801":"Italy","802":"Italy","803":"Italy","804":"Italy","805":"Italy","806":"Italy","807":"Italy","808":"Italy","809":"Italy",
  "810":"Italy","840":"Spain","850":"Cuba","858":"Slovakia","859":"Czech Republic","860":"Serbia",
  "868":"Turkey","869":"Turkey","870":"Netherlands","871":"Netherlands","872":"Netherlands","873":"Netherlands","874":"Netherlands","875":"Netherlands","876":"Netherlands","877":"Netherlands","878":"Netherlands","879":"Netherlands",
  "880":"South Korea","885":"Thailand","888":"Singapore","890":"India","893":"Vietnam",
  "899":"Indonesia","90":"Austria","91":"Austria","93":"Australia","94":"New Zealand",
  "955":"Malaysia","958":"Macau","977":"Periodicals (ISSN)","978":"Books (ISBN)","979":"Books (ISBN)","980":"Refunds","99":"Coupons"
};
function gtinRegion(digits) {
  if (!digits) return "U.S. & Canada (UPC default)";
  for (let L = 3; L >= 1; L--) {
    const key = digits.slice(0, L);
    if (GS1_PREFIX[key]) return GS1_PREFIX[key];
  }
  return "Unknown GS1 prefix";
}

const GS1_AI = {
  "00": "SSCC-18 shipment container", "01": "GTIN — trade item", "02": "GTIN of contained items",
  "10": "Batch / lot", "11": "Production date", "13": "Packaging date", "15": "Best-before date",
  "17": "Expiry date", "21": "Serial number (SGTIN)", "30": "Variable quantity",
  "37": "Number of units", "240": "Additional item reference", "241": "Customer part number",
  "250": "Secondary serial", "400": "Purchase order number", "90": "Mutually-defined data",
  "91": "Mutually-defined", "92": "Mutually-defined"
};
function fmtGS1Date(yymmdd) {
  const m = String(yymmdd || "").match(/^(\d{2})(\d{2})(\d{2})$/);
  if (!m) return String(yymmdd || "");
  return `${m[3]}/${m[2]}/${m[1]}`;
}
function parseGS1(s) {
  const groups = [...String(s).matchAll(/\((\d{2,4})\)([^()]+)/g)];
  if (!groups.length) return null;
  const payload = {};
  for (const g of groups) {
    const ai = g[1], val = g[2];
    payload[ai] = val;
    if (/^(11|13|15|17)$/.test(ai)) payload[ai + "Label"] = fmtGS1Date(val);
  }
  return payload;
}
function gtinKind(digits) {
  if (digits.length === 8) return /^[01]\d{7}$/.test(digits) ? "UPC-E" : "EAN-8";
  if (digits.length === 12) return "UPC-A";
  if (digits.length === 13) return "EAN-13";
  if (digits.length === 14) return "GTIN-14 (ITF-14)";
  return null;
}
function symName(fmt) {
  const m = {
    QR_CODE: "QR Code", DATA_MATRIX: "DataMatrix", PDF_417: "PDF417", AZTEC: "Aztec",
    CODE_128: "Code 128", CODE_39: "Code 39", CODE_93: "Code 93", CODABAR: "Codabar",
    EAN_13: "EAN-13", EAN_8: "EAN-8", UPC_A: "UPC-A", UPC_E: "UPC-E",
    ITF: "ITF-14", MAXICODE: "MaxiCode", MANUAL: "Manual input", OCR: "OCR text"
  };
  return m[fmt] || (fmt ? String(fmt).toUpperCase().replace(/_/g, " ") : null);
}

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
  ["Sunflower Cooking Oil 5L", "GoldenFields", "goldenfields", "Oils & Fats"],
  ["Extra Virgin Olive Oil 1L", "MareTre", "olive-md", "Oils & Fats"],
  ["Corn Oil 2L", "GoldenFields", "goldenfields", "Oils & Fats"],
  ["Soybean Fine Oil 3L", "SunRay Mills", "sunray", "Oils & Fats"],
  ["Cooking Oil 750ml", "CleaPure", "cleapure", "Oils & Fats"],
  ["Sparkling Cola 330ml", "BlueBurst", "blueburst", "Beverages"],
  ["Orange Juice 1L", "BlueBurst", "blueburst", "Beverages"],
  ["Natural Spring Water 500ml", "AquaVale", "aquavale", "Beverages"],
  ["Whole Milk 1L", "DairyHigh", "dairyhigh", "Dairy"],
  ["Margarine 500g", "DairyHigh", "dairyhigh", "Dairy"],
  ["Peanut Butter 400g", "NutRich", "nutrich", "Food"],
  ["White Sugar 1kg", "SugArc", "sugarc", "Food"],
  ["Maize Meal 10kg", "MillGood", "millgood", "Food"],
  ["Rice 5kg", "TRA Foods", "trafoods", "Food"],
  ["Cooking Salt 500g", "SaltLine", "saltline", "Food"],
  ["Bath Soap 3-pack", "Sudzy", "sudzy", "Home Care"],
  ["Shampoo 250ml", "CleaPure", "cleapure", "Personal Care"],
  ["Hand Soap 500ml", "CleaPure", "cleapure", "Personal Care"]
];
const CONSUMER_DB = {};
(function buildConsumerDb() {
  CONSUMER_ITEMS.forEach((it, i) => {
    const body = "2000" + String(i + 1).padStart(8, "0");
    CONSUMER_DB[body + gtinCheckDigit(body)] = { name: it[0], brand: it[1], mfr: it[2], category: it[3] };
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

/* Seed requisitions + AOG queue */
function seedData() {
  const base = [
    { pn: "BRG-27-230", qty: 2, wo: "WO-24490", reg: "Z-WQA", by: "T. Ndlovu", step: 3, urgency: "HIGH", t: 14 },
    { pn: "GST-304-88", qty: 1, wo: "WO-24497", reg: "Z-WRH", by: "T. Ndlovu", step: 2, urgency: "HIGH", t: 9 },
    { pn: "SEAL-74-061", qty: 4, wo: "WO-24501", reg: "Z-WPV", by: "T. Ndlovu", step: 1, urgency: "ROUTINE", t: 6 },
    { pn: "GEN-24-410", qty: 1, wo: "WO-24505", reg: "Z-WQA", by: "T. Ndlovu", step: 1, urgency: "ROUTINE", t: 4 }
  ];
  base.forEach((b) => addReq(b.pn, b.qty, b.wo, b.reg, b.urgency, b.step, b.t));
  // Active AOG
  STORE.aog.push({ ref: "AOG-88214", pn: "BSC-64-73221", reg: "Z-WPV", wo: "WO-24518", urgency: "AOG", step: 0, t: 8 });
  pushEvent("AOG","AOG-88214 raised for Z-WPV — brake assembly required, aircraft on ground","danger",now());
}

let reqSeq = 24460;
function addReq(pn, qty, wo, reg, urgency, step = 0, t = 0) {
  const r = { ref: `REQ-${reqSeq++}`, pn, qty, wo, reg, urgency, step, t, by: "T. Ndlovu", created: now() };
  STORE.reqs.push(r);
  return r;
}

/* ---------------- Notifications ---------------- */
const NOTIFS = [
  { dot: "var(--red)", txt: "AOG-88214 — part BSC-64-73221 now Requested. Aircraft Z-WPV grounded.", time: "2m ago" },
  { dot: "var(--amber)", txt: "Shelf-life: WHB-32-881 expires in 22 days — quarantined.", time: "18m ago" },
  { dot: "var(--accent-2)", txt: "AI forecast: stockout of CSK-740-77 predicted in 9 days.", time: "41m ago" },
  { dot: "var(--green)", txt: "REQ-24462 Issued, awaiting installation on Z-WRH.", time: "1h ago" }
];
function renderNotifs() {
  $("notifList").innerHTML = NOTIFS.map((n) => `
    <div class="notif-item"><i class="n-dot" style="background:${n.dot}"></i>
      <div>${n.txt}<small>${n.time}</small></div></div>`).join("");
}
function flashNotif() {
  const dot = $("notifDot");
  setTimeout(() => dot.style.opacity = "1", 100);
  setTimeout(() => dot.style.opacity = "0", 2600);
}

/* ---------------- Toasts ---------------- */
function toast(kind, title, msg) {
  const ic = { ok: "&#10003;", warn: "!", info: "i", danger: "!" };
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.innerHTML = `<div class="t-ic">${ic[kind] || "i"}</div><div><b>${title}</b><small>${msg}</small></div>`;
  $("toasts").appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .4s"; setTimeout(() => el.remove(), 400); }, 3600);
}

function pushEvent(kind, title, msg, tone) {
  STORE.events.push({ kind, title, msg, tone, icon: { ok: "&#10003;", warn: "!", info: "i", danger: "!" }[kind] || "i", time: now() });
}

/* ---------------- Auth ---------------- */
let session = null;

function doLogin(user, pass) {
  const u = STORE.users.find((x) => x.user.toLowerCase() === user.toLowerCase() && x.pass === pass);
  if (!u) {
    if (!$("loginUser").value) $("userErr").textContent = "Enter a username.";
    else $("userErr").textContent = "Unknown user.";
    if (!$("loginPass").value) $("passErr").textContent = "Enter a password.";
    else $("passErr").textContent = "Incorrect password. Use a demo role card.";
    return;
  }
  session = u;
  $("loginScreen").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("userName").textContent = u.name;
  $("userRole").textContent = u.title;
  $("avatar").textContent = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  renderNav();
  route(location.hash || "#dashboard");
  toast("ok", `Welcome back, ${u.name.split(" ")[0]}`, `Signed in as ${u.title}`);
  seedData();
  renderNotifs();
}

function renderNav() {
  const nav = $("sideNav");
  const menu = {
    stores: [
      { s: "Operations", items: [["#dashboard","Dashboard","&#9678;"],["#inventory","Inventory","&#9745;"],["#bins","Bin Map","&#9642;"],["#aog","AOG Desk","&#9888;", "aogBadge"],["#requisitions","Requisitions","&#8674;"],["#reports","Analytics","&#9661;"]] },
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
  assistant: () => viewAssistant()
};

function route(hash) {
  const key = (hash || "#dashboard").replace("#", "");
  document.querySelectorAll(".nav-link").forEach((b) => b.classList.toggle("active", b.dataset.href === "#" + key));
  const titles = { dashboard: "Operations Dashboard", inventory: "Inventory Control", bins: "Digital Bin & Storage Mapper", aog: "AOG Response Desk", requisitions: "Requisitions", forecast: "AI Predictive Intelligence", compliance: "Compliance & Certificates", passport: "Blockchain Parts Passport", reports: "Analytics & Reports", assistant: "AI Assistant" };
  $("pageTitle").textContent = titles[key] || "Dashboard";
  const view = VIEWS[key] || viewDashboard;
  $("content").innerHTML = `<div class="view-head"><div class="view-title"><h2>${titles[key] || "Dashboard"}</h2><p id="viewSub"></p></div><div class="view-actions" id="viewActions"></div></div><div id="viewBody"></div>`;
  view();
}

/* ---------------- Shared builders ---------------- */
function viewDashboard() {
  const aogActive = STORE.aog.filter((a) => a.step < 3);
  const lowStock = STORE.parts.filter((p) => p.stock < p.min);
  const risk = STORE.parts.filter((p) => p.life === "EXPIRING").length;
  const stockValue = STORE.parts.reduce((s, p) => s + p.stock * p.unit, 0);
  const spark = (vals, g) => vals.map((v) => `<i class="${g ? "g" : ""}" style="height:${v}%"></i>`).join("");
  $("viewBody").innerHTML = `
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

let globalSearchValue = "";
$("globalSearch").addEventListener("input", (e) => {
  globalSearchValue = e.target.value;
  if (location.hash === "#inventory") viewInventory();
});

/* ---------------- Transfer modal ---------------- */
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

/* ---------- Core intelligence ---------- */

function norm(s) { return String(s || "").toUpperCase().replace(/[\s\-_.:\/]/g, ""); }
function low(s) { return String(s || "").toLowerCase(); }

function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const d = [];
  for (let i = 0; i <= m; i++) {
    d[i] = new Array(n + 1).fill(0);
    d[i][0] = i;
    if (i === 0) for (let j = 0; j <= n; j++) d[0][j] = j;
  }
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
  }
  return d[m][n];
}

function extractPN(text) {
  const t = String(text || "").toUpperCase().replace(/\s+/g, " ").trim();
  const re = /\b[A-Z]{2,6}[\s-]?\d{1,4}[\s-]?\d{2,6}\b|\b\d{4,5}[\s-]?\d{3,6}\b/g;
  return (t.match(re) || []).map((x) => x.replace(/\s+/g, "-"));
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

/* ---------- Result rendering ---------- */

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
  return `<div class="co-card co-consumer">
    <div class="co-head">🛒 PRODUCT INTELLIGENCE <span>// ANY BARCODE</span></div>
    <div class="co-body">
      <div class="co-crest co-retail">🛒</div>
      <div>
        <div class="co-name">${esc(p.name)}</div>
        <div class="co-meta">${esc(p.brand)} &middot; ${esc(p.category)} &middot; origin ${esc((a.company && a.company.company ? flagOf(a.company.company.country) + " " + a.company.company.country : "traced"))}</div>
      </div>
      <span class="tag violet">RETAIL ITEM</span>
    </div>
    <div class="co-focus"><span class="tag warnb">SAMPLE REGISTRY</span><span class="tag info">GS1 item of ${esc(p.brand)}</span><span class="tag neutral">Valid GTIN</span></div>
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
  /* origin-only trace for unknown external codes */
  return `<div class="co-card co-origin">
    <div class="co-head">🛰️ ORIGIN TRACE <span>// AI</span></div>
    <div style="font-size:12.5px;line-height:1.6;padding:12px">Barcode <b>read successfully</b> — retail / global trade item, origin traced to <b>${esc(co.origin)}</b>${co.gtin ? ` (GS1 prefix <span class="pn">${esc(co.gtin.replace(/^0(?=\d{13}$)/, "").slice(0, 3))}…</span>)` : ""}. Maker not in local registry — hold the label to the camera (Super Scan AI) or scan a GS1 / QR-JSON payload to identify the company.</div>
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

/* ---------------- Live simulation loop ---------------- */
function liveLoop() {
  STORE.aog.forEach((a) => { a.t++; });
  STORE.reqs.forEach((r) => { r.t++; });
  $("clock").textContent = fmtTime(now());
  if (location.hash === "#dashboard" && $("activityFeed")) $("activityFeed").innerHTML = activityFeedHTML();
  if (location.hash === "#aog" && $("aogLog")) $("aogLog").innerHTML = activityFeedHTML();
  const badge = $("aogBadge");
  if (badge) badge.textContent = STORE.aog.filter((a) => a.step < 3).length;
}

setInterval(liveLoop, 1000);
setInterval(flashNotif, 15000);

/* ---------------- Login bindings ---------------- */
document.querySelectorAll(".role-card").forEach((c) => {
  c.addEventListener("click", () => {
    document.querySelectorAll(".role-card").forEach((x) => x.classList.remove("active"));
    c.classList.add("active");
    $("loginUser").value = c.dataset.user;
    $("loginPass").value = c.dataset.pass;
    $("userErr").textContent = ""; $("passErr").textContent = "";
  });
});

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  doLogin($("loginUser").value.trim(), $("loginPass").value);
});

$("scanBtn").addEventListener("click", openScanner);

$("logoutBtn").addEventListener("click", () => {
  session = null;
  $("app").classList.add("hidden");
  $("loginScreen").classList.remove("hidden");
  $("content").innerHTML = "";
  location.hash = "";
  toast("info", "Signed out", "Session ended securely.");
});

$("notifBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const p = $("notifPanel");
  p.classList.toggle("hidden");
  if (!p.classList.contains("hidden")) { $("notifDot").style.opacity = "0"; renderNotifs(); }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#notifPanel") && !e.target.closest("#notifBtn")) $("notifPanel").classList.add("hidden");
});

window.addEventListener("hashchange", () => route(location.hash));

/* init clock */
setInterval(() => { $("clock") && ($("clock").textContent = fmtTime(now())); }, 1000);

/* debug / console handle for demos */
if (typeof window !== "undefined") window.TSLMS = { STORE, get session() { return session; } };