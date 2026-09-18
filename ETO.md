# Ẹ̀TỌ́

**Know the law that actually applies to you today.**

A tenancy rights assistant for Lagos. It separates the law in force from the bill in
progress, cites the exact section behind every answer, and ends with a concrete next
step: a date, a named body, and a document you can send.

> *Ẹ̀tọ́* (Yoruba): right, entitlement, what is due to you.

---

## 1. Submission metadata

| Field | Value |
|---|---|
| Hackathon | OSF × Andela, "Information you can trust" |
| Primary track | Transparency & Accountability |
| Secondary track | Stability & Social Cohesion |
| Submission type | Cross-track |
| Participant | Mohammed Firdous (individual) |
| Deadline | 21 September 2026, 23:59 UTC |

### Why cross-track

The core of the project is Transparency & Accountability: it makes an opaque legal
regime legible and holds the gap between announced reform and enacted law open to
scrutiny.

The second track is Stability & Social Cohesion, whose brief names "resolving local
disputes" as its first use case. That is this product's spine: every answer routes
tenants and landlords toward mediation at the Citizens' Mediation Bureau before court,
and gives both sides the same verifiable text to argue from. The lock-out flow also
serves the Safety track (a persistent, on-device incident record with a printable log),
but the mediation path is the stronger and more complete second claim.

---

## 2. The problem

Lagos residents believe they have tenancy protections that do not legally exist.

Since mid 2025 the Lagos State Tenancy and Recovery of Premises Bill has been widely
reported: monthly rent options, caps on advance rent, caps on agency fees, criminalised
self-help eviction, faster courts. Headlines have run continuously for over a year.

**The bill is not law.** Second reading was 10 July 2025. It went to the House Committee
on Housing, had a public hearing in August 2025, and as of September 2026 it remains at
committee stage. It still needs a third reading and the Governor's assent. What governs
Lagos tenancies today is the **Tenancy Law, Cap. T1, Laws of Lagos State 2015**. It was
enacted on 24 August 2011 as Law No. 14 and is commonly called the "Lagos State Tenancy
Law 2011"; the 2015 name comes from its codification in the revised Laws of Lagos State.
We cite it the way the bill's own repeal clause does (clause 44: "The Tenancy Law
Cap. T1 Laws of Lagos State 2015 is repealed"). *Verified against the gazette PDF and
the Assembly's published bill text. See `corpus/lagos-ng/PROVENANCE.md`.*

The naming itself makes the case: a reasonably careful search returns two different
names for the law currently governing your tenancy. If that trips up lawyers writing
commentary, an ordinary tenant has no chance.

**And it does not govern every tenancy.** Section 1(3) exempts Apapa, Ikeja GRA, Ikoyi,
and Victoria Island from the Law entirely, and s.1(2) excludes institutional housing
(staff and student housing, emergency shelter, care facilities). The bill (clause 2)
drops the area exemptions and would apply uniformly across the State. So "which law
covers me" currently depends on where you live, a dimension the law-vs-bill panels and
the triage flow both handle.

The confusion compounds because the reported figures conflict across sources. The agency
fee cap has been reported as both 10% of rent and 5% of annual rent, and advance rent
limits are quoted inconsistently. There is no single place where a tenant can ask "does
this protect me today?" and get a sourced, dated answer.

The consequences are concrete. Lagos has no rent control; increases of 50% to 200%
happen at renewal. Tenants who do not know the notice periods under the current law
accept illegal evictions. Tenants who overtrust the headlines refuse to pay on the
assumption of a protection that has not passed, and lose.

### Who this is for

- **Primary:** renters in Lagos facing a rent increase, a quit notice, an agency fee, or
  a lock-out.
- **Secondary:** small landlords who want to stay compliant; community paralegals and
  NGO caseworkers handling tenancy complaints.

---

## 3. What it does

Four things, in order of build priority.

### 3.1 Law vs. bill status (the differentiator)

Every answer is split into two clearly separated panels:

- **In force today.** The Tenancy Law, Cap. T1, cited to section, including whether it
  applies at the user's location at all (s.1(3) exempts Apapa, Ikeja GRA, Ikoyi, and
  Victoria Island).
- **Proposed, not yet law.** The 2025 bill, cited to clause, with its current
  legislative stage and the date that stage was last verified.

The UI never merges them. A user must be unable to mistake a proposal for a protection.
This answers the brief's constraint directly: "Where information may change, consider
how users will know when it was last updated."

### 3.2 Situation triage

Rather than a chat box, the entry point is a small set of concrete situations:

- "My landlord increased my rent"
- "I was given a quit notice"
- "My landlord locked me out / removed my door"
- "An agent is charging me a fee"
- "I want to check if my agent is registered"

Each collects the minimum facts needed (tenancy type, date the notice was received,
amount, and area, because s.1(3) coverage depends on it) and nothing else.

### 3.3 Computed next step

This is what stops it being a chatbot. Output is not a paragraph. It is:

- **A computed date.** Notice to quit is 6 months for a yearly tenancy and 1 month for a
  monthly tenancy, under both the current law and the draft bill. Given a notice date
  and tenancy type, the tool returns the earliest lawful date of recovery and flags a
  notice that is short.
- **A named body.** The Citizens' Mediation Bureau for disputes; LASRERA for agent
  registration and complaints; the Magistrate Court for recovery proceedings; the Small
  Claims Court for recovering money. With what to bring: proof of rent payment and
  updated utility bills are expected before proceedings.
- **A generated document.** A plain-language response letter, complaint draft, or case
  file, filled with the user's dates and figures, downloadable as text. English plus
  Nigerian Pidgin.

### 3.4 Incident log (the safety leg)

For lock-outs and threats: a timestamped incident record kept in the browser's local
storage, producing a printable log the user can take to mediation. No account required,
stored on the device only, nothing uploaded. The user can delete all records with one
tap.

---

## 4. Architecture

Keep it small enough to finish and explain.

```text
Client (Next.js, text first, offline capable)
  situation triage · dual panel answers · documents
        |
Answer layer
  retrieval over the corpus (cited, top k)
  deterministic rules engine (dates, notices)
  refusal when no citation is found
        |
Jurisdiction pack (swappable)
  statute · pending bill · bodies · myths · changes ledger · templates
  status and as-of dates · pack manifest
        |
Ingestion (offline jobs, Firecrawl)
  bill status refresh · agency page verification · reporting
```

**The jurisdiction pack is the scalability story.** Everything Lagos-specific lives in
one directory: the statute text, the pending bill text, the named bodies with contact
routes, the myths, the changes ledger, the language files. Porting to Nairobi or Accra
means authoring a new pack, not rewriting the engine. `corpus/PACK-AUTHORING.md` records
what that takes, and `corpus/abuja-ng/` is an honestly labelled skeleton of the second
pack.

### Stack

Next.js and TypeScript. The corpus ships with the client as JSON, so the app is a
static site with no runtime backend and no runtime AI model. Firecrawl handles offline
ingestion jobs. Novelty belongs in the idea, not the toolchain.

---

## 5. Firecrawl: where it fits and where it does not

**Use it as an offline ingestion tool, never in the request path:**

- Answers must be grounded in a fixed, reviewed corpus. A page that changes shape must
  not change what the law says.
- Low-bandwidth users need cached content, not a synchronous fetch.

**Jobs it has actually done for this project:** a status check of the Assembly's bill
page with a human-confirmation rule for stage changes (`tools/refresh_status.py`);
verification of the Citizens' Mediation Bureau contact pages, which caught two official
sites disagreeing; tracing the press's "10%" agency fee figure to a government statement
of June 2025; confirming the LASRERA domain is down from more than one network.

**Handle the authoritative texts separately.** The current law and the draft bill come
from gazette and Assembly sources, versioned in the repo with hashes. They are the spine
of every citation and are never re-scraped between demo and judging.

A note from experience: Firecrawl's keyless tier rejected our network, so the corpus was
first acquired with plain fetches, and Firecrawl was added later with an API key for the
verification jobs above. The write-up tells that story honestly.

---

## 6. Trust and accuracy design

The brief scores this heavily. Four rules:

1. **No uncited claim ships.** Every legal statement carries a section or clause
   reference and a link to the source text. If retrieval returns nothing above
   threshold, the system says it does not know and routes to a human body.
2. **Status is a first-class field, not prose.** `IN_FORCE` and `PROPOSED_COMMITTEE`,
   each with an as-of date. The UI renders the stamp on every panel.
3. **Conflicting secondary reports are surfaced, not averaged.** Where the press
   disagrees on a figure, show the disagreement and defer to the primary text.
4. **Not legal advice.** Persistent and visible in the UI at the point of download.
   The disclaimer addresses the user, so it does not appear inside the letters
   themselves, where it would only weaken the tenant's own document.

---

## 7. Operating constraints and how each is met

| Constraint | Approach |
|---|---|
| Trust and verification | Section-level citations with verbatim text and official source links, as-of stamps, statute PDFs versioned in-repo with hashes, refusal on low confidence |
| Low bandwidth | Text first, no images or webfonts; the corpus ships with the client; service worker for offline use; the whole site is under 1 MB |
| Accessibility | Plain language beside verbatim statute; situation buttons rather than a blank chat box; semantic HTML, keyboard navigable, WCAG AA contrast, reduced-motion support |
| Privacy and security | No account, no backend; nothing typed leaves the device; the incident log is local storage only, with one-tap delete |
| Multilingual | English and Nigerian Pidgin for the full experience, including typed Pidgin queries in retrieval. Pidgin over French: depth beats breadth, and the language files live in the jurisdiction pack |
| Local relevance | Lagos statute, Lagos bodies, Lagos process; swappable per jurisdiction by design |
| Clear next steps | Every answer ends in a date, a body with verified contacts, and a document |

---

## 8. Build plan

Six working phases. Cut from the bottom, never from section 3.1.

**Phase 1: Corpus.** Obtain the current law and the draft bill. Structure by section and
clause. Version them. This is the foundation; do not start the UI first.

**Phase 2: Answer layer.** Chunking, retrieval, citation, refusal threshold.

**Phase 3: Rules engine.** Notice period arithmetic, tenancy type branching, short
notice detection. Deterministic code, not a model. Unit-test it.

**Phase 4: Interface.** Situation triage, dual panel rendering, document generation.

**Phase 5: Language and offline.** Pidgin output, service worker, low bandwidth pass.

**Phase 6: Submission.** Repo README, demo video, pitch deck, written summary.

**Cut list, in order:** Yoruba (keep Pidgin), incident photos, live status refresh in
the UI (a verified stamp plus an offline refresh tool ships instead).

---

## 9. Submission checklist

- [ ] **GitHub repo**, public, README covering what it does, how to run it, and the
  corpus provenance.
- [ ] **Demo video** (mp4, mov, webm, or avi, 250MB or less). Structure: a real tenant
  scenario, the tool separating law from bill, the computed date, the generated letter,
  a citation being opened to the verbatim text. Under 3 minutes.
- [ ] **Pitch deck** (PDF, 100MB or less). Problem, users, solution, impact. One slide
  on jurisdiction packs for scalability. One slide on the trust model.
- [ ] **Written summary.** Track, information sources, approach to trust and accuracy,
  how AI tools were used.
- [ ] Track selection: **Cross-track** (Transparency & Accountability primary,
  Stability & Social Cohesion secondary).

### On "AI Coding Usage"

A quarter of the score. The running note lives in `docs/AI-USAGE.md`: where Claude Code
did the work, what had to be corrected by hand, the Firecrawl setup and its surprises,
and the deliberate absence of AI in the product itself. Commit history that shows the
arc is evidence.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Bill passes before 21 September | Ideal, not a problem. The tool's purpose is tracking exactly that. The refresh tool flags stage-change evidence for human review |
| Reads as legal advice | Persistent disclaimer at the point of download; route to mediation and lawyers; never predict case outcomes |
| Corpus text hard to obtain | Done: gazette text acquired, hashed, proofread against the PDF |
| Scope creep into a general legal assistant | One statute, one jurisdiction, five situations. Depth beats breadth in an invention sprint |
| Model hallucinates a section number | Citations resolve against the corpus; an unresolvable reference fails the answer rather than shipping it |

---

## 11. Sources

- Tenancy Law, Cap. T1, Laws of Lagos State 2015 (Law No. 14 of 2011; Gazette No. 37,
  Vol. 44). Primary, in force.
- Lagos State Tenancy and Recovery of Premises Bill 2025. Draft, committee stage.
- Lagos State House of Assembly: legislative status.
- LASRERA: agent registration and complaints.
- Lagos State Citizens' Mediation Bureau: dispute resolution.
- Reputable press (Channels TV, Premium Times): for stage and dates only, never for
  legal statements.

---

*Informational only. Not legal advice.*
