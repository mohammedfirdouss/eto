# Ẹ̀tọ́

**Know the law that actually applies to you today.**

Ẹ̀tọ́ is a tenancy rights assistant for Lagos. Since 2025, the news has promised monthly
rent options, capped agency fees, and jail for illegal evictions. The bill behind those
headlines is still in committee. It is not law. What governs Lagos tenancies today is the
Tenancy Law, Cap. T1, Laws of Lagos State 2015.

Ẹ̀tọ́ keeps the two apart. It shows what the current law says and what the bill proposes,
in separate panels that are never mixed. Every answer cites the exact section it comes
from, and ends with a clear next step: a computed date, the right office to visit, and a
letter you can download.

> *Ẹ̀tọ́* (Yoruba): right, entitlement, what is due to you.

## What it does

- **Pick your situation.** Five common problems (rent increase, quit notice, lock out,
  agency fee, agent check) instead of a blank chat box. The tool asks only for the facts
  it needs. It also asks where the house is, because the current law does not apply in
  Apapa, Ikeja GRA, Ikoyi, and Victoria Island (section 1(3)).
- **Two panels, never mixed.** "In force today" and "Proposed, not yet law". Each panel
  shows its status and the date it was last verified.
- **Computed next steps.** Simple, tested code works out your dates. It tells you the
  earliest lawful end of your tenancy, and whether the notice you received is too short
  and by how many days. No AI model is involved in these answers.
- **Ready letters.** A reply to a short notice, a complaint to LASRERA, or an incident
  record, filled in with your dates and figures. You can download each one as a text
  file. Nothing you type leaves your device.

## Run it

```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests: retrieval, rules engine, situations
```

## Repo structure

```text
corpus/lagos-ng/     the Lagos pack: statute and bill (sources, hashes,
                     section JSON), bodies, myths, changes ledger, PROVENANCE.md
corpus/abuja-ng/     second pack, skeleton only: sources identified, unverified
corpus/PACK-AUTHORING.md   what it takes to author a pack for a new city
web/                 Next.js app: UI, retrieval, rules engine, tests
tools/               corpus extraction pipeline (split_corpus.py)
docs/                submission material
ETO.md               the build plan this project follows
```

## How it works

- `corpus/lagos-ng/` holds everything specific to Lagos: the gazette PDF of the law, the
  full bill text from the House of Assembly, and the named bodies. The files are
  versioned and hashed. See `corpus/lagos-ng/PROVENANCE.md` for sources and dates. To
  bring Ẹ̀tọ́ to another city, you write a new pack. You do not rewrite the engine.
- `web/src/lib/retrieval.ts` searches the legal texts with plain keyword scoring. If
  nothing in the corpus supports an answer, the tool says it does not know and points
  you to the Citizens Mediation Centre.
- `web/src/lib/rules.ts` holds the notice periods, arrears rules, and advance rent caps
  as tested date arithmetic. Every result carries the section it comes from.
- Every citation is checked against the corpus. If a reference does not resolve, the
  answer fails instead of shipping.

*Informational only. Not legal advice.*
