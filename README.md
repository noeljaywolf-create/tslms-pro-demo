# TSLMS Pro — Aviation Technical Stores & Logistics Intelligence

Professional, fully-interactive product simulation of an intelligent aviation technical stores platform for Air Zimbabwe. **100% static** — no server required — free to host on **GitHub Pages**.

## What's inside (Pro version)

- **Role-based sign-in** with three demo accounts:
  - `m.chikumba` / `stores123` — Stores Controller (full operations)
  - `t.ndlovu` / `eng123` — Maintenance Engineer (maintenance + intelligence)
  - `k.moyo` / `insp123` — Quality Inspector (compliance + audit)
- **Role-aware navigation** — each role sees only its relevant modules
- **Operations Dashboard** — 6 animated KPIs + 4 live charts + activity feed
- **Inventory Control** — live searchable parts ledger with release certs and reorder flags
- **Digital Bin & Storage Mapper** — clickable ATA colour-coded rack/bin grid (Module 1)
- **AOG Response Desk** — kanban board (Requested → Picked → Issued → Installed) (Module 3)
- **Requisitions** — full ledger + create modal
- **AI Predictive Intelligence** — LightGBM + LSTM forecast charts and reorder suggestions (Module 6)
- **Compliance & Certificates** — shelf-life control, FOD log, legal e-releases (Module 4)
- **Blockchain Parts Passport** — chain-of-custody viewer (Module 7)
- **Executive Analytics** — spend, fill-rate, AOG cost-avoidance + CSV export
- **Intelligent Scanner** — three AI-powered modes:
  - **Smart Auto** — continuous barcode/QR decoding from camera (works over HTTPS on GitHub Pages)
  - **AI OCR** — Tesseract.js reads part numbers, serials and QR text straight off printed labels (no barcode needed), fuzzy-matched to inventory with a confidence score
  - **Manual entry** — smart lookup with nearest-part suggestions when no exact match exists
- **AI fuzzy matching engine** — Levenshtein-based part resolution: typos, OCR confusions and prose (`p/n BSC 64 73221 wheel brake`) still resolve to the right part with an `AI MATCH` confidence badge
- **Smart actions** — after any scan: Issue part, Raise AOG, or Register new part, right from the result sheet
- **AI Assistant** (`AI Assistant` in the side nav) — natural-language interface to the store:
  - **Real NLP intent engine** — understands "how much stock of brakes?", "forecast demand for pumps", "any AOG right now?", "order 2 GST-304-88 urgent", "issue 1 SEAL-74-061 to Z-WPV", "summary please"
  - **Live model output** — Holt's-trend demand forecasts with stockout-day estimates and anomaly flags, rendered inline
  - **Approved actions** — AI drafts requisitions, AOG raises and line issues; the store is never mutated until you click **Approve**
- **TSLMS AI Core** (`ai.js`) — real client-side algorithms, reproducible and deterministic:
  - Seeded demand model (mulberry32) → 12 weeks of per-part history
  - Holt's linear-trend forecast (double exponential smoothing) with RMSE
  - Rolling z-score anomaly detection
  - Reorder intelligence — risk tiering (HIGH/MEDIUM/LOW/HEALTHY), days-to-stockout, suggested order quantity
- **AI Forecast view rebuilt on the live model** — every part is risk-ranked from computed forecasts (no hardcoded numbers), with the top-risk part charted against safety stock
- **Fully responsive** — mobile layouts for login, KPIs, kanban (horizontal scroll), tables, bin map and scanner

## Run locally

Open `index.html` in any browser. No build step and **no internet required** — Chart.js is bundled locally in `vendor/`.

## Project structure

```
tslms-demo/
  index.html            # App shell + login
  styles.css            # TSLMS Pro UI kit
  app.js                # Router, auth, simulated AI + live workflow + intelligent scanner
  ai.js                 # TSLMS AI Core — demand model, Holt forecast, anomalies, reorder engine, NLP intent engine + assistant
  vendor/
    chart.umd.min.js    # Chart.js 4.4.3 (local copy — no CDN needed)
    html5-qrcode.min.js # Barcode/QR camera scanner (local copy)
    tesseract/          # AI OCR engine (local, offline)
      tesseract.min.js  # Tesseract.js API
      worker.min.js     # OCR worker
      tesseract-core-simd.wasm(.js)  # WASM inference core
      eng.traineddata.gz# English language model
```

> **OCR note:** the first Snapshot & Read loads ~12 MB of OCR engine (one-time, cached by the browser). Everything is local — no internet needed after files are in place.

> **AI note:** the whole intelligence layer is deterministic and offline — forecasts are recomputed live from the seeded demand model, and the assistant's numerical answers are real arithmetic on the current `STORE`, not canned text.

> **Scanning note:** the camera needs a **secure context (HTTPS)**. GitHub Pages is HTTPS, so it works there. The demo always falls back to **manual entry** if the camera is unavailable, and AI OCR still works on `file://` for pasted text via Manual.

## Host on GitHub Pages (free)

1. Create a repo (e.g. `tslms-pro-demo`)
2. Push `index.html`, `styles.css`, `app.js`, `README.md` to `main`
3. Repo **Settings → Pages** → Source: *Deploy from a branch* → branch `main`, root `/`
4. Live at `https://<your-username>.github.io/tslms-pro-demo/`

## Stack reference (production target)

The demo simulates the production architecture: TypeScript/Next.js SPA + Python FastAPI AI core (LightGBM + PyTorch LSTM forecasting), PostgreSQL + pgvector, LangGraph orchestration, Hyperledger Fabric passport, Azure/AKS, Langfuse observability.

_Simulated data for demonstration only — no real inventory records are used._