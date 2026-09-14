/* ============================================================
   codes.js — code-resolution index + GS1 / GTIN / EAN / UPC decoding
   ============================================================ */
"use strict";

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
