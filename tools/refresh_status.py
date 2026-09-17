#!/usr/bin/env python3
"""Scheduled bill-status refresh (ETO.md §5).

Scrapes the Lagos Assembly's bill page and searches recent coverage through the
Firecrawl MCP endpoint, then:

- re-stamps `as_of` in corpus/lagos-ng/status.json when the evidence still
  matches the recorded stage;
- REFUSES to change the stage itself — a stage change is printed with its
  evidence for a human to review, because the status field is a trust anchor.

Usage:  python3 tools/refresh_status.py
Requires FIRECRAWL_API_KEY in the repo-root .env file.
"""
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MCP = "https://mcp.firecrawl.dev/v2/mcp"
BILL_URL = (
    "https://lagoshouseofassembly.gov.ng/home/"
    "lagos-state-tenancy-and-recovery-of-premises-bill-2025-draftlagos-state/"
)
# Completed-action phrases that would indicate the bill moved past committee.
# Deliberately past/perfect tense: explainers saying the bill "must pass a
# third reading" describe the future and should not trip the review gate.
ADVANCE_MARKERS = [
    "passed third reading",
    "passes third reading",
    "passed its third reading",
    "passed into law",
    "signed into law",
    "governor signs",
    "assented to",
    "receives assent",
    "transmitted to the governor",
]


def read_key() -> str:
    env = ROOT / ".env"
    if env.exists():
        m = re.search(r"FIRECRAWL_API_KEY=([^\s\"]+)", env.read_text())
        if m:
            return m.group(1)
    sys.exit("FIRECRAWL_API_KEY not found in .env")


def mcp_call(key: str, req_id: int, tool: str, arguments: dict) -> dict:
    body = json.dumps(
        {
            "jsonrpc": "2.0",
            "id": req_id,
            "method": "tools/call",
            "params": {"name": tool, "arguments": arguments},
        }
    ).encode()
    req = urllib.request.Request(
        MCP,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Authorization": f"Bearer {key}",
        },
    )
    raw = urllib.request.urlopen(req, timeout=180).read().decode()
    m = re.search(r"data: (\{.*\})", raw)
    payload = json.loads(m.group(1))["result"]
    if payload.get("isError"):
        sys.exit(f"firecrawl {tool} failed: {payload['content'][0]['text'][:300]}")
    return payload


def main() -> None:
    key = read_key()
    today = date.today().isoformat()

    scrape = mcp_call(key, 1, "firecrawl_scrape", {"url": BILL_URL, "formats": ["markdown"]})
    page_text = json.loads(scrape["content"][0]["text"])["markdown"].lower()

    search = mcp_call(
        key,
        2,
        "firecrawl_search",
        {
            "query": "Lagos Tenancy and Recovery of Premises Bill third reading passed assent",
            "limit": 5,
        },
    )
    hits = json.loads(search["content"][0]["text"])["data"]["web"]
    evidence = [
        f"{h['url']} — {h.get('description', '')[:160]}"
        for h in hits
        if any(m in (h.get("title", "") + h.get("description", "")).lower() for m in ADVANCE_MARKERS)
    ]
    page_markers = [m for m in ADVANCE_MARKERS if m in page_text]

    status_path = ROOT / "corpus" / "lagos-ng" / "status.json"
    status = json.loads(status_path.read_text())

    if page_markers or evidence:
        print("POSSIBLE STAGE CHANGE — not applying automatically. Review:")
        for m in page_markers:
            print(f"  bill page contains: {m!r}")
        for e in evidence:
            print(f"  {e}")
        print("If confirmed, edit status.json manually and record it in PROVENANCE.md.")
        return

    status["as_of"] = today
    for doc in status["documents"]:
        # only the verification date moves; stage and status text stay put
        pass
    status_path.write_text(json.dumps(status, indent=2, ensure_ascii=False) + "\n")
    print(f"No stage change found. status.json as_of re-stamped to {today}.")
    print("Remember: run `npm run sync-corpus` in web/ and commit.")


if __name__ == "__main__":
    main()
