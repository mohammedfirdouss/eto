/**
 * On-device incident log (ETO.md §3.4, the Safety leg).
 *
 * Lock-out incidents are saved to localStorage only — no account, no server,
 * nothing leaves the device unless the user downloads the record themselves.
 * That privacy stance is deliberate; it is also why "delete all" is one tap.
 */
import { Facts } from "./situations";

export interface StoredIncident {
  savedAt: string; // ISO datetime
  facts: Facts;
}

const KEY = "eto-incidents";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // storage blocked (private mode) — degrade to no persistence
  }
}

export function listIncidents(): StoredIncident[] {
  const s = storage();
  if (!s) return [];
  try {
    return JSON.parse(s.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveIncident(facts: Facts, savedAt: string): number {
  const s = storage();
  if (!s) return 0;
  const all = listIncidents();
  all.push({ savedAt, facts });
  s.setItem(KEY, JSON.stringify(all));
  return all.length;
}

export function clearIncidents(): void {
  storage()?.removeItem(KEY);
}

/** Printable record of every stored incident, for mediation or court. */
export function incidentsText(incidents: StoredIncident[]): string {
  const parts: string[] = [
    `INCIDENT LOG — ${incidents.length} record(s)`,
    "Kept on this device only. Prepared with Ẹ̀tọ́ — informational, not legal advice.",
    "",
  ];
  incidents.forEach((it, i) => {
    parts.push(`INCIDENT ${i + 1} — recorded ${it.savedAt}`);
    if (it.facts.incidentDate) parts.push(`  Date of incident: ${it.facts.incidentDate}`);
    if (it.facts.premisesAddress) parts.push(`  Premises: ${it.facts.premisesAddress}`);
    if (it.facts.landlordName) parts.push(`  Landlord/agent: ${it.facts.landlordName}`);
    if (it.facts.incidentWhat) parts.push(`  What happened: ${it.facts.incidentWhat}`);
    parts.push("");
  });
  parts.push(
    "Relevant law: s.44(1), Tenancy Law Cap. T1 — forcible ejection, threats or damage is an offence. Bill cl.43 would raise the penalty.",
    "",
  );
  return parts.join("\n");
}
