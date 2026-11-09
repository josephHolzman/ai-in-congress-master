import { describe, expect, it } from "vitest";
import {
  DEFAULTS,
  type FinderBill,
  type FinderState,
  filterBills,
  matchesQuery,
  paginate,
  parseState,
  revealBill,
  sortBills,
  toSearch,
  topicCounts,
} from "./finder";

const bill = (over: Partial<FinderBill>): FinderBill => ({
  id: `${(over.type ?? "HR").toLowerCase()}${over.number ?? 1}-119`,
  type: "HR",
  number: 1,
  label: "H.R. 1",
  title: "A bill",
  sponsor: { name: "Rep. Pat Doe", party: "D", state: "CA" },
  originChamber: "House",
  stage: 1,
  topics: [],
  latestAction: { date: "2025-01-01", text: "Introduced" },
  introducedDate: "2025-01-01",
  cosponsors: { count: 0 },
  ...over,
});

const BILLS = [
  bill({
    number: 2794,
    label: "H.R. 2794",
    title: "NO FAKES Act of 2025",
    sponsor: {
      name: "Rep. María Elvira Salazar",
      party: "R",
      state: "FL",
    },
    stage: 1,
    topics: ["deepfakes"],
    latestAction: { date: "2025-04-09", text: "Referred" },
    introducedDate: "2025-04-09",
    cosponsors: { count: 21 },
  }),
  bill({
    type: "S",
    number: 146,
    label: "S. 146",
    title: "TAKE IT DOWN Act",
    originChamber: "Senate",
    stage: 5,
    topics: ["deepfakes", "child-safety"],
    latestAction: { date: "2025-05-19", text: "Became law" },
    introducedDate: "2025-01-16",
    cosponsors: { count: 21 },
  }),
  bill({
    number: 1460,
    label: "H.R. 1460",
    title: "Chip Security Act",
    stage: 2,
    topics: ["national-security"],
    latestAction: { date: "2025-03-01", text: "Reported" },
    introducedDate: "2025-02-20",
    cosponsors: { count: 3 },
  }),
  bill({
    type: "SJRES",
    number: 12,
    label: "S.J.Res. 12",
    title: "A joint resolution on algorithmic pricing",
    originChamber: "Senate",
    stage: 3,
    latestAction: { date: "2025-02-01", text: "Passed Senate" },
    introducedDate: "2025-01-30",
  }),
];
const TOPICS = ["deepfakes", "child-safety", "national-security"];
const ids = (bills: FinderBill[]) => bills.map((b) => b.label);
const state = (over: Partial<FinderState>) => ({ ...DEFAULTS, ...over });

describe("search", () => {
  it.each([
    ["hr 2794", "H.R. 2794"],
    ["H.R.2794", "H.R. 2794"],
    ["2794", "H.R. 2794"],
    ["s146", "S. 146"],
    ["S. 146", "S. 146"],
    ["sjres 12", "S.J.Res. 12"],
  ])("%s finds %s", (q, label) => {
    expect(ids(filterBills(BILLS, state({ q })))).toEqual([label]);
  });

  it("is diacritic- and case-insensitive on the sponsor", () => {
    expect(ids(filterBills(BILLS, state({ q: "maria" })))).toEqual([
      "H.R. 2794",
    ]);
    expect(ids(filterBills(BILLS, state({ q: "SALAZAR" })))).toEqual([
      "H.R. 2794",
    ]);
  });

  it("matches every word of the title, in any order", () => {
    expect(matchesQuery(BILLS[1], "down take")).toBe(true);
    expect(matchesQuery(BILLS[1], "take it up")).toBe(false);
  });

  it.each([
    ["hr", ["H.R. 2794", "H.R. 1460"]],
    ["H.R.", ["H.R. 2794", "H.R. 1460"]],
    ["s", ["S. 146"]],
    ["S.", ["S. 146"]],
    ["hjres", []],
    ["sjres", ["S.J.Res. 12"]],
  ])("a bill type alone (%s) lists that type", (q, labels) => {
    expect(ids(filterBills(BILLS, state({ q })))).toEqual(labels);
  });

  it("doesn't match a number to the wrong bill type", () => {
    expect(ids(filterBills(BILLS, state({ q: "s 2794" })))).toEqual([]);
  });

  it("an empty or blank query matches everything", () => {
    expect(filterBills(BILLS, state({ q: "  " }))).toHaveLength(4);
  });
});

describe("filters", () => {
  it("chamber is the originating chamber", () => {
    expect(ids(filterBills(BILLS, state({ chamber: "senate" })))).toEqual([
      "S. 146",
      "S.J.Res. 12",
    ]);
    expect(filterBills(BILLS, state({ chamber: "house" }))).toHaveLength(2);
  });

  it("status is the exact stage", () => {
    expect(ids(filterBills(BILLS, state({ status: "5" })))).toEqual(["S. 146"]);
    expect(ids(filterBills(BILLS, state({ status: "2" })))).toEqual([
      "H.R. 1460",
    ]);
    expect(filterBills(BILLS, state({ status: "4" }))).toEqual([]);
  });

  it("topic", () => {
    expect(ids(filterBills(BILLS, state({ topic: "deepfakes" })))).toEqual([
      "H.R. 2794",
      "S. 146",
    ]);
  });

  it("filters combine", () => {
    expect(
      ids(filterBills(BILLS, state({ topic: "deepfakes", chamber: "house" }))),
    ).toEqual(["H.R. 2794"]);
  });
});

describe("sort", () => {
  it("latest action, newest first", () => {
    expect(ids(sortBills(BILLS, "latest"))).toEqual([
      "S. 146",
      "H.R. 2794",
      "H.R. 1460",
      "S.J.Res. 12",
    ]);
  });
  it("introduced, newest first", () => {
    expect(ids(sortBills(BILLS, "introduced"))).toEqual([
      "H.R. 2794",
      "H.R. 1460",
      "S.J.Res. 12",
      "S. 146",
    ]);
  });
  it("most cosponsors, ties in input order", () => {
    expect(ids(sortBills(BILLS, "cosponsors"))).toEqual([
      "H.R. 2794",
      "S. 146",
      "H.R. 1460",
      "S.J.Res. 12",
    ]);
  });
  it("bill number: by type, then number", () => {
    expect(ids(sortBills(BILLS, "number"))).toEqual([
      "H.R. 1460",
      "H.R. 2794",
      "S. 146",
      "S.J.Res. 12",
    ]);
  });
  it("doesn't mutate its input", () => {
    const before = ids(BILLS);
    sortBills(BILLS, "number");
    expect(ids(BILLS)).toEqual(before);
  });
});

describe("topic counts", () => {
  it("count every topic under the other filters, ignoring the topic", () => {
    expect(
      topicCounts(
        BILLS,
        state({ q: "act", topic: "national-security" }),
        TOPICS,
      ),
    ).toEqual({
      "": 3,
      deepfakes: 2,
      "child-safety": 1,
      "national-security": 1,
    });
  });
  it("follow chamber and status too", () => {
    expect(topicCounts(BILLS, state({ chamber: "house" }), TOPICS)).toEqual({
      "": 2,
      deepfakes: 1,
      "child-safety": 0,
      "national-security": 1,
    });
  });
});

describe("paging", () => {
  it("the first page", () => {
    expect(paginate(220, 1, 25)).toEqual({
      page: 1,
      pages: 9,
      start: 1,
      end: 25,
    });
  });
  it("the last, partial page", () => {
    expect(paginate(220, 9, 25)).toEqual({
      page: 9,
      pages: 9,
      start: 201,
      end: 220,
    });
  });
  it("a page past the end clamps to the last", () => {
    expect(paginate(30, 7, 25)).toEqual({
      page: 2,
      pages: 2,
      start: 26,
      end: 30,
    });
  });
  it("no results is one empty page", () => {
    expect(paginate(0, 3, 25)).toEqual({ page: 1, pages: 1, start: 0, end: 0 });
  });
});

describe("reveal a bill (hash links)", () => {
  it("keeps a state that already shows it, on its page", () => {
    expect(
      revealBill(BILLS, state({ topic: "deepfakes" }), "s146-119"),
    ).toEqual(state({ topic: "deepfakes" }));
    // Latest-action order: S. 146, H.R. 2794, H.R. 1460, S.J.Res. 12.
    expect(
      revealBill(BILLS, state({ per: 10, page: 3 }), "hr1460-119"),
    ).toEqual(state({ per: 10, page: 1 }));
  });
  it("clears only the filters that hide it, and keeps sort and per", () => {
    const hidden = state({
      q: "act",
      chamber: "house",
      status: "1",
      topic: "deepfakes",
      sort: "number",
      per: 10,
      page: 2,
    });
    // S. 146 matches "act" and the topic, but not the chamber or status.
    expect(revealBill(BILLS, hidden, "s146-119")).toEqual(
      state({ q: "act", topic: "deepfakes", sort: "number", per: 10 }),
    );
  });
  it("goes to the page that holds it", () => {
    // Bill-number order: H.R. 1460, H.R. 2794, S. 146, S.J.Res. 12.
    const per = 1 as unknown as FinderState["per"];
    expect(
      revealBill(BILLS, state({ sort: "number", per }), "s146-119"),
    ).toEqual(state({ sort: "number", per, page: 3 }));
  });
  it("is null for an id that isn't a bill", () => {
    expect(revealBill(BILLS, DEFAULTS, "main")).toBeNull();
  });
});

describe("URL state", () => {
  it("defaults are left out", () => {
    expect(toSearch(DEFAULTS)).toBe("");
    expect(toSearch(state({ topic: "deepfakes", page: 2, per: 50 }))).toBe(
      "?topic=deepfakes&page=2&per=50",
    );
  });
  it("round-trips", () => {
    const s = state({
      q: "hr 2794",
      chamber: "house",
      status: "3",
      topic: "deepfakes",
      sort: "cosponsors",
      page: 3,
      per: 10,
    });
    expect(parseState(toSearch(s), TOPICS)).toEqual(s);
  });
  it("10 per page is the default; another per page round-trips", () => {
    expect(parseState("", TOPICS).per).toBe(10);
    expect(toSearch(state({ per: 10 }))).toBe("");
    expect(toSearch(state({ per: 25 }))).toBe("?per=25");
    expect(parseState("?per=25", TOPICS).per).toBe(25);
  });
  it("unknown values fall back to defaults", () => {
    expect(
      parseState(
        "?chamber=moon&status=9&topic=nope&sort=x&page=-2&per=7",
        TOPICS,
      ),
    ).toEqual(DEFAULTS);
  });
});
