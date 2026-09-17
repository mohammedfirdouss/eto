# Ẹ̀tọ́

**Know the law that actually applies to you today.**

A tenancy-rights assistant for Lagos. Since 2025, headlines have promised monthly rent,
capped agency fees, and criminalised lock-outs — but the bill behind them is still at
committee. Ẹ̀tọ́ separates the **law in force** (Tenancy Law, Cap. T1, Laws of Lagos
State 2015) from the **bill in progress** (Tenancy and Recovery of Premises Bill 2025),
cites the exact section behind every answer, and ends with a concrete next step: a
computed date, a named body, and a letter you can download.

> *Ẹ̀tọ́* (Yoruba): right, entitlement, what is due to you.

## What it does

- **Situation triage** — five concrete situations (rent increase, quit notice, lock-out,
  agency fee, agent check) instead of a blank chat box. Each collects only the facts it
  needs — including *where* the premises are, because s.1(3) exempts Apapa, Ikeja GRA,
  Ikoyi and Victoria Island from the current law.
- **Dual-panel answers** — "In force today" and "Proposed, not yet law" are never merged,
  each stamped with its status and the date it was last verified.
- **Computed next steps** — notice-period arithmetic is deterministic code, not a model:
  the earliest lawful end of your tenancy, whether the notice you got is short (and by how
  many days), and where to go with what to bring.
- **Generated letters** — a reply to a short notice, a LASRERA complaint, an incident
  record — filled with your dates and figures, downloadable as text. Nothing you type
  leaves your device.

## Run it

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm test           # 30 unit tests: retrieval, rules engine, situations
```

## Repo structure

```text
corpus/lagos-ng/     the jurisdiction pack: statute + bill (sources, hashes,
                     section JSON), bodies, myths, changes ledger, PROVENANCE.md
web/                 Next.js app — UI, BM25 retrieval, rules engine, tests
tools/               corpus extraction pipeline (split_corpus.py)
docs/                submission material: written summary, AI-usage log
ETO.md               the build plan this project follows
```

## How it's built

- `corpus/lagos-ng/` — the jurisdiction pack: gazette PDF of the 2011 Law and the
  Assembly's published bill text, versioned and SHA-256-hashed, structured into
  section-level JSON. See `corpus/lagos-ng/PROVENANCE.md` for sources and dates.
  Porting to another city means authoring a new pack, not rewriting the engine.
- `web/src/lib/retrieval.ts` — deterministic BM25 retrieval over the pack, with a refusal
  threshold: if nothing in the corpus supports an answer, the tool says so and routes to
  the Citizens Mediation Centre.
- `web/src/lib/rules.ts` — notice periods, arrears-lapse and advance-rent rules as
  unit-tested date arithmetic, each result carrying the section it derives from.
- Citations resolve against the corpus (`resolveCitation`); an unresolvable reference
  fails the answer rather than shipping it.

*Informational only — not legal advice.*
