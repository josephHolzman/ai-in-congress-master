import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { milestonesOf, stageOf } from "./stage.mjs";

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const s146 = fixture("s146-detail.json").bill;
const s146Actions = fixture("s146-actions.json").actions;
const hr1283Actions = fixture("hr1283-actions.json").actions;
const S146_URL = "https://www.congress.gov/bill/119th-congress/senate-bill/146";

// Synthetic actions in the API's shape: LoC copies carry a code, Senate copies don't.
const loc = (actionDate, actionCode, text, extra = {}) => ({
  actionDate,
  actionCode,
  text,
  type: "Floor",
  sourceSystem: { code: 9, name: "Library of Congress" },
  ...extra,
});
const senate = (actionDate, text, type = "Floor") => ({ actionDate, text, type, sourceSystem: { name: "Senate" } });
const introH = loc("2025-03-01", "1000", "Introduced in House", { type: "IntroReferral" });
const introS = loc("2025-03-01", "10000", "Introduced in Senate", { type: "IntroReferral" });
const noLaw = { laws: [] };

describe("stageOf", () => {
  test("S. 146 (fixture) became law", () => {
    expect(stageOf(s146, s146Actions)).toEqual({ stage: 5, stageLabel: "Became law" });
  });

  test("S. 146 is stage 5 from its actions alone, without detail.laws", () => {
    expect(stageOf(noLaw, s146Actions).stage).toBe(5);
  });

  test("H.R. 1283 (fixture) is introduced", () => {
    expect(stageOf(noLaw, hr1283Actions)).toEqual({ stage: 1, stageLabel: "Introduced" });
  });

  test("stage 2: a House committee report", () => {
    const actions = [loc("2025-05-01", "5000", "Reported (Amended) by the Committee on Energy and Commerce."), introH];
    expect(stageOf(noLaw, actions)).toEqual({ stage: 2, stageLabel: "Reported by committee" });
  });

  test("stage 2: a Senate report without a code, by its text", () => {
    const actions = [senate("2025-05-01", "Committee on Commerce. Reported by Senator Cruz without amendment.", "Committee"), introS];
    expect(stageOf(noLaw, actions).stage).toBe(2);
  });

  test("stage 2: a Senate discharge", () => {
    const actions = [loc("2025-05-01", "14500", "Senate Committee on Commerce discharged by Unanimous Consent."), introS];
    expect(stageOf(noLaw, actions).stage).toBe(2);
  });

  test("stage 3: passed House", () => {
    const actions = [loc("2025-06-01", "8000", "Passed/agreed to in House: On passage Passed by recorded vote."), introH];
    expect(stageOf(noLaw, actions)).toEqual({ stage: 3, stageLabel: "Passed House" });
  });

  test("stage 3: passed Senate", () => {
    const actions = [loc("2025-06-01", "17000", "Passed/agreed to in Senate: Passed Senate by Unanimous Consent."), introS];
    expect(stageOf(noLaw, actions)).toEqual({ stage: 3, stageLabel: "Passed Senate" });
  });

  test("stage 4: passed both chambers", () => {
    const actions = [
      loc("2025-07-01", "8000", "Passed/agreed to in House: On passage Passed without objection."),
      loc("2025-06-01", "17000", "Passed/agreed to in Senate: Passed Senate by Unanimous Consent."),
      introS,
    ];
    expect(stageOf(noLaw, actions)).toEqual({ stage: 4, stageLabel: "Passed both chambers" });
  });

  test("stage 4: presented to the President", () => {
    const actions = [loc("2025-07-02", "28000", "Presented to President."), introS];
    expect(stageOf(noLaw, actions)).toEqual({ stage: 4, stageLabel: "Passed both chambers" });
  });

  test("stage 4: vetoed", () => {
    const actions = [
      loc("2025-07-10", "31000", "Vetoed by President."),
      loc("2025-07-02", "28000", "Presented to President."),
      loc("2025-07-01", "8000", "Passed/agreed to in House: On passage Passed."),
      loc("2025-06-01", "17000", "Passed/agreed to in Senate: Passed Senate."),
      introS,
    ];
    expect(stageOf(noLaw, actions)).toEqual({ stage: 4, stageLabel: "Vetoed" });
  });
});

describe("milestonesOf", () => {
  test("S. 146: one per kind, in date order, with the House roll call", () => {
    expect(milestonesOf(s146Actions, S146_URL)).toEqual([
      { date: "2025-01-16", label: "Introduced in the Senate" },
      { date: "2025-01-16", label: "Referred to committee" },
      { date: "2025-02-13", label: "Discharged from committee" },
      { date: "2025-02-13", label: "Passed Senate" },
      {
        date: "2025-04-28",
        label: "Passed House",
        vote: { chamber: "House", roll: 104, url: "https://clerk.house.gov/Votes/2025104" },
      },
      { date: "2025-05-19", label: "Presented to the President" },
      { date: "2025-05-19", label: "Became Public Law 119-12" },
    ]);
  });

  test("a committee report is labeled Reported, a discharge Discharged (both stage 2)", () => {
    const report = loc("2025-05-01", "5000", "Reported (Amended) by the Committee on Energy and Commerce.");
    const discharge = loc("2025-05-01", "14500", "Senate Committee on Commerce discharged by Unanimous Consent.");
    expect(milestonesOf([report], "")[0].label).toBe("Reported by committee");
    expect(milestonesOf([discharge], "")[0].label).toBe("Discharged from committee");
    expect(stageOf(noLaw, [discharge])).toEqual({ stage: 2, stageLabel: "Reported by committee" });
  });

  test("H.R. 1283: introduced and referred", () => {
    expect(milestonesOf(hr1283Actions, "")).toEqual([
      { date: "2025-02-13", label: "Introduced in the House" },
      { date: "2025-02-13", label: "Referred to committee" },
    ]);
  });

  test("a Senate roll call links to the bill's actions page", () => {
    const vote = { chamber: "Senate", rollNumber: 212, date: "2025-06-01T15:00:00Z", url: "https://www.senate.gov/x.xml" };
    const actions = [loc("2025-06-01", "17000", "Passed/agreed to in Senate: Passed Senate by Yea-Nay Vote.", { recordedVotes: [vote] })];
    expect(milestonesOf(actions, S146_URL)[0].vote).toEqual({ chamber: "Senate", roll: 212, url: `${S146_URL}/all-actions` });
  });
});
