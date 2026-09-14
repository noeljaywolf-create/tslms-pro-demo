/* ============================================================
   TSLMS Pro — Aviation Technical Stores Intelligence Platform
   core.js  — global DOM helpers, catalogue seed, code utilities
   100% client-side · GitHub Pages ready
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
