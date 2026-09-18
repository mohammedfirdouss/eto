# How AI tools were used to build Ẹ̀tọ́

A running log, kept because "AI Coding Usage" is a quarter of the judging score  and
because the honest version is more interesting than the marketing version.

## Tooling

- **Claude Code** (Anthropic CLI) as the primary build agent: corpus acquisition,
  extraction pipeline, retrieval and rules engine, UI, tests, git hygiene.
- **Browser automation from inside Claude Code** (Claude in Chrome) to verify every UI
  phase live — walking the triage flow, checking the Pidgin toggle, and proving the
  offline service worker by killing the server and reloading the page from cache.

## Where AI did the work

- Downloaded the gazette PDF and the Assembly's bill page; wrote `tools/split_corpus.py`
  to structure both into section-level JSON with completeness checks (49/49 sections,
  45/45 clauses reached after two parser fixes — see below).
- Wrote the BM25 retrieval layer with a refusal threshold, then *tuned it against probes*:
  an out-of-domain query ("renew my passport") initially scored 3.77 and slipped through;
  the fix was measured, not guessed (statute-vocabulary synonym folding + a 4.0 floor).
- Wrote the deterministic rules engine and its 41 unit tests.
- Built the UI through three design iterations, the last two driven by human feedback.

## Where the human corrected the AI (the part worth reading)

1. **The statute's name.** The build plan said "Lagos State Tenancy Law 2011". The human
   noticed sources disagree (a 2015 name appears in commentary and in the bill's repeal
   clause). The AI verified from the gazette and the bill text: same statute, enacted
   2011, codified as Cap. T1, Laws of Lagos State 2015 — and adopted the repeal clause's
   citation. This confusion *became part of the pitch*: if careful search yields two names
   for the governing law, an ordinary tenant has no chance.
2. **Geographic exclusions.** The human flagged that s.1(3) exempts Apapa, Ikeja GRA,
   Ikoyi and Victoria Island. Verified from the gazette; the triage flow now asks where
   the premises are, and a coverage warning renders for exempt areas.
3. **The letter disclaimer.** The AI put "not legal advice" inside generated letters.
   The human questioned it; the AI agreed the disclaimer addresses the wrong reader (the
   landlord, not the tenant) and moved it to the UI at the point of download.
4. **Design plagiarism check.** Asked to take inspiration from 1000reasons.vote, the
   first pass copied its signature rotated-receipt card too closely. The human called it;
   the rework kept the principles (numbered evidence, counters, trust rituals) but rebuilt
   the identity from the legal domain itself — gazette double-rule borders, circular
   verification seals, case-file rows.

## AI in the product vs AI in the build

The *product* deliberately contains no runtime AI model. Retrieval is deterministic BM25,
date arithmetic is unit-tested code, and letters are templates — because a legal-rights
tool must never hallucinate a section number. The AI contribution is in the *build*:
the corpus pipeline, the tests, and the verification loops above. Citations resolve
against the corpus or the answer fails (`resolveCitation` fails closed).
