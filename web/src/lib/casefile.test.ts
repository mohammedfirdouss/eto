import { describe, expect, it } from "vitest";
import { buildCaseFile } from "./casefile";
import { answerQuitNotice } from "./situations";

const FACTS = {
  tenancyType: "yearly" as const,
  noticeServedOn: "2026-09-01",
  statedExpiry: "2026-10-01",
  userName: "Test Tenant",
  premisesAddress: "1 Test Street, Surulere",
};

describe("case file export", () => {
  it("assembles facts, computed dates, cited points, and routing", () => {
    const answer = answerQuitNotice(FACTS);
    const file = buildCaseFile(answer, FACTS, "en", "2026-09-17");
    expect(file).toContain("CASE FILE");
    expect(file).toContain("Test Tenant");
    expect(file).toContain("2027-03-01"); // computed earliest lawful expiry
    expect(file).toContain("[s.13]");
    expect(file).toContain("[cl.14]");
    expect(file).toContain("NOT LAW");
    expect(file).toMatch(/Citizens.? Mediation/);
    expect(file).toContain("Status verified");
    expect(file).toContain("not legal advice");
  });

  it("renders in Pidgin", () => {
    const answer = answerQuitNotice(FACTS);
    const file = buildCaseFile(answer, FACTS, "pcm", "2026-09-17");
    expect(file).toContain("WETIN HAPPEN");
    expect(file).toContain("LAW WEY DEY WORK TODAY");
  });

  it("omits facts the user did not provide", () => {
    const answer = answerQuitNotice(FACTS);
    const file = buildCaseFile(answer, FACTS, "en", "2026-09-17");
    expect(file).not.toContain("Fee demanded");
    expect(file).not.toContain("undefined");
  });
});

it("contains no divider rule lines", () => {
  const answer = answerQuitNotice(FACTS);
  const file = buildCaseFile(answer, FACTS, "en", "2026-09-17");
  expect(file).not.toMatch(/={4,}|-{4,}/);
});
