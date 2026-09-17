# Ẹ̀TỌ́

**Know the law that actually applies to you today.**

A tenancy-rights assistant for Lagos that separates *law in force* from *bill in progress*, cites the exact section behind every answer, and ends with a concrete next step — a date, a named body, and a document you can send.

> *Ẹ̀tọ́* (Yoruba): right, entitlement, what is due to you.

---

## 1. Submission metadata

| Field | Value |
|---|---|
| Hackathon | OSF × Andela — "Information you can trust" |
| Primary track | Transparency & Accountability |
| Secondary track | Safety, Reporting & Protection |
| Submission type | Cross-track / other |
| Participant | Mohammed Firdous (individual) |
| Deadline | 21 September 2026, 23:59 UTC |

### Why cross-track

The core of the project is Transparency & Accountability: making an opaque legal regime legible and holding the gap between announced reform and enacted law open to scrutiny.

The Safety overlap is real, not decorative. Illegal self-help eviction — changing locks, removing doors, using thugs — is the most common physical harm in Lagos tenancy disputes, and the proposed bill attaches a ₦1,000,000 fine or up to 6 months imprisonment to it. A tenant facing that needs to document it safely and route it somewhere.

**Decision rule:** build the Transparency core first. Only tick "Cross-track / other" on the form if the incident-logging path is genuinely working by submission time. A half-built safety feature scores worse than a clean single-track entry.

---

## 2. The problem

Lagos residents right now believe they have tenancy protections that do not legally exist.

Since mid-2025 the Lagos State Tenancy and Recovery of Premises Bill has been widely reported: monthly rent options, caps on advance rent, caps on agency fees, criminalised self-help eviction, faster courts. Headlines have run continuously for over a year.

**The bill is not law.** Second reading was 10 July 2025. It went to the House Committee on Housing, had a public hearing in August 2025, and as of September 2026 remains at committee stage. It still needs a third reading and the Governor's assent. What governs Lagos tenancies today is the **Tenancy Law, Cap. T1, Laws of Lagos State 2015** — enacted 24 August 2011 as Law No. 14 and commonly called the "Lagos State Tenancy Law 2011"; the 2015 name comes from its codification in the revised Laws of Lagos State. We cite it the way the bill's own repeal clause does (clause 44: "The Tenancy Law Cap. T1 Laws of Lagos State 2015 is repealed"). *Verified against the gazette PDF and the Assembly's published bill text — see `corpus/lagos-ng/PROVENANCE.md`.*

The naming itself makes the case: a reasonably careful search returns two different names for the law currently governing your tenancy. If that trips up lawyers writing commentary, an ordinary tenant has no chance.

**And it does not govern *every* tenancy.** Section 1(3) exempts Apapa, Ikeja GRA, Ikoyi, and Victoria Island from the Law entirely, and s.1(2) excludes institutional housing (staff/student housing, emergency shelter, care facilities). The bill (clause 2) drops the area exemptions and would apply uniformly across the State. So "which law covers me" currently depends on *where you live* — a dimension the law-vs-bill panel and the triage flow must both handle.

The confusion compounds because the reported figures themselves conflict across sources — the agency fee cap has been reported as both 10% of rent and 5% of annual rent, and advance-rent limits are quoted inconsistently. There is no single place where a tenant can ask "does this protect me *today*?" and get a sourced, dated answer.

The consequences are concrete. Lagos has no rent control; increases of 50–200% happen at renewal. Tenants who don't know the notice periods under the 2011 law accept illegal evictions. Tenants who *over*trust the headlines refuse to pay on the assumption of a protection that hasn't passed, and lose.

### Who this is for

- **Primary:** renters in Lagos facing a rent increase, a quit notice, an agency fee, or a lock-out.
- **Secondary:** small landlords who want to stay compliant; community paralegals and NGO caseworkers handling tenancy complaints.

---

## 3. What it does

Four things, in order of build priority.

### 3.1 Law vs. Bill status (the differentiator)

Every answer is split into two clearly separated panels:

- **In force today** — Tenancy Law, Cap. T1, Laws of Lagos State 2015 (the "2011 Law"), cited to section — including whether it applies at the user's location at all (s.1(3) exempts Apapa, Ikeja GRA, Ikoyi, Victoria Island).
- **Proposed, not yet law** — the 2026 bill, cited to clause, with its current legislative stage and the date that stage was last verified.

The UI never merges them. A user must be unable to mistake a proposal for a protection. This is the direct answer to the brief's constraint: *"Where information may change, consider how users will know when it was last updated."*

### 3.2 Situation triage

Rather than a chat box, the entry point is a small set of concrete situations:

- "My landlord increased my rent"
- "I was given a quit notice"
- "My landlord locked me out / removed my door"
- "An agent is charging me a fee"
- "I want to check if my agent is registered"

Each collects the minimum facts needed (tenancy type — monthly or yearly, date notice received, amount, and area — because s.1(3) coverage depends on it) and nothing else.

### 3.3 Computed next step

This is what stops it being a chatbot. Output is not a paragraph; it is:

- **A computed date.** Notice to quit is 6 months for a yearly tenancy, 1 month for a monthly tenancy, under both the 2011 law and the draft bill. Given a notice date and tenancy type, the tool returns the earliest lawful date of recovery and flags a notice that is short.
- **A named body.** Lagos State Citizens Mediation Centre for disputes; LASRERA for agent registration and complaints; Magistrate Court for recovery proceedings. With what to bring — note that proof of rent payment and updated utility bills are expected before proceedings.
- **A generated document.** A plain-language response letter or complaint draft, filled with the user's dates and figures, downloadable as text. English plus one local language.

### 3.4 Incident log (the Safety leg)

For lock-outs and threats: a timestamped, locally-stored incident record with optional photo, producing a printable summary the user can take to mediation. No account required, stored on-device by default, nothing uploaded unless the user explicitly exports.

---

## 4. Architecture

Keep it small enough to finish and explain.

```
┌──────────────────────────────────────────────────┐
│  Client (Next.js, text-first, offline-capable)   │
│  situation triage · dual-panel answers · docs    │
└───────────────┬──────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────┐
│  Answer layer                                    │
│   · retrieval over the corpus (cited, top-k)     │
│   · deterministic rules engine (dates, notices)  │
│   · refusal when no citation is found            │
└───────────────┬──────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────┐
│  Jurisdiction pack (swappable)                   │
│   statute · pending bill · bodies · templates    │
│   PostgreSQL + pgvector  ·  status + as-of date  │
└───────────────┬──────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────┐
│  Ingestion (offline job, Firecrawl)              │
│   bill status · agency pages · reporting         │
└──────────────────────────────────────────────────┘
```

**The jurisdiction pack is the scalability story.** Everything Lagos-specific lives in one directory: the statute text, the pending-amendment text, the named bodies with contact routes, the letter templates, the language files. Porting to Nairobi or Accra means authoring a new pack, not rewriting the engine. Say this explicitly in the deck — "scalability across geographies" is a quarter of the score.

### Stack

Next.js + TypeScript, PostgreSQL/Supabase with pgvector, Gemini or Vertex for generation, Firecrawl for ingestion. This is deliberately the stack you already shipped SmartKey and api-rag on. Novelty belongs in the idea, not the toolchain.

---

## 5. Firecrawl — where it fits and where it doesn't

Firecrawl went keyless on 16 June 2026: 1,000 free credits a month, no account, no API key, available over MCP, CLI, and REST.

**Useful here, for three reasons:**

1. **No key to break mid-demo.** Their own pitch names the failure mode — API keys fail at hackathon demos. One less thing to go wrong on video day.
2. **It solves your dirtiest input problem.** Legislative and agency pages are JavaScript-heavy and inconsistently structured; Firecrawl returns clean markdown, which is exactly what a chunker wants.
3. **MCP fits your workflow and the "AI Coding Usage" criterion.** `claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp` gives Claude Code live web access while you build, and you can screenshot that in the write-up.

**Use it as an offline ingestion job, not a runtime dependency.** Do not put a live crawl in the request path:

- Answers must be grounded in a fixed, reviewed corpus. A page that changes shape shouldn't change what the law says.
- 1,000 credits/month is generous for a scheduled status check and hopeless for per-user queries.
- Low-bandwidth users need cached content, not a synchronous fetch.

**Concrete jobs for it:** a scheduled scrape of the Assembly's bill-status page and credible reporting, to refresh the "as of" stamp and stage; a one-time pull of LASRERA and Citizens Mediation Centre contact and process pages.

**Handle the authoritative texts separately.** The 2011 Law and the draft bill should come from gazette or Assembly PDFs, versioned in the repo, with a hash. Those are the spine of every citation — they should not be re-scraped between demo and judging.

---

## 6. Trust and accuracy design

The brief scores this heavily, and it is your strongest existing skill. Four rules:

1. **No uncited claim ships.** Every legal statement carries a section or clause reference and a link to the source text. If retrieval returns nothing above threshold, the system says it doesn't know and routes to a human body. Grounding rate is measurable — report it.
2. **Status is a first-class field, not prose.** `IN_FORCE` / `PROPOSED_COMMITTEE` / `PASSED_AWAITING_ASSENT`, each with `as_of`. The UI renders the stamp on every panel.
3. **Conflicting secondary reports are surfaced, not averaged.** Where the press disagrees on a figure, show the disagreement and defer to the primary text.
4. **Not legal advice.** Persistent, visible, and in the generated documents. This is informational, and it routes people to the Citizens Mediation Centre and to lawyers rather than replacing them.

---

## 7. Operating constraints — how each is met

| Constraint | Approach |
|---|---|
| Trust & verification | Section-level citations, `as_of` stamps, statute PDFs versioned in-repo, refusal on low confidence |
| Low bandwidth | Text-first, no heavy media; the legal corpus is small enough to cache; service worker for offline re-reads; answers under a few KB |
| Accessibility | Plain-language output at a low reading level alongside verbatim statute; situation buttons rather than a blank chat box; semantic HTML, keyboard navigable, high contrast |
| Privacy & security | No account, no login for core use; incident log local-first; nothing about a tenancy stored server-side without explicit export |
| Multilingual | English, Nigerian Pidgin, Yoruba for answers and letters. Pidgin matters more than French here — pick depth over breadth and say why. Language files live in the jurisdiction pack |
| Local relevance | Lagos statute, Lagos bodies, Lagos process; swappable per jurisdiction by design |
| Clear next steps | Every answer terminates in a date, a body, and a document |

---

## 8. Build plan

Six working phases. Cut from the bottom, never from section 3.1.

**Phase 1 — Corpus.** Obtain the 2011 Law and the draft bill. Structure by section/clause. Version them. This is the foundation; do not start the UI first.

**Phase 2 — Answer layer.** Chunking, retrieval, citation, refusal threshold. Reuse the api-rag patterns.

**Phase 3 — Rules engine.** Notice-period arithmetic, tenancy-type branching, short-notice detection. Deterministic code, not the model. Unit-test it — you already test well, and it shows.

**Phase 4 — Interface.** Situation triage, dual-panel law-vs-bill rendering, document generation.

**Phase 5 — Language + offline.** Pidgin and Yoruba output, service worker, low-bandwidth pass.

**Phase 6 — Submission.** Repo README, demo video, pitch deck, written summary.

**Cut list, in order:** Yoruba (keep Pidgin), incident log with photos, live Firecrawl status refresh (ship a static verified stamp instead).

---

## 9. Submission checklist

- [ ] **GitHub repo**, public, README covering what it does, how to run it, and the corpus provenance.
- [ ] **Demo video** (mp4/mov/webm/avi, ≤250MB). Structure: a real tenant scenario → the tool separating law from bill → the computed date → the generated letter. Show the citation being opened. Under 3 minutes.
- [ ] **Pitch deck** (PDF, ≤100MB). Problem, users, solution, impact. One slide on jurisdiction packs for scalability. One slide on the trust model.
- [ ] **Written summary.** Track, information sources, approach to trust and accuracy, how AI tools were used.
- [ ] Track selection: **Cross-track / other** — only if the safety path is working.

### On "AI Coding Usage"

A quarter of the score. Keep a running note as you build: where Claude Code did the work, what you had to correct, the Firecrawl MCP setup, and how you used AI in the product (retrieval and generation) versus in the build. Commit history that shows the arc is evidence.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Bill passes before 21 September | Ideal, not a problem — the tool's purpose is tracking exactly that. Show the status field changing. Watch the Assembly in the final days |
| Reads as legal advice | Persistent disclaimer; route to Citizens Mediation Centre and lawyers; never predict case outcomes |
| Corpus text hard to obtain | Start Phase 1 immediately; gazette text first, reputable secondary sources as fallback with provenance noted |
| Scope creep into a general legal assistant | One statute, one jurisdiction, five situations. Depth beats breadth in an invention sprint |
| Model hallucinates a section number | Citations resolve against the corpus; unresolvable reference fails the answer rather than shipping it |

---

## 11. Sources

- Tenancy Law, Cap. T1, Laws of Lagos State 2015 (Law No. 14 of 2011; Gazette No. 37, Vol. 44) — primary, in force
- Lagos State Tenancy and Recovery of Premises Bill 2025/2026 — draft, committee stage
- Lagos State House of Assembly — legislative status
- LASRERA — agent registration and complaints
- Lagos State Citizens Mediation Centre — dispute resolution
- Reputable press (Channels TV, Premium Times) — for stage and dates only, never for legal statements

---

*Informational only. Not legal advice.*