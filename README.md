# TSLMS — Aircraft Engineering Workspace

Static, offline-capable demonstration for aircraft engineering and technical stores.

## Modules
- Engineering overview: technical holds, component alerts, stores shortages and activity.
- Fleet management: aircraft records, maintenance tasks and utilisation entry.
- Component life: serial-level flight hours, cycles and calendar limits, search, status filters and CSV export.
- ATA chapters: linked parts, supply shortages, tracked component alerts and requisitions.
- Logistics intelligence: existing Holt demand model, supply priorities and prefilled requisition drafts.
- Technical stores, bin mapping, AOG response, requisitions, scanning, compliance and parts traceability.

Retail / food catalogue and financial dashboard / reports were removed. Legacy retail and reports links redirect to stores and logistics.

## Run
Serve this directory with a static HTTP server, or open index.html. There is no build step. The scanner needs HTTPS or localhost for camera access.

Select a demo role and sign in: m.faith / stores123, t.ndlovu / eng123, k.moyo / insp123.

## Data boundaries
All aircraft identities, component limits, certifications, dates and demand are simulated. The counters and utilisation edits are held in memory and reset on refresh. Recording aircraft utilisation updates installed component counters only, not components in stores. Alerts use the earliest exhausted hour, cycle or calendar limit. The demo does not provide aircraft release approval or certified maintenance limits.

Deploy to GitHub Pages by uploading the source to the existing repository and publishing its root. This local revision has not been pushed or deployed.
