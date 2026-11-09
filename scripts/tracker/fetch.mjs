// Tracker fetch (spec §3.2): sweep, pick candidates, fetch, classify, normalize, then write
// every output file at the end, so a failed run leaves the old files untouched.
//   --full          sweep from the start of the Congress
//   --only <ids>    fetch and print these bills; write nothing
//   --dry-run       print what would change; write nothing
//   --no-sweep      skip the list sweeps; refetch the watchlist and the bills already in the files
//   --rebuild       no API calls: re-classify and re-normalize every cached bill (after a
//                   pattern, topic or excerpt change)
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { goOffline, stats } from "./congress.mjs";
import { companionsOf, matchesAny, normalize, ordinal } from "./normalize.mjs";
import { cachedBillIds, fetchBill, sweep } from "./sweep.mjs";
import { toCsv } from "./csv.mjs";

const started = Date.now();
const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1]?.split(",").filter(Boolean) : null;
if (only && !only.length) throw new Error("--only needs ids, e.g. --only s146-119,hr2794-119");
const dryRun = args.includes("--dry-run");
const rebuild = args.includes("--rebuild");
const noSweep = args.includes("--no-sweep") || rebuild;
if (rebuild) goOffline();

const DIR = "content/tracker";
const BILL_DIR = "public/data/tracker/bills";
const CONGRESS_START = "2025-01-03T00:00:00Z";
const seconds = (date) => date.toISOString().slice(0, 19) + "Z";

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT" && fallback !== undefined) return fallback;
    throw err;
  }
}

const config = await readJson(`${DIR}/config.json`);
// Editing the note or the topics shouldn't force a full sweep (topics don't decide inclusion;
// --rebuild applies them).
const unhashed = ["_note", "topics", "topicOverrides"];
const rules = JSON.stringify(config, (key, value) => (unhashed.includes(key) ? undefined : value));
const configHash = createHash("sha1").update(rules).digest("hex").slice(0, 12);
const meta = await readJson(`${DIR}/meta.json`, null);
const prevBills = await readJson(`${DIR}/bills.json`, []);
const prevReview = await readJson(`${DIR}/review.json`, []);

// 1–3. Sweep window, list sweeps, candidates. 4. Fetch (in the loop below).
const now = new Date();
const swept = !only && !noSweep;
const full = args.includes("--full") || !meta?.lastRun || meta.configHash !== configHash;
const fromDateTime = full ? CONGRESS_START : seconds(new Date(Date.parse(meta.lastRun) - 2 * 864e5));
const candidates = new Set(only ?? [...config.watchlist, ...prevBills.map((b) => b.id), ...prevReview.map((r) => r.id)]);
if (rebuild && !only) for (const id of await cachedBillIds()) candidates.add(id);

if (swept) {
  console.log(`Sweep ${full ? "(full) " : ""}from ${fromDateTime}`);
  for (const id of await sweep(config, { fromDateTime, toDateTime: seconds(now) })) candidates.add(id);
}
for (const id of config.exclude) candidates.delete(id);

function printBill(b) {
  console.log(`\n${b.id} ${b.label}: ${b.title}`);
  console.log(`  stage ${b.stage} ${b.stageLabel} · ${b.sponsor.name} (${b.sponsor.party}-${b.sponsor.state}) · cosponsors ${JSON.stringify(b.cosponsors)}`);
  console.log(`  matchedBy ${b.matchedBy.join(", ")} · topics ${b.topics.join(", ") || "none"} · law ${b.law ?? "none"}`);
  for (const m of b.milestones) console.log(`  ${m.date} ${m.label}${m.vote ? ` (roll ${m.vote.roll}: ${m.vote.url})` : ""}`);
  console.log(`  summary ${b.summary ? `${b.summary.version}, ${b.summary.paragraphs.length} paragraphs` : "none"} · text ${b.text?.version ?? "none"} · related ${b.related.length} · cbo ${b.cbo.length}`);
}

// 5. Classify and normalize.
const bills = [];
const review = [];
let done = 0;
for (const id of [...candidates].sort()) {
  const bill = normalize(await fetchBill(id), config);
  if (++done % 25 === 0) console.log(`  fetched ${done}/${candidates.size} (${stats.requests} requests)`);
  if (only) printBill(bill);
  if (bill.matchedBy.length) {
    bills.push(bill);
    continue;
  }
  const hit = bill.summary?.paragraphs.find((p) => matchesAny(config.summaryPatterns, p));
  if (hit) {
    const excerpt = hit.length > 300 ? `${hit.slice(0, 299)}…` : hit;
    review.push({ id: bill.id, label: bill.label, title: bill.title, excerpt, subjects: bill.subjects });
  }
}
const ids = new Set(bills.map((b) => b.id));
for (const b of bills) for (const r of b.related) r.inTracker = ids.has(r.id);
const titles = new Map(bills.map((b) => [b.id, b.title]));
for (const b of bills) b.companions = companionsOf(b, titles);
bills.sort((a, b) => b.latestAction.date.localeCompare(a.latestAction.date) || a.id.localeCompare(b.id));

// 6. Write (or, with --dry-run or --only, don't).
const before = new Map(prevBills.map((b) => [b.id, JSON.stringify(b)]));
const added = bills.filter((b) => !before.has(b.id)).map((b) => b.id);
const changed = bills.filter((b) => before.has(b.id) && before.get(b.id) !== JSON.stringify(b)).map((b) => b.id);
const removed = [...before.keys()].filter((id) => !ids.has(id));
const reviewIds = new Set(review.map((r) => r.id));
const reviewAdded = review.filter((r) => !prevReview.some((p) => p.id === r.id)).length;
const reviewRemoved = prevReview.filter((p) => !reviewIds.has(p.id)).length;

const count = (min, max = 5) => bills.filter((b) => b.stage >= min && b.stage <= max).length;
// A rebuild fetches nothing, so the data is as old as the last fetch.
const fetchedAt = rebuild ? meta.fetchedAt : now.toISOString();

// T8 split for fast loading: the rows the table needs (bundled with the page) and one file
// per bill with what its expanded panel needs (fetched on first open).
const indexRow = (b) => ({
  id: b.id,
  type: b.type,
  number: b.number,
  label: b.label,
  title: b.title,
  sponsor: { name: b.sponsor.name, party: b.sponsor.party, state: b.sponsor.state },
  originChamber: b.originChamber,
  introducedDate: b.introducedDate,
  stage: b.stage,
  stageLabel: b.stageLabel,
  latestAction: b.latestAction,
  cosponsors: { count: b.cosponsors.count },
  topics: b.topics,
});
const panelOf = (b) => ({
  id: b.id,
  summary: b.summary && { version: b.summary.version, date: b.summary.date, excerpt: b.summary.excerpt },
  milestones: b.milestones,
  committees: b.committees,
  cosponsors: b.cosponsors,
  companions: b.companions,
  cbo: b.cbo,
  law: b.law,
  text: b.text,
  congressGovUrl: b.congressGovUrl,
  subjects: b.subjects,
  policyArea: b.policyArea,
});

const files = {
  [`${DIR}/bills.json`]: bills,
  [`${DIR}/review.json`]: review.sort((a, b) => a.id.localeCompare(b.id)),
  [`${DIR}/meta.json`]: {
    lastRun: swept ? seconds(now) : (meta?.lastRun ?? null),
    fetchedAt,
    congress: config.congress,
    stages: Object.fromEntries([1, 2, 3, 4, 5].map((s) => [s, count(s, s)])),
    included: bills.length,
    review: review.length,
    requests: rebuild ? meta.requests : stats.requests,
    configHash,
  },
  "content/bill-stats.json": {
    placeholder: false,
    congress: ordinal(config.congress),
    asOf: fetchedAt.slice(0, 10),
    source: "Congress.gov",
    introduced: bills.length,
    reported: count(2),
    passedOneChamber: count(3),
    becameLaw: count(5),
  },
};

if (!dryRun && !only) {
  await mkdir(DIR, { recursive: true });
  await mkdir("public/data", { recursive: true });
  for (const [file, data] of Object.entries(files)) await writeFile(file, JSON.stringify(data, null, 2) + "\n");
  // One row per line: compact, and still a readable diff.
  await writeFile(`${DIR}/index.json`, `[\n${bills.map((b) => JSON.stringify(indexRow(b))).join(",\n")}\n]\n`);
  await writeFile(`public/data/ai-bills-${config.congress}.csv`, toCsv(bills));
  await mkdir(BILL_DIR, { recursive: true });
  for (const b of bills) await writeFile(`${BILL_DIR}/${b.id}.json`, JSON.stringify(panelOf(b)));
  for (const file of await readdir(BILL_DIR)) if (!ids.has(file.replace(/\.json$/, ""))) await rm(`${BILL_DIR}/${file}`);
}

if (only) {
  const excluded = [...candidates].filter((id) => !ids.has(id));
  if (excluded.length) console.log(`\nNot included (no watchlist, subject or title match): ${excluded.join(", ")}`);
  console.log(`\nrequests ${stats.requests} (cache hits ${stats.cacheHits}) · ${((Date.now() - started) / 1000).toFixed(1)}s · nothing written`);
} else {
  const list = (label, xs) => `${label} ${xs.length}${xs.length ? ` (${xs.slice(0, 10).join(", ")}${xs.length > 10 ? ", …" : ""})` : ""}`;
  console.log(`\n${dryRun ? "DRY RUN, nothing written. " : ""}requests ${stats.requests} (cache hits ${stats.cacheHits})`);
  console.log(`included ${bills.length} · review ${review.length} · stages ${JSON.stringify(files[`${DIR}/meta.json`].stages)}`);
  console.log(`changes: ${list("added", added)} · ${list("changed", changed)} · ${list("removed", removed)} · review +${reviewAdded} −${reviewRemoved}`);
  console.log(`time ${((Date.now() - started) / 1000).toFixed(1)}s`);
}
