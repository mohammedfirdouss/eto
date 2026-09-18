import { beforeEach, describe, expect, it } from "vitest";
import { clearIncidents, incidentsText, listIncidents, saveIncident } from "./incidents";

// minimal localStorage stub for the node test environment
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
};

describe("incident log", () => {
  beforeEach(() => store.clear());

  it("persists, lists, and clears incidents", () => {
    expect(listIncidents()).toHaveLength(0);
    saveIncident({ incidentDate: "2026-09-10", incidentWhat: "locks changed" }, "2026-09-17T10:00:00Z");
    const n = saveIncident({ incidentDate: "2026-09-12", incidentWhat: "door removed" }, "2026-09-17T11:00:00Z");
    expect(n).toBe(2);
    expect(listIncidents()[1].facts.incidentWhat).toBe("door removed");
    clearIncidents();
    expect(listIncidents()).toHaveLength(0);
  });

  it("renders a printable log citing s.44", () => {
    saveIncident({ incidentDate: "2026-09-10", incidentWhat: "locks changed", landlordName: "Mr X" }, "2026-09-17T10:00:00Z");
    const text = incidentsText(listIncidents());
    expect(text).toContain("INCIDENT 1");
    expect(text).toContain("locks changed");
    expect(text).toContain("s.44");
    expect(text).toContain("this device only");
    expect(text).not.toMatch(/={4,}/);
  });

  it("survives corrupted storage", () => {
    store.set("eto-incidents", "{not json");
    expect(listIncidents()).toEqual([]);
  });
});
