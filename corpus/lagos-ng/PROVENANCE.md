# Corpus provenance — Lagos jurisdiction pack

All legal answers in Ẹ̀TỌ́ ground against the two documents below. They are versioned in this
repo and hashed; they are **not** re-scraped at runtime.

## 1. Law in force

**Tenancy Law, Cap. T1, Laws of Lagos State 2015** (originally enacted as Law No. 14 of 2011).

Naming note (verified 2026-09-17): sources refer to this statute both as the "Lagos State
Tenancy Law 2011" and as the "Tenancy Law of Lagos State 2015". They are the same statute —
enacted 24 August 2011, published in Lagos State Official Gazette No. 37, Vol. 44 of
26 August 2011, and later codified as Cap. T1 in the 2015 revised Laws of Lagos State.
We cite it the way the 2025 bill's own repeal clause does (clause 44: "The Tenancy Law
Cap. T1 Laws of Lagos State 2015 is repealed"), since that is the authoritative reference.

| | |
|---|---|
| Source | Lagos State Ministry of Justice |
| URL | http://lagosministryofjustice.org/wp-content/uploads/2022/01/Tenancy-Law-2011.pdf |
| Retrieved | 2026-09-17 |
| File | `sources/tenancy-law-2011.pdf` (13 pp., gazette supplement) |
| SHA-256 | see `statute/tenancy-law-2011.json` → `source_sha256` |
| Status | `IN_FORCE` |

Geographic scope (s.1(3), verified against the gazette text): the Law does **not** apply in
Apapa, Ikeja GRA, Ikoyi, and Victoria Island. s.1(2) also excludes institutional housing
(student/staff housing, emergency shelter, care facilities, hospitals). Coverage is therefore
location-dependent — the triage flow must ask where the premises are.

## 2. Bill in progress

**Lagos State Tenancy and Recovery of Premises Bill, 2025** (draft, 45 clauses).

| | |
|---|---|
| Source | Lagos State House of Assembly (full text published on the Assembly site) |
| URL | https://lagoshouseofassembly.gov.ng/home/lagos-state-tenancy-and-recovery-of-premises-bill-2025-draftlagos-state/ |
| Retrieved | 2026-09-17 |
| File | `sources/bill-2025-assembly.html` (raw), `sources/tenancy-bill-2025.txt` (body text) |
| SHA-256 | see `bill/tenancy-bill-2025.json` → `source_sha256` |
| Status | `PROPOSED_COMMITTEE` — second reading 10 Jul 2025, Committee on Housing, public hearing Aug 2025; still at committee as of 2026-09-17 |

The bill's clause 2 extends application to all premises in the State (removing the 2011 Law's
area exemptions); clause 44 repeals Cap. T1.

## 3. Extraction pipeline

`tools/split_corpus.py` converts the raw source files into section-level JSON
(`statute/tenancy-law-2011.json`, `bill/tenancy-bill-2025.json`). The 2011 PDF's embedded
text layer has OCR-style artifacts (mid-word spaces, occasional digit-for-letter, e.g.
"faci1ities"); each section carries `"review": "machine-extracted, pending manual proofread"`
until proofread against the PDF. Completeness is validated in-script: 49/49 sections,
45/45 clauses.

## 4. Named bodies — contact information

- **Citizens Mediation Centre** offices and phone numbers: taken verbatim from the Lagos
  State Ministry of Justice page (https://lagosministryofjustice.org/citizens-mediation-centre/),
  verified 2026-09-17. Rendered in the app with a "contacts verified" stamp.
- **LASRERA**: official site (https://lasrera.lagosstate.gov.ng/) was unreachable at
  verification time. We record only its URLs (site + Practitioner Search) and omit phone
  numbers that could not be read from an official page. `contact_verified: null` in
  `bodies.json` marks this honestly.
- **Lagos Judiciary** portal URL checked reachable 2026-09-17.

## 5. Secondary sources (status and dates only, never legal statements)

- Lagos State House of Assembly news pages — legislative stage
- Premium Times, Channels TV — stage and dates; where press figures conflict
  (e.g. agency fee reported as both 10% of rent and 5% of annual rent), the primary text
  governs: bill clause 3(4) says **5% of one year's rent**.
