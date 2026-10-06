# Engineering quality enhancements — research and implementation

Research date: 6 October 2026. Scope: a single Air Zimbabwe themed presentation demo with functional browser records.

| Engineering problem | Research basis | Implemented response |
|---|---|---|
| Maintenance teams select overdue equipment or cannot locate its certificate | [EASA Tools & Equipment guide](https://www.easa.europa.eu/en/downloads/137306/en) addresses equipment control, calibration and retained references. | Tool register, dated certificate history, laboratory and master-standard references, calibration conditions, uncertainty and tolerance. Scheduled work checks tool validity at completion; starting work checks current validity. |
| A calibration looks acceptable after adjustment but earlier work may be affected | Calibration evidence must distinguish measurement results and fitness for purpose; [NIST traceability policy](https://www.nist.gov/calibrations/traceability) explains the documented calibration chain and the role of uncertainty. | Separate as-found and as-left results. An as-found failure opens an impact review against started/completed work since the preceding calibration. Open impact reviews and failed as-left results prevent controlled use. |
| An inspection stamp remains visible after engineers change life counters | [FAA AC 120-16F](https://www.faa.gov/documentlibrary/media/advisory_circular/ac%20120-16f.pdf) describes total-life and overhaul-status maintenance records. | Inspector evidence references and recorded counter snapshots. Changes to identity, counters, limits, location or release reference mark the prior review stale. Discrepancies remain open through counter changes until a subsequent inspector review reconciles the record. Exhausted components cannot receive a verified life review. |
| A component passes a stores check but its life evidence has not been reconciled | Separate identity/condition checks from life-record assessment. This is our workflow design inference, not a quoted regulation. | Installation requires both the existing stores quality inspection and a current independent life review. A recorded life discrepancy appears as an aircraft quality hold and in planned-flight assessment. |
| Fluid contamination or hidden damage findings become disconnected from aircraft maintenance | [Lufthansa Technik laboratory services](https://www.lufthansa-technik.com/en/laboratory-services) describes fluid monitoring, compatibility and failure investigations, flammability and NDT. | Serial-linked requests for fluid/material investigations and UT, ET, PT, MT, TT and RT. Request → sample custody → report → inspector disposition. Adverse reports create maintenance review holds; inspector disposition creates a grounded technical defect for an installed component. Follow-up lab evidence and defect rectification stay separate. |
| Records are scattered and hard to hand over | [ICAO electronic maintenance records guidance page](https://www.icao.int/operational-safety/normal-airworthiness) discusses electronic records and integrity, security and transferability challenges. | Browser persistence, actor/time/reference history and a versioned JSON record pack containing fleet, component life, movements, maintenance plans, defects, calibration, inspections and laboratory records. |

## Presentation walkthrough

1. Sign in as Quality Inspector (`k.moyo` / `insp123`). Open **Calibration**. The seeded torque tool is due soon; missing certificates and out-of-service equipment are visible.
2. Record a demo torque certificate with as-found error 5, uncertainty 1 and tolerance 4, but as-left error 0. An impact review blocks use even though the adjusted result passes. Record an evidence-based disposition to close the impact review.
3. Open **Life Inspection** and inspect a component against sample logbook evidence. Review TSO/CSO separately from TSN/CSN. Log an engineer usage update, then return as inspector: the earlier review is marked changed.
4. Open **Laboratory & NDT**, create a fluid analysis request, record sample custody and an adverse report, then record inspector disposition. The aircraft technical log receives a linked defect. Engineers can record follow-up work through the existing technical log.
5. Use **Export record pack** to retain the connected evidence for presentation or handover.

## Practical limits and next implementation stage

All seeded aircraft, equipment limits, certificates and measurements are demonstration values. The example decision rule is `absolute error + expanded uncertainty <= permitted tolerance`, with common units. The approved laboratory decision rule, actual measurement points, OEM limits and equipment-specific control policy must replace these assumptions for operational use. Lifting equipment inspection requirements differ from measuring-instrument calibration; the demo uses a generic controlled-tool gate.

This records external laboratory work; it does not perform physical testing, diagnose NDT results, prove metrological traceability, issue release certificates or extend life limits. A C-check, overhaul interval and mandatory retirement life are different concepts and require the actual approved maintenance programme and component data.

Production work requires a shared database, controlled document attachments and revisions, verified personnel authorisations, authenticated signatures, record-retention policy, backups, migration validation and authority/organisation approval. Client demo role checks and local audit arrays are editable and are not secure signatures or immutable records. Export is provided; validated import/restore is not implemented.

## Verification

Automated domain tests cover calibration boundaries, uncertainty, expiry, missing certificates, as-found impact lookup, as-left failures, date validation, inspector snapshot invalidation, persistent discrepancies, flight holds, installation gates and persistence. Browser checks cover calibration entry/disposition, life inspection, laboratory custody/report/disposition and linked defect creation.
