#!/usr/bin/env python3
"""One-time proofread pass over the extracted 2011 Law text (corpus step 3).

The gazette PDF's text layer breaks words with stray spaces ("otherw ise",
"L aw") and substitutes digits for letters ("b4i1ding"). Two repairs:

1. explicit fixes for every digit-in-word artifact found by scan;
2. dictionary join: fragments a + b become one word only when the joined
   form is in the system dictionary and at least one fragment is not a
   real word itself — conservative enough for legal prose.

Prints every change it makes so the diff can be reviewed line by line.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATUTE = ROOT / "corpus" / "lagos-ng" / "statute" / "tenancy-law-2011.json"

EXPLICIT = {
    "b4i1ding": "building",
    "faci1 ities": "facilities",
    "faci1ities": "facilities",
    "efflux ion": "effluxion",
    "a”": "as",  # 'a" prescribed' in s.17 — gazette typo for 'as'
}

WORDS = {w.strip().lower() for w in open("/usr/share/dict/words") if len(w.strip()) > 3}
# real standalone words of any length — a fragment matching one of these is
# never merged away (prevents "for a" -> "fora", "to be" -> "tobe")
REAL = {w.strip().lower() for w in open("/usr/share/dict/words")} | {"a", "i"}

changed = []


def join_fragments(text: str) -> str:
    def repl(m: re.Match) -> str:
        a, b = m.group(1), m.group(2)
        joined = (a + b).lower()
        if joined not in WORDS:
            return m.group(0)
        if a.lower() in REAL and b.lower() in REAL:
            return m.group(0)  # both fragments are real words — leave them
        changed.append(f"{a} {b} -> {a}{b}")
        return a + b

    # word fragment, single space, word fragment (letters only, len>=1 each)
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"\b([A-Za-z]{1,9}) ([a-z]{1,9})\b", repl, text)
    return text


data = json.loads(STATUTE.read_text())
for section in data["sections"]:
    t = section["text"]
    for bad, good in EXPLICIT.items():
        if bad in t:
            changed.append(f"{bad} -> {good}")
            t = t.replace(bad, good)
    t = join_fragments(t)
    section["text"] = t
    section["review"] = "proofread 2026-09-18: dictionary join + manual review of changes"

STATUTE.write_text(json.dumps(data, indent=2, ensure_ascii=False))
print(f"{len(changed)} changes:")
for c in changed:
    print("  ", c)
