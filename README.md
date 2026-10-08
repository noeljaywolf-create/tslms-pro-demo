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
All aircraft identities, component limits, certifications, dates and demand are simulated. Fleet, component logs, profiles and resource plans persist in this browser through localStorage. This is local demo storage, not a multi-user database. Recording aircraft utilisation updates installed component counters only, not components in stores. Alerts use the earliest exhausted hour, cycle or calendar limit. The demo does not provide aircraft release approval or certified maintenance limits.

Deploy to GitHub Pages by uploading the source to the existing repository and publishing its root. 

## Airport engineering demonstration
One login and one web application bring stores, fleet and resource planning together. Resource planning reserves an aircraft, engineer, bay and tool in a time window, rejects overlaps, and tracks scheduled / in-progress / complete work. Individual demo profiles own their log entries. Engineer-only technical forms update hours, cycles and flights since overhaul; total since-new usage remains separate and cannot be reset by an overhaul. Lifetime, overhaul and calendar limits all contribute to alerts. Flights are assumed equal to flight cycles for the utilisation demo.

Digital tags mirror the fields in the supplied Air Zimbabwe serviceable-tag examples: origin job, description, PN, serial, ATA, rectification, mod state, usage, removal limits, release reference/date/authority and fitted-to aircraft. Ambiguous handwriting was not copied; seeded values are fictional. Tags do not represent an authorised release.

Demo engineers: t.ndlovu / eng123 and p.chirwa / eng123. Every demo account has its own profile. Client-side role checks are a workflow demonstration, not production authentication.

Research reference: [EASA technical records guidance](https://www.easa.europa.eu/en/the-agency/faqs/technical-records), [EASA continuing airworthiness records](https://www.easa.europa.eu/en/document-library/easy-access-rules/online-publications/easy-access-rules-continuing-airworthiness?erules-id=ERULES-1963177438-1031). Total life and time since scheduled maintenance/overhaul are separate; component removal limits are separate from aircraft C-check planning.

## Functional engineering workflows
- Serialised component receipt creates a quarantined serial excluded from usable stock; Quality Inspector inspection is required before installation. Exhausted limits block approval and installation. Occupied aircraft positions block duplicate fitment. Removal returns the serial to quarantine, preserves counters, without adding usable stores stock.
- Technical log tracks open defects and engineer rectification records. Grounded defects and scheduled checks contribute to aircraft technical holds.
- Maintenance Outlook computes removal dates from adjustable planning rates (initial assumptions: 4 flight hours and 2 cycles/day), calendar limits and recorded remaining life; it drafts resource plans. Planned-flight assessments check the aircraft, active holds, open defects, and component limits. No dispatch approval is produced.
- Export technical records downloads a JSON snapshot of the current fleet, component records, plans, movements, defects and audit history. Workflow data persists in localStorage on this browser; this is not a shared operational database.
- The color palette uses green, gold, red and black inspired by the [official Air Zimbabwe logo](https://www.airzimbabwe.aero/wp-content/uploads/2026/03/air-zim-logo.png). UI hex values are contrast-adjusted approximations, not official brand-guide specifications.

Presentation workflow: Stores Controller receives a component → Quality Inspector records inspection → Engineer installs it → Engineer records aircraft utilisation → Maintenance Outlook recalculates due dates → remove the component when needed and view the custody log. Demo accounts: m.faith / stores123, k.moyo / insp123, t.ndlovu / eng123.

## Calibration, independent life inspection and laboratory workflows

The Assurance menu now includes Calibration, Life Inspection, and Laboratory & NDT. Calibration holds gate planned work and work starts. As-found failures open an affected-work review; as-left failures remain blocked. Inspectors record supporting evidence and component counter snapshots; changes make a verified review stale, and unresolved discrepancies create quality holds. Fitment requires a current life review. Serial-linked lab requests track custody, reports and disposition, with adverse findings connected to technical defects.

Export record pack includes these records as JSON. Records persist in the current browser. Equipment limits, certificates and screening measurements are demo values; external laboratory testing and approved maintenance data remain required.

Run `node tests/quality.cjs` and `node tests/technical.cjs` for domain verification. Research: [Lufthansa Technik laboratory services](https://www.lufthansa-technik.com/en/laboratory-services), [NIST traceability](https://www.nist.gov/calibrations/traceability), [EASA equipment guide](https://www.easa.europa.eu/en/downloads/137306/en), [FAA maintenance programmes](https://www.faa.gov/documentlibrary/media/advisory_circular/ac%20120-16f.pdf), and [ICAO electronic maintenance records](https://www.icao.int/operational-safety/normal-airworthiness).


Connected department workflow: see [DEPARTMENT-WORKFLOW.md](DEPARTMENT-WORKFLOW.md). Stores intake now requires records verification and inspection, and new serials follow authorised work-package issue and fitment. Run node tests/chain.cjs for the connected handoff tests.
