"use client";

import { useMemo, useState } from "react";
import { corpusStatus, resolveCitation } from "../lib/corpus";
import { retrieve, RetrievalResult } from "../lib/retrieval";
import {
  Answer,
  EXCLUDED_AREAS,
  Facts,
  SITUATIONS,
  SituationId,
} from "../lib/situations";
import { TenancyType } from "../lib/rules";

/** One expandable citation: click to open the verbatim source text. */
function Cite({ refStr }: { refStr: string }) {
  const [open, setOpen] = useState(false);
  const unit = resolveCitation(refStr);
  if (!unit) return null;
  return (
    <span className="cite">
      <button className="linklike" onClick={() => setOpen(!open)} aria-expanded={open}>
        [{unit.ref}]
      </button>
      {open && (
        <span style={{ display: "block", whiteSpace: "normal" }}>
          <strong>{unit.citation}</strong>
          <span className="verbatim" style={{ display: "block" }}>
            {unit.text}
          </span>
        </span>
      )}
    </span>
  );
}

function PanelView({ panel, kind }: { panel: Answer["inForce"]; kind: "inforce" | "proposed" }) {
  return (
    <section className={`panel ${kind}`} aria-label={panel.heading}>
      <h3>{panel.heading}</h3>
      <span className="stamp">
        {panel.status === "IN_FORCE"
          ? "Tenancy Law, Cap. T1, Laws of Lagos State 2015"
          : "Tenancy & Recovery of Premises Bill 2025 — at committee, NOT law"}{" "}
        · status verified {panel.asOf}
      </span>
      <ul>
        {panel.points.map((p, i) => (
          <li key={i}>
            {p.text} <Cite refStr={p.ref} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function downloadText(filename: string, text: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function AnswerView({ answer }: { answer: Answer }) {
  return (
    <div>
      {answer.coverageNote && (
        <div className="coverage">
          <strong>Coverage check:</strong> {answer.coverageNote} <Cite refStr="s.1" />{" "}
          <Cite refStr="cl.2" />
        </div>
      )}
      <PanelView panel={answer.inForce} kind="inforce" />
      <PanelView panel={answer.proposed} kind="proposed" />

      {answer.computed.length > 0 && (
        <div className="computed">
          <strong>Your dates and figures</strong>
          <dl>
            {answer.computed.map((c, i) => (
              <span key={i}>
                <dt>{c.label}</dt>
                <dd className={c.value.includes("SHORT") ? "short" : undefined}>{c.value}</dd>
              </span>
            ))}
          </dl>
        </div>
      )}

      <div className="computed">
        <strong>Where to go: {answer.body.name}</strong>
        <p>{answer.body.role}</p>
        <p>
          <strong>Bring:</strong>
        </p>
        <ul>
          {answer.body.bring.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>

      {answer.letter && (
        <div>
          <h3>{answer.letter.title}</h3>
          <div className="letter">{answer.letter.text}</div>
          <button
            className="primary"
            onClick={() => downloadText(`${answer.situation}-letter.txt`, answer.letter!.text)}
          >
            Download this letter (.txt)
          </button>
        </div>
      )}
    </div>
  );
}

/** Minimal facts form per situation — only what the answer needs. */
function FactsForm({
  situation,
  onSubmit,
}: {
  situation: SituationId;
  onSubmit: (f: Facts) => void;
}) {
  const [f, setF] = useState<Facts>({ tenancyType: "yearly" });
  const set = (patch: Partial<Facts>) => setF({ ...f, ...patch });
  const needsTenancy = situation === "quit-notice";
  const needsNotice = situation === "quit-notice";
  const needsRent = situation === "rent-increase";
  const needsFee = situation === "agency-fee";
  const needsIncident = situation === "lockout";

  return (
    <form
      className="facts"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <label>
        Where are the premises?
        <select
          value={f.excludedArea ? f.areaName : "elsewhere"}
          onChange={(e) => {
            const v = e.target.value;
            set(v === "elsewhere" ? { excludedArea: false, areaName: undefined } : { excludedArea: true, areaName: v });
          }}
        >
          <option value="elsewhere">Somewhere else in Lagos</option>
          {EXCLUDED_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      {needsTenancy && (
        <label>
          How is your rent paid?
          <select
            value={f.tenancyType}
            onChange={(e) => set({ tenancyType: e.target.value as TenancyType })}
          >
            <option value="yearly">Yearly</option>
            <option value="half-yearly">Every 6 months</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
            <option value="at-will">No fixed arrangement (tenant at will)</option>
          </select>
        </label>
      )}

      {needsNotice && (
        <>
          <label>
            Date you received the notice
            <input
              type="date"
              required
              onChange={(e) => set({ noticeServedOn: e.target.value })}
            />
          </label>
          <label>
            Date the notice says you must leave (if stated)
            <input type="date" onChange={(e) => set({ statedExpiry: e.target.value || undefined })} />
          </label>
        </>
      )}

      {needsRent && (
        <>
          <label>
            Current yearly rent (₦)
            <input type="number" min="0" onChange={(e) => set({ currentRent: +e.target.value })} />
          </label>
          <label>
            New rent demanded (₦)
            <input type="number" min="0" onChange={(e) => set({ newRent: +e.target.value })} />
          </label>
        </>
      )}

      {needsFee && (
        <>
          <label>
            Yearly rent (₦)
            <input type="number" min="0" onChange={(e) => set({ annualRent: +e.target.value })} />
          </label>
          <label>
            Fee the agent is demanding (₦)
            <input type="number" min="0" onChange={(e) => set({ feeDemanded: +e.target.value })} />
          </label>
        </>
      )}

      {needsIncident && (
        <>
          <label>
            When did it happen?
            <input type="date" onChange={(e) => set({ incidentDate: e.target.value })} />
          </label>
          <label>
            What happened? (kept on this device only)
            <textarea rows={3} onChange={(e) => set({ incidentWhat: e.target.value })} />
          </label>
        </>
      )}

      <label>
        Your name (for the letter — optional)
        <input type="text" onChange={(e) => set({ userName: e.target.value || undefined })} />
      </label>

      <button className="primary" type="submit">
        Show me the law and my next step
      </button>
    </form>
  );
}

function FreeTextAsk() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<RetrievalResult | null>(null);
  return (
    <div>
      <div className="asktext">
        <input
          type="search"
          placeholder="…or describe your situation in your own words"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setResult(retrieve(q))}
          aria-label="Describe your situation"
        />
        <button className="primary" onClick={() => setResult(retrieve(q))}>
          Ask
        </button>
      </div>
      {result &&
        (result.refused ? (
          <div className="refusal">
            <strong>We can’t answer that from the law we hold.</strong> This tool only covers
            Lagos tenancy law. For anything else — or if this is urgent — go to the Lagos State
            Citizens Mediation Centre, which is free, or speak to a lawyer.
          </div>
        ) : (
          <div>
            {result.inForce.length > 0 && (
              <section className="panel inforce">
                <h3>In force today</h3>
                <span className="stamp">Tenancy Law, Cap. T1, Laws of Lagos State 2015</span>
                <ul>
                  {result.inForce.map((h) => (
                    <li key={h.unit.id}>
                      <strong>{h.unit.title}</strong> <Cite refStr={h.unit.ref} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {result.proposed.length > 0 && (
              <section className="panel proposed">
                <h3>Proposed, not yet law</h3>
                <span className="stamp">Bill 2025 — at committee, NOT law</span>
                <ul>
                  {result.proposed.map((h) => (
                    <li key={h.unit.id}>
                      <strong>{h.unit.title}</strong> <Cite refStr={h.unit.ref} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ))}
    </div>
  );
}

export default function Home() {
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const active = useMemo(() => SITUATIONS.find((s) => s.id === situation), [situation]);
  const billStatus = corpusStatus.documents[1];

  return (
    <main>
      <h1>Ẹ̀tọ́</h1>
      <p className="tagline">
        Know the law that actually applies to you today. <em>Ẹ̀tọ́</em> (Yoruba): right,
        entitlement, what is due to you.
      </p>

      <div className="status-banner">
        <strong>The new tenancy bill is not law yet.</strong> It is at{" "}
        {billStatus.stage ?? "committee"} stage (verified {corpusStatus.as_of}). What applies
        today is the Tenancy Law, Cap. T1, Laws of Lagos State 2015.
      </div>

      {!situation && (
        <>
          <h2>What is happening to you?</h2>
          <div className="situations">
            {SITUATIONS.map((s) => (
              <button key={s.id} onClick={() => setSituation(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <FreeTextAsk />
        </>
      )}

      {situation && !answer && active && (
        <>
          <button className="linklike" onClick={() => setSituation(null)}>
            ← back
          </button>
          <h2>{active.label}</h2>
          <FactsForm situation={situation} onSubmit={(f) => setAnswer(active.answer(f))} />
        </>
      )}

      {answer && active && (
        <>
          <button
            className="linklike"
            onClick={() => {
              setAnswer(null);
              setSituation(null);
            }}
          >
            ← start over
          </button>
          <h2>{active.label}</h2>
          <AnswerView answer={answer} />
        </>
      )}

      <p className="disclaimer">
        Informational only — <strong>not legal advice</strong>. Every statement links to the
        section of the law or bill it comes from. Where we cannot cite, we say so and point you
        to the Lagos State Citizens Mediation Centre or a lawyer. Nothing you type here leaves
        your device.
      </p>
    </main>
  );
}
