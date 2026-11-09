// Stage (1–5) and milestones from a bill's detail and actions (tracker spec §3.3).
// Rules key on the Library of Congress codes, which both chambers' bills carry. The text
// patterns catch copies without a code (Senate actions) and codes T1 couldn't observe.

const RULES = {
  law: { codes: [], re: /^Became Public Law No:/ },
  signedOrLaw: { codes: ["36000"], re: /^Became Public Law No:/ },
  vetoed: { codes: ["31000"], re: /^Vetoed by President/ },
  presented: { codes: ["28000"], re: /^Presented to President/ },
  passedHouse: { codes: ["8000"], re: /^Passed\/agreed to in House/ },
  passedSenate: { codes: ["17000"], re: /^Passed\/agreed to in Senate/ },
  reported: { codes: ["5000", "14000", "14500"], re: /^Reported\b|\. Reported by |discharged/i },
  introduced: { codes: ["1000", "10000"], re: /^Introduced in (House|Senate)/ },
};

const matches = (action, { codes, re }) => codes.includes(action.actionCode) || re.test(action.text ?? "");
const any = (actions, rule) => actions.some((a) => matches(a, rule));

export function stageOf(detail, actions) {
  if (detail.laws?.length || any(actions, RULES.signedOrLaw)) return { stage: 5, stageLabel: "Became law" };
  const house = any(actions, RULES.passedHouse);
  const senate = any(actions, RULES.passedSenate);
  if (any(actions, RULES.vetoed)) return { stage: 4, stageLabel: "Vetoed" };
  if ((house && senate) || any(actions, RULES.presented)) return { stage: 4, stageLabel: "Passed both chambers" };
  if (house) return { stage: 3, stageLabel: "Passed House" };
  if (senate) return { stage: 3, stageLabel: "Passed Senate" };
  if (any(actions, RULES.reported)) return { stage: 2, stageLabel: "Reported by committee" };
  return { stage: 1, stageLabel: "Introduced" };
}

// House roll calls have a human page (T1 #11); a Senate vote links to the bill's actions.
function voteOf(action, congressGovUrl) {
  const v = action.recordedVotes?.[0];
  if (!v) return undefined;
  const url =
    v.chamber === "House"
      ? `https://clerk.house.gov/Votes/${(v.date ?? action.actionDate).slice(0, 4)}${v.rollNumber}`
      : `${congressGovUrl}/all-actions`;
  return { chamber: v.chamber, roll: v.rollNumber, url };
}

// In display order; ties on a date keep this order.
const KINDS = [
  ["introduced", (a) => matches(a, RULES.introduced), (a) => a.text.replace(/^Introduced in /, "Introduced in the ")],
  ["referred", (a) => a.type === "IntroReferral" && /referred to/i.test(a.text), () => "Referred to committee"],
  // A discharge counts as stage 2, but it isn't a report, so it keeps its own label.
  [
    "reported",
    (a) => matches(a, RULES.reported),
    (a) => (a.actionCode === "14500" || /discharged/i.test(a.text ?? "") ? "Discharged from committee" : "Reported by committee"),
  ],
  ["passedHouse", (a) => matches(a, RULES.passedHouse), () => "Passed House"],
  ["passedSenate", (a) => matches(a, RULES.passedSenate), () => "Passed Senate"],
  ["resolving", (a) => a.type === "ResolvingDifferences", () => "Resolving differences"],
  ["presented", (a) => matches(a, RULES.presented), () => "Presented to the President"],
  ["law", (a) => matches(a, RULES.law), (a) => `Became Public Law ${a.text.match(/No:\s*([\d-]+)/)?.[1] ?? ""}`.trim()],
  ["vetoed", (a) => matches(a, RULES.vetoed), () => "Vetoed"],
];

/** One milestone per kind (the latest), in date order. Passages carry their roll call. */
export function milestonesOf(actions, congressGovUrl) {
  const found = [];
  KINDS.forEach(([, test, label], order) => {
    const hits = actions.filter(test).sort((a, b) => b.actionDate.localeCompare(a.actionDate));
    if (!hits.length) return;
    // The same event appears once per source system; take the vote from whichever copy has it.
    const latest = hits.filter((a) => a.actionDate === hits[0].actionDate);
    const vote = latest.map((a) => voteOf(a, congressGovUrl)).find(Boolean);
    found.push({ order, milestone: { date: hits[0].actionDate, label: label(hits[0]), ...(vote && { vote }) } });
  });
  return found
    .sort((a, b) => a.milestone.date.localeCompare(b.milestone.date) || a.order - b.order)
    .map((f) => f.milestone);
}
