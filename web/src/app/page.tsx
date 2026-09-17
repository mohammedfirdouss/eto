"use client";

import { useMemo, useState } from "react";
import { corpusStatus, resolveCitation } from "../lib/corpus";
import { Lang, situationLabel, t } from "../lib/i18n";
import { retrieve, RetrievalResult } from "../lib/retrieval";
import { Answer, EXCLUDED_AREAS, Facts, SITUATIONS, SituationId } from "../lib/situations";
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

function PanelView({
  panel,
  kind,
  lang,
}: {
  panel: Answer["inForce"];
  kind: "inforce" | "proposed";
  lang: Lang;
}) {
  return (
    <section className={`panel ${kind}`} aria-label={panel.heading}>
      <span className="chip">
        {t(kind === "inforce" ? "inForceChip" : "proposedChip", lang)}
      </span>
      <h3>{t(kind === "inforce" ? "inForceHeading" : "proposedHeading", lang)}</h3>
      <span className="stamp">
        {panel.status === "IN_FORCE"
          ? "Tenancy Law, Cap. T1, Laws of Lagos State 2015"
          : "Tenancy & Recovery of Premises Bill 2025 — at committee, NOT law"}{" "}
        · status verified {panel.asOf}
      </span>
      <ul>
        {panel.points.map((p, i) => (
          <li key={i}>
            {lang === "pcm" && p.pcm ? p.pcm : p.text} <Cite refStr={p.ref} />
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

function AnswerView({ answer, lang }: { answer: Answer; lang: Lang }) {
  const coverageText =
    lang === "pcm" && answer.coverageNotePcm ? answer.coverageNotePcm : answer.coverageNote;
  return (
    <div>
      {coverageText && (
        <div className="coverage">
          <strong>Coverage check:</strong> {coverageText} <Cite refStr="s.1" />{" "}
          <Cite refStr="cl.2" />
        </div>
      )}
      <PanelView panel={answer.inForce} kind="inforce" lang={lang} />
      <PanelView panel={answer.proposed} kind="proposed" lang={lang} />

      {answer.computed.length > 0 && (
        <div className="computed">
          <strong>{t("yourDates", lang)}</strong>
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
        <strong>
          {t("whereToGo", lang)}: {answer.body.name}
        </strong>
        <p>{answer.body.role}</p>
        <p>
          <strong>{t("bring", lang)}</strong>
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
            {t("downloadLetter", lang)}
          </button>
        </div>
      )}
    </div>
  );
}

/** Minimal facts form per situation — only what the answer needs. */
function FactsForm({
  situation,
  lang,
  onSubmit,
}: {
  situation: SituationId;
  lang: Lang;
  onSubmit: (f: Facts) => void;
}) {
  const [f, setF] = useState<Facts>({ tenancyType: "yearly" });
  const set = (patch: Partial<Facts>) => setF({ ...f, ...patch });
  const needsTenancy = situation === "quit-notice";
  const needsNotice = situation === "quit-notice";
  const needsRent = situation === "rent-increase";
  const needsFee = situation === "agency-fee";
  const needsIncident = situation === "lockout";
  const pcm = lang === "pcm";

  return (
    <form
      className="facts"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <label>
        {pcm ? "Where the house dey?" : "Where are the premises?"}
        <select
          value={f.excludedArea ? f.areaName : "elsewhere"}
          onChange={(e) => {
            const v = e.target.value;
            set(
              v === "elsewhere"
                ? { excludedArea: false, areaName: undefined }
                : { excludedArea: true, areaName: v },
            );
          }}
        >
          <option value="elsewhere">
            {pcm ? "Another place for Lagos" : "Somewhere else in Lagos"}
          </option>
          {EXCLUDED_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      {needsTenancy && (
        <label>
          {pcm ? "How you dey pay your rent?" : "How is your rent paid?"}
          <select
            value={f.tenancyType}
            onChange={(e) => set({ tenancyType: e.target.value as TenancyType })}
          >
            <option value="yearly">{pcm ? "Every year" : "Yearly"}</option>
            <option value="half-yearly">{pcm ? "Every 6 months" : "Every 6 months"}</option>
            <option value="quarterly">{pcm ? "Every 3 months" : "Quarterly"}</option>
            <option value="monthly">{pcm ? "Every month" : "Monthly"}</option>
            <option value="at-will">
              {pcm ? "No fixed arrangement" : "No fixed arrangement (tenant at will)"}
            </option>
          </select>
        </label>
      )}

      {needsNotice && (
        <>
          <label>
            {pcm ? "Which day you receive the notice?" : "Date you received the notice"}
            <input type="date" required onChange={(e) => set({ noticeServedOn: e.target.value })} />
          </label>
          <label>
            {pcm
              ? "Which day the notice talk say make you comot? (if e talk)"
              : "Date the notice says you must leave (if stated)"}
            <input
              type="date"
              onChange={(e) => set({ statedExpiry: e.target.value || undefined })}
            />
          </label>
        </>
      )}

      {needsRent && (
        <>
          <label>
            {pcm ? "Your rent now (₦ per year)" : "Current yearly rent (₦)"}
            <input type="number" min="0" onChange={(e) => set({ currentRent: +e.target.value })} />
          </label>
          <label>
            {pcm ? "New rent wey dem talk (₦)" : "New rent demanded (₦)"}
            <input type="number" min="0" onChange={(e) => set({ newRent: +e.target.value })} />
          </label>
        </>
      )}

      {needsFee && (
        <>
          <label>
            {pcm ? "Rent for one year (₦)" : "Yearly rent (₦)"}
            <input type="number" min="0" onChange={(e) => set({ annualRent: +e.target.value })} />
          </label>
          <label>
            {pcm ? "Fee wey the agent dey ask (₦)" : "Fee the agent is demanding (₦)"}
            <input type="number" min="0" onChange={(e) => set({ feeDemanded: +e.target.value })} />
          </label>
        </>
      )}

      {needsIncident && (
        <>
          <label>
            {pcm ? "When e happen?" : "When did it happen?"}
            <input type="date" onChange={(e) => set({ incidentDate: e.target.value })} />
          </label>
          <label>
            {pcm
              ? "Wetin happen? (e go stay only for this phone)"
              : "What happened? (kept on this device only)"}
            <textarea rows={3} onChange={(e) => set({ incidentWhat: e.target.value })} />
          </label>
        </>
      )}

      <label>
        {pcm ? "Your name (for the letter — if you want)" : "Your name (for the letter — optional)"}
        <input type="text" onChange={(e) => set({ userName: e.target.value || undefined })} />
      </label>

      <button className="primary" type="submit">
        {t("showMe", lang)}
      </button>
    </form>
  );
}

function FreeTextAsk({ lang }: { lang: Lang }) {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<RetrievalResult | null>(null);
  return (
    <div>
      <div className="asktext">
        <input
          type="search"
          placeholder={t("askPlaceholder", lang)}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setResult(retrieve(q))}
          aria-label={t("askPlaceholder", lang)}
        />
        <button className="primary" onClick={() => setResult(retrieve(q))}>
          {t("ask", lang)}
        </button>
      </div>
      {result &&
        (result.refused ? (
          <div className="refusal">
            <strong>{t("refusalLead", lang)}</strong> {t("refusalRest", lang)}
          </div>
        ) : (
          <div>
            {result.inForce.length > 0 && (
              <section className="panel inforce">
                <span className="chip">{t("inForceChip", lang)}</span>
                <h3>{t("inForceHeading", lang)}</h3>
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
                <span className="chip">{t("proposedChip", lang)}</span>
                <h3>{t("proposedHeading", lang)}</h3>
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
  const [lang, setLang] = useState<Lang>("en");
  const active = useMemo(() => SITUATIONS.find((s) => s.id === situation), [situation]);
  const billStatus = corpusStatus.documents[1];

  return (
    <main>
      <div className="langbar" role="group" aria-label="Language">
        <button
          className={`langbtn ${lang === "en" ? "active" : ""}`}
          onClick={() => setLang("en")}
        >
          English
        </button>
        <button
          className={`langbtn ${lang === "pcm" ? "active" : ""}`}
          onClick={() => setLang("pcm")}
        >
          Pidgin
        </button>
      </div>

      <p className="eyebrow">Lagos · Tenancy Rights · Law vs Bill</p>
      <h1>
        Ẹ̀<em>tọ́</em>
      </h1>
      <p className="tagline">{t("tagline", lang)}</p>

      <div className="status-banner">
        <strong>{t("bannerLead", lang)}</strong>{" "}
        {t("bannerRest", lang).replace("{date}", corpusStatus.as_of)}
      </div>

      {!situation && (
        <>
          <h2>{t("whatHappening", lang)}</h2>
          <div className="situations">
            {SITUATIONS.map((s) => (
              <button key={s.id} onClick={() => setSituation(s.id)}>
                {situationLabel(s.id, lang)}
              </button>
            ))}
          </div>
          <FreeTextAsk lang={lang} />
        </>
      )}

      {situation && !answer && active && (
        <>
          <button className="linklike" onClick={() => setSituation(null)}>
            {t("back", lang)}
          </button>
          <h2>{situationLabel(situation, lang)}</h2>
          <FactsForm
            situation={situation}
            lang={lang}
            onSubmit={(f) => setAnswer(active.answer(f))}
          />
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
            {t("startOver", lang)}
          </button>
          <h2>{situationLabel(active.id, lang)}</h2>
          <AnswerView answer={answer} lang={lang} />
        </>
      )}

      <p className="disclaimer">{t("disclaimer", lang)}</p>
    </main>
  );
}
