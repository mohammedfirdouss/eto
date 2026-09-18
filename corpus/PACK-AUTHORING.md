# Authoring a jurisdiction pack

Everything place-specific in Ẹ̀tọ́ lives in one directory (`corpus/<jurisdiction>/`).
The engine — retrieval, citation resolution, date arithmetic, case-file and letter
builders, the dual-panel UI — does not change between cities. This checklist is not
theoretical: it is the distilled record of what building `lagos-ng` actually required,
including the steps that only mattered because something turned out to be wrong.

## The checklist

1. **Acquire the primary texts.** The law in force and the pending reform bill, from a
   gazette or the legislature itself. Save the raw files, hash them (SHA-256), record
   URL and retrieval date in `PROVENANCE.md`. Never plan to re-scrape them: they are
   the spine of every citation.
2. **Verify the law's identity before anything else.** In Lagos, careful sources named
   the governing statute two different ways (2011 vs Cap. T1, 2015). Resolve the
   authoritative citation from the primary texts — the reform bill's repeal clause is
   often the cleanest source.
3. **Structure by section/clause** into JSON (`statute/`, `bill/`), and validate
   completeness programmatically (Lagos: 49/49 sections, 45/45 clauses, after fixing
   three extraction quirks). Flag machine-extracted text for proofreading.
4. **Read the application section yourself.** Lagos's law excludes four areas
   (s.1(3)) — a fact most coverage misses and the triage flow must ask about.
5. **`pack.json` manifest**: place name, masthead, both citations, key legislative
   dates. The engine reads these; no jurisdiction facts belong in code.
6. **`status.json`**: `IN_FORCE` / `PROPOSED_*` with `as_of` and stage history. Wire
   the refresh job (`tools/refresh_status.py`) to the legislature's page; keep the rule
   that stage changes need human confirmation.
7. **`bodies.json` — verify every contact.** Scrape the official pages (Firecrawl
   handles the JS-heavy ones); date-stamp each verification. Expect trouble: for Lagos,
   the regulator's website was dead and two official ministry pages gave conflicting
   addresses for the mediation service. Record conflicts honestly; prefer the newer
   official source; omit what cannot be verified.
8. **`myths.json`** — collect the locally circulating claims (press, radio, social
   media), pin each to what the primary texts actually say, and where a wrong figure
   has a traceable origin (Lagos's "10%" came from a government statement), cite it.
9. **`changes.json`** — the law-vs-bill ledger, row by row, cited on both sides,
   including changes the headlines skip (Lagos: arrears evictions get *faster*).
10. **Situations content** — the curated points, letters, and facts-to-collect for the
    handful of local dispute patterns. *Engine note:* this content currently lives in
    `web/src/lib/situations.ts` and is the one piece not yet externalized into the
    pack; moving it behind a pack-driven schema is the known engineering step before a
    second pack goes live.
11. **Language files** — the local lingua franca beside English (Lagos: Nigerian
    Pidgin). Statute text stays in its enacted language; translating it would break
    the citation trust chain.

Budget honestly: Lagos took roughly a working week, and most of it was verification,
not code. A pack assembled without steps 2, 4, 7 and 8 is exactly the kind of
unverified information this project exists to displace.
