/**
 * Deterministic lexical retrieval (BM25) over the jurisdiction pack.
 *
 * Deliberately not a vector store: the corpus is 94 units, retrieval must run
 * offline on-device, and every score must be explainable. If nothing clears
 * the refusal threshold the caller gets an empty result and must say
 * "I don't know" and route to a human body (ETO.md §6 rule 1).
 */
import { allUnits, CorpusUnit } from "./corpus";

const STOPWORDS = new Set(
  `a an and are as at be by for from has he in is it its of on or shall that
   the to was were will with this any such where who under upon may not other
   his her their been have had which than then there these those`.split(/\s+/),
);

/** Domain synonyms folded to one token so lay phrasing meets statute phrasing. */
const SYNONYMS: Record<string, string> = {
  evict: "possession",
  eviction: "possession",
  evicted: "possession",
  quit: "notice",
  fee: "commission",
  fees: "commission",
  // self-help eviction: statute vocabulary is "forcibly eject / threatens or
  // molests / demolishes / damages" (s.44, cl.43) — fold lay words onto it
  lock: "eject",
  locked: "eject",
  lockout: "eject",
  door: "eject",
  doors: "eject",
  force: "forcibly",
  forced: "forcibly",
  thug: "molest",
  thugs: "molest",
  harass: "molest",
  harassed: "molest",
  threat: "threaten",
  threatened: "threaten",
  // Nigerian Pidgin phrasings — fold onto statute vocabulary so typed Pidgin
  // queries clear the refusal threshold like their English equivalents
  comot: "eject",
  commot: "eject",
  pursue: "eject",
  chase: "eject",
  owe: "arrear",
  owing: "arrear",
  notis: "notice",
  moni: "rent",
  wahala: "dispute",
  increase: "rent_increase",
  increased: "rent_increase",
  increment: "rent_increase",
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => SYNONYMS[t] ?? (t.endsWith("s") && t.length > 3 ? t.slice(0, -1) : t));
}

interface IndexedUnit {
  unit: CorpusUnit;
  tf: Map<string, number>;
  len: number;
}

const K1 = 1.4;
const B = 0.6;

class Bm25Index {
  private docs: IndexedUnit[] = [];
  private df = new Map<string, number>();
  private avgLen = 0;

  constructor(units: CorpusUnit[]) {
    for (const unit of units) {
      const tokens = tokenize(`${unit.title} ${unit.title} ${unit.text}`);
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      this.docs.push({ unit, tf, len: tokens.length });
    }
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / this.docs.length;
  }

  score(queryTokens: string[], doc: IndexedUnit): number {
    const n = this.docs.length;
    let score = 0;
    for (const t of new Set(queryTokens)) {
      const df = this.df.get(t);
      if (!df) continue;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      const tf = doc.tf.get(t) ?? 0;
      score += idf * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * doc.len) / this.avgLen)));
    }
    return score;
  }

  search(query: string, k: number): ScoredUnit[] {
    const q = tokenize(query);
    if (q.length === 0) return [];
    return this.docs
      .map((d) => ({ unit: d.unit, score: this.score(q, d) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}

export interface ScoredUnit {
  unit: CorpusUnit;
  score: number;
}

export interface RetrievalResult {
  /** Units from the law in force, above threshold. */
  inForce: ScoredUnit[];
  /** Units from the pending bill, above threshold. */
  proposed: ScoredUnit[];
  /** True when nothing cleared the threshold — caller must refuse + route. */
  refused: boolean;
}

const index = new Bm25Index(allUnits);

/**
 * Refusal threshold: a hit must score at least MIN_ABS and at least
 * MIN_REL × the top score. Absolute floor rejects out-of-domain queries that
 * only graze common tokens; relative floor trims the weak tail.
 */
const MIN_ABS = 4.0;
const MIN_REL = 0.35;

export function retrieve(query: string, k = 4): RetrievalResult {
  const hits = index.search(query, k * 4);
  const top = hits[0]?.score ?? 0;
  const kept = hits.filter((h) => h.score >= MIN_ABS && h.score >= MIN_REL * top);
  const inForce = kept.filter((h) => h.unit.status === "IN_FORCE").slice(0, k);
  const proposed = kept.filter((h) => h.unit.status !== "IN_FORCE").slice(0, k);
  return { inForce, proposed, refused: inForce.length + proposed.length === 0 };
}
