#!/usr/bin/env python3
"""Split the 2011 Law and 2025 Bill plain-text extractions into section-level JSON."""
import json, re, sys, hashlib
from pathlib import Path

SRC = Path("/Users/amf/Desktop/Git-projects/osf-hackathon/corpus/lagos-ng/sources")
OUT = Path("/Users/amf/Desktop/Git-projects/osf-hackathon/corpus/lagos-ng")

LAW_TITLES = {
    1: "Application of the Law", 2: "Jurisdiction of the Courts", 3: "Tenancy Agreement",
    4: "Advance Rent", 5: "Rent Payment Receipt", 6: "Rights of a Tenant",
    7: "Obligations of the Tenant", 8: "Obligations of the Landlord",
    9: "Obligations of the Landlord regarding business premises",
    10: "Service Charge, Facility and Security Deposits", 11: "Payment of Professional fees",
    12: "Provision for Re-entry", 13: "Length of Notice", 14: "Notice of Licensees",
    15: "Notice required for abandoned premises", 16: "Tenant refusing or neglecting to give up possession",
    17: "Service of Notice", 18: "Service of Notice for Residential Premises",
    19: "Service of Notice for Business Premises", 20: "Duty to notify other persons in occupation",
    21: "Persons in unlawful occupation", 22: "Service of Process", 23: "Use of Forms",
    24: "Institution of Proceedings to recover possession", 25: "Grounds for Possession",
    26: "Recovery of premises for a fixed term", 27: "Trial", 28: "Payment of arrears of rent",
    29: "Court as Receiver of refused rent", 30: "Arbitration",
    31: "Landlord may claim for mesne profits", 32: "Mediation",
    33: "Claims against persons in unlawful occupation", 34: "Defence supported by written statement",
    35: "Service on persons in unlawful occupation", 36: "Defendant not defending claim",
    37: "Unreasonable increase of Rent", 38: "Application to set aside or vary order",
    39: "Warrant for possession may be issued", 40: "Form and purpose of warrant",
    41: "Duration of warrant", 42: "Warrant of possession justifies entry",
    43: "Enforcement of Order of Court", 44: "Offences and Penalties", 45: "Appeals",
    46: "Regulations and procedure", 47: "Interpretation", 48: "Repeal",
    49: "Citation and Commencement",
}

def split_numbered(lines, max_n):
    """Split lines into {n: body} on top-level 'N.' line starts, ascending order only."""
    sections, current, buf = {}, None, []
    expect = 1
    for ln in lines:
        m = re.match(r"^\s{0,3}(\d{1,2})[.\-]\s*[-–]?\s*(.*)", ln)
        if m and not m.group(2).strip():
            m = None  # bare number line (wrapped cross-reference), not a heading
        n = int(m.group(1)) if m else None
        # accept only the next section number (or a small skip) to avoid matching
        # internal numbered lists
        if m and n is not None and expect <= n <= min(expect + 2, max_n) and (n > (current or 0)):
            if current is not None:
                sections[current] = "\n".join(buf).strip()
            current, buf, expect = n, [ln], n + 1
        elif current is not None:
            buf.append(ln)
    if current is not None:
        sections[current] = "\n".join(buf).strip()
    return sections

def norm(text):
    # collapse whitespace runs inside lines; keep line structure
    return "\n".join(re.sub(r"\s+", " ", l).strip() for l in text.split("\n") if l.strip())

def sha256(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

# ---- 2011 Law ----
law_lines = (SRC / "tenancy-law-2011.txt").read_text().split("\n")
# body starts after the enactment formula
start = next(i for i, l in enumerate(law_lines) if "enacts as follows" in l)
body = law_lines[start + 1:]
secs = split_numbered(body, 49)
law = {
    "id": "lagos-tenancy-law-2011",
    "title": "Tenancy Law of Lagos State",
    "citation": "Tenancy Law, Cap. T1, Laws of Lagos State 2015 (originally Law No. 14 of 2011)",
    "gazette": "Lagos State Official Gazette No. 37, Vol. 44, 26 August 2011; assented 24 August 2011",
    "status": "IN_FORCE",
    "as_of": "2026-09-17",
    "source_file": "sources/tenancy-law-2011.pdf",
    "source_sha256": sha256(SRC / "tenancy-law-2011.pdf"),
    "source_url": "http://lagosministryofjustice.org/wp-content/uploads/2022/01/Tenancy-Law-2011.pdf",
    "sections": [
        {"section": n, "title": LAW_TITLES.get(n, ""), "text": norm(t), "review": "machine-extracted, pending manual proofread"}
        for n, t in sorted(secs.items())
    ],
}
missing = sorted(set(range(1, 50)) - set(secs))
print("law sections found:", len(secs), "missing:", missing)

# ---- 2025 Bill ----
bill_lines = (SRC / "tenancy-bill-2025.txt").read_text().split("\n")
clauses, current, buf, title = {}, None, [], {}
part = None
for ln in bill_lines:
    pm = re.match(r"^PART\s+([IVX]+)\s*[—–-]\s*(.*)", ln)
    if pm:
        part = f"Part {pm.group(1)} — {pm.group(2).title()}"
        continue
    m = re.match(r"^(\d{1,2})\.\s+(.*)", ln)
    if m and (current is None or int(m.group(1)) == current + 1):
        if current is not None:
            clauses[current]["text"] = "\n".join(buf).strip()
        current = int(m.group(1))
        clauses[current] = {"clause": current, "title": m.group(2).strip().rstrip("."), "part": part}
        buf = []
    elif current is not None:
        buf.append(ln)
if current is not None:
    clauses[current]["text"] = "\n".join(buf).strip()

bill = {
    "id": "lagos-tenancy-bill-2025",
    "title": "Lagos State Tenancy and Recovery of Premises Bill 2025 (Draft)",
    "citation": "Lagos State Tenancy and Recovery of Premises Bill, 2025 (draft as published by the Lagos State House of Assembly)",
    "status": "PROPOSED_COMMITTEE",
    "stage_detail": "Second reading 10 July 2025; referred to House Committee on Housing; public hearing August 2025; still at committee stage",
    "as_of": "2026-09-17",
    "source_file": "sources/bill-2025-assembly.html",
    "source_sha256": sha256(SRC / "bill-2025-assembly.html"),
    "source_url": "https://lagoshouseofassembly.gov.ng/home/lagos-state-tenancy-and-recovery-of-premises-bill-2025-draftlagos-state/",
    "clauses": [dict(v, text=norm(v["text"])) for _, v in sorted(clauses.items())],
}
missing_b = sorted(set(range(1, 46)) - set(clauses))
print("bill clauses found:", len(clauses), "missing:", missing_b)

(OUT / "statute").mkdir(exist_ok=True)
(OUT / "bill").mkdir(exist_ok=True)
(OUT / "statute" / "tenancy-law-2011.json").write_text(json.dumps(law, indent=2, ensure_ascii=False))
(OUT / "bill" / "tenancy-bill-2025.json").write_text(json.dumps(bill, indent=2, ensure_ascii=False))
print("written")
