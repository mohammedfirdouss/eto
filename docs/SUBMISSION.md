# Written summary — OSF × Andela, "Information you can trust"

Project: Ẹ̀tọ́, a Lagos tenancy-rights tool that keeps the law in force separate from the
bill still in committee.
Participant: Mohammed Firdous, entering on his own.
Track: Transparency and Accountability. It touches Safety as well, through the record a
locked-out tenant can make.

## The problem

Since July 2025, Lagos renters have read that rent is now paid monthly, that agency fees
are capped, and that illegal eviction carries a heavy fine. None of that is law. The bill
behind those headlines has been in committee for 435 days, since its second reading on
10 July 2025.

The law that actually governs every Lagos tenancy today is the Tenancy Law, Cap. T1, Laws
of Lagos State 2015. Even careful sources name it two different ways, and it does not
apply at all in Apapa, Ikeja GRA, Ikoyi or Victoria Island (s.1(3)). So tenants claim
rights they do not have yet, and miss rights they have had since 2011.

## Where the information comes from

- The Tenancy Law, Cap. T1, Laws of Lagos State 2015. The gazette PDF from the Lagos
  State Ministry of Justice, 49 sections. Stored in this repository with a SHA-256 hash
  of the original file.
- The Lagos State Tenancy and Recovery of Premises Bill 2025. The full 45-clause text as
  published by the Lagos State House of Assembly. Stored and hashed the same way.
- Press reports (Premium Times, Channels TV) are used only for dates and for the stage a
  bill has reached. They are never used for what the law says. Where two reports
  disagree, such as 10% against 5% on agency fees, the tool shows the disagreement and
  lets the primary text settle it.
- Every source URL, the date it was retrieved, and its hash are recorded in
  `corpus/lagos-ng/PROVENANCE.md`. Nothing is fetched from the web when a user asks a
  question.

## How we keep it accurate

1. Nothing is said without a citation. Every sentence names the section or clause it came
   from, and you can tap it to read the exact text. If a citation does not resolve against
   the stored documents, the answer fails instead of showing.
2. Status is a field, not a turn of phrase. The law reads `IN_FORCE`, the bill reads
   `PROPOSED_COMMITTEE`, each stamped with the date it was last checked, on every panel.
   The two are never merged.
3. Code does the arithmetic, not a model. Notice periods, arrears rules and advance-rent
   limits are ordinary tested code, covered by 41 unit tests.
4. It refuses what it cannot answer. Questions outside the law we hold get a plain "we
   can't answer that", and a route to the Citizens' Mediation Centre. The threshold for
   refusing was measured against test queries, not guessed.
5. Every answer ends in something to do: a date it worked out, an office to go to and what
   to bring, and a letter filled in with the user's own facts.

## How it runs

The app is text-first and runs entirely in the browser. It is 736 KB, works offline after
the first visit, needs no account, and sends nothing you type anywhere. It speaks English
and Nigerian Pidgin, and offers buttons for real situations instead of a blank chat box.
Everything specific to Lagos sits in one swappable pack (`corpus/lagos-ng/`), so serving
another city means writing a new pack rather than rewriting the engine.

## AI tools

There is no AI model in the app itself. The AI work went into building it. The full log is
in `docs/AI-USAGE.md`, including the four places where human review corrected the AI, which
we think is the most useful part of the story.
