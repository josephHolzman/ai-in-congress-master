// T1 probe (tracker spec §2.4): checks each ⚠ against live responses and prints a
// compact report. Never prints full payloads, URLs with the key, or the key.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { get, paginate, stats } from "./congress.mjs";

const FIXTURES = path.join("scripts", "tracker", "fixtures");
const BILLS = [
  ["s", 146],
  ["hr", 2794],
  ["hr", 1283],
  ["hr", 1121],
];
const short = (s, n = 60) => String(s ?? "").replace(/\s+/g, " ").slice(0, n);
const keys = (o) => Object.keys(o ?? {}).join(", ");
const h = (title) => console.log(`\n## ${title}`);

async function status(apiPath, params, auth) {
  try {
    await get(apiPath, params, { auth });
    return "200";
  } catch (err) {
    return err.message.replace(/^.*: /, "");
  }
}

// 1. Auth: header and query fallback (never cached, so each run sends both).
h("1. auth");
console.log("X-Api-Key header:", await status("/bill/119/s/146", {}, "header"));
console.log("api_key= query:  ", await status("/bill/119/s/146", {}, "query"));

// Detail for each bill; its update dates version every sub-endpoint's cache.
const detail = {};
const version = {};
for (const [type, number] of BILLS) {
  const id = `${type}${number}`;
  detail[id] = (await get(`/bill/119/${type}/${number}`, {}, { cacheVersion: "probe" })).bill;
  version[id] = `${detail[id].updateDate}|${detail[id].updateDateIncludingText}`;
}
const sub = (id, endpoint, itemsKey) => {
  const [, type, number] = id.match(/^([a-z]+)(\d+)$/);
  return paginate(`/bill/119/${type}/${number}/${endpoint}`, {}, itemsKey, { cacheVersion: version[id] });
};

// 2. Detail fields for S. 146.
h("2. detail s146");
const d = detail.s146;
console.log("keys:", keys(d));
console.log("laws:", JSON.stringify(d.laws));
console.log("cboCostEstimates:", JSON.stringify(d.cboCostEstimates)?.slice(0, 300));
console.log("sponsors[0] keys:", keys(d.sponsors?.[0]));
console.log("cosponsors:", JSON.stringify(d.cosponsors));
console.log("policyArea:", JSON.stringify(d.policyArea), "| originChamber:", d.originChamber, "| introducedDate:", d.introducedDate);
console.log("latestAction:", JSON.stringify(d.latestAction));
console.log("updateDate:", d.updateDate, "| updateDateIncludingText:", d.updateDateIncludingText);

// 3. List filters and sort on /bill/119/s.
h("3. /bill/119/s filters");
const all = await get("/bill/119/s", { limit: 1 });
const from = "2025-06-01T00:00:00Z";
const to = "2025-06-30T23:59:59Z";
const win = await get("/bill/119/s", { fromDateTime: from, toDateTime: to, sort: "updateDate desc", limit: 250 });
const asc = await get("/bill/119/s", { fromDateTime: from, toDateTime: to, sort: "updateDate asc", limit: 5 });
const inWindow = win.bills.every((b) => b.updateDate >= from.slice(0, 10) && b.updateDate <= "2025-06-30T23:59:59Z");
const dates = win.bills.map((b) => b.updateDate);
const isDesc = dates.every((x, i) => i === 0 || dates[i - 1] >= x);
console.log(`count all ${all.pagination.count}, in window ${win.pagination.count}; items ${win.bills.length}`);
console.log(`all updateDate in window: ${inWindow}; desc order: ${isDesc}; first/last ${dates[0]} / ${dates.at(-1)}`);
console.log(`asc first: ${asc.bills[0]?.updateDate}`);
console.log("list item keys:", keys(win.bills[0]));
console.log("pagination.next:", win.pagination.next ? new URL(win.pagination.next).search.replace(/api_key=[^&]*/, "api_key=REDACTED") : "none");

// 4. Summaries since the start of the 119th.
h("4. /summaries/119/hr");
const sums = await get("/summaries/119/hr", { fromDateTime: "2025-01-03T00:00:00Z", limit: 1 });
const s0 = sums.summaries[0];
console.log("pagination.count:", sums.pagination.count);
console.log("item keys:", keys(s0), "| bill keys:", keys(s0?.bill));
console.log("text:", short(s0?.text));
console.log("pagination.next:", sums.pagination.next ? new URL(sums.pagination.next).search.replace(/api_key=[^&]*/, "api_key=REDACTED") : "none");

// 5. Subjects.
h("5. subjects");
for (const [type, number] of BILLS) {
  const id = `${type}${number}`;
  const [, t, n] = id.match(/^([a-z]+)(\d+)$/);
  const res = await get(`/bill/119/${t}/${n}/subjects`, { limit: 250 }, { cacheVersion: version[id] });
  const terms = res.subjects?.legislativeSubjects?.map((s) => s.name) ?? [];
  console.log(`${id}: policyArea ${JSON.stringify(res.subjects?.policyArea?.name)}; AI term: ${terms.filter((t) => /artificial/i.test(t)).join(", ") || "none"}`);
  console.log(`  ${terms.join(" · ") || "(no legislative subjects)"}`);
}

// 5b/6b. None of the probe bills may carry the AI term or a committee report, so sample the
// 250 most recently updated House and Senate bills: AI-titled ones for the subject term,
// and one reported bill per chamber for the stage-2 codes and the cboCostEstimates shape.
h("5b/6b. recent bills: AI subject term, reported codes, CBO");
const sample = (version) => ({ cacheVersion: version });
for (const type of ["hr", "s"]) {
  // CRS indexes subjects weeks after introduction, so sample bills that have had time.
  const isAi = (b) => (/artificial intelligence/i.test(b.title) || /\bAI\b/.test(b.title)) && b.introducedDate < "2025-10";
  let recent = [];
  let aiTitled = [];
  for (let offset = 0; offset < 1000 && aiTitled.length < 3; offset += 250) {
    const page = (await get(`/bill/119/${type}`, { sort: "updateDate desc", limit: 250, offset })).bills;
    if (!offset) recent = page;
    aiTitled = [...aiTitled, ...page.filter(isAi)].slice(0, 3);
  }
  console.log(`${type}: ${aiTitled.length} AI-titled bills in the sample`);
  for (const b of aiTitled) {
    const res = await get(`/bill/119/${type}/${b.number}/subjects`, { limit: 250 }, sample(b.updateDateIncludingText));
    const terms = res.subjects?.legislativeSubjects?.map((s) => s.name) ?? [];
    console.log(`${type}${b.number} "${short(b.title, 50)}": ${terms.filter((t) => /artific|intellig|machine|automat|algorithm/i.test(t)).join(", ") || `none of ${terms.length}: ${terms.join(" · ")}`}`);
  }
  // Reported bills usually have a CBO estimate; check up to five for its shape.
  let reported;
  for (const b of recent.filter((b) => /Calendar No\./.test(b.latestAction?.text ?? "")).slice(0, 5)) {
    reported = b;
    const det = (await get(`/bill/119/${type}/${b.number}`, {}, sample(b.updateDateIncludingText))).bill;
    console.log(`${type}${b.number} cboCostEstimates: ${JSON.stringify(det.cboCostEstimates)?.slice(0, 300) ?? "absent"}`);
    if (det.cboCostEstimates) break;
  }
  if (!reported) continue;
  const acts = await get(`/bill/119/${type}/${reported.number}/actions`, { limit: 250 }, sample(reported.updateDateIncludingText));
  for (const a of acts.actions.filter((a) => /^(Committee|Calendars|Discharge)$/.test(a.type) || /report/i.test(a.text))) {
    console.log(`  ${a.actionDate} | ${a.type} | ${a.actionCode ?? "-"} | ${a.sourceSystem?.code}/${short(a.sourceSystem?.name, 20)} | ${short(a.text)}`);
  }
}
console.log("list updateDate sample:", JSON.stringify(all.bills[0].updateDate), JSON.stringify(all.bills[0].updateDateIncludingText));

// 6. Actions (also fixtures).
h("6. actions");
await mkdir(FIXTURES, { recursive: true });
const fixtures = {};
for (const id of ["s146", "hr1283"]) {
  const [, t, n] = id.match(/^([a-z]+)(\d+)$/);
  const res = await get(`/bill/119/${t}/${n}/actions`, { limit: 250 }, { cacheVersion: version[id] });
  fixtures[`${id}-actions.json`] = res;
  console.log(`${id}: ${res.actions.length} actions (pagination.count ${res.pagination?.count})`);
  for (const a of res.actions) {
    const votes = a.recordedVotes?.map((v) => `${v.chamber} roll ${v.rollNumber}`).join("; ");
    console.log(`  ${a.actionDate} | ${a.type} | ${a.actionCode ?? "-"} | ${a.sourceSystem?.code}/${short(a.sourceSystem?.name, 20)} | ${short(a.text)}${votes ? ` | VOTE ${votes}` : ""}`);
  }
}
fixtures["s146-detail.json"] = { bill: detail.s146 };

// 7. Related bills.
h("7. relatedbills");
for (const id of ["s146", "hr2794"]) {
  const rel = await sub(id, "relatedbills", "relatedBills");
  for (const r of rel) {
    const det = r.relationshipDetails.map((x) => `${x.type} (by ${x.identifiedBy})`).join("; ");
    console.log(`${id} → ${r.type}${r.number}-${r.congress}: ${det}`);
  }
  if (!rel.length) console.log(`${id}: none`);
}

// 8. Text versions.
h("8. text s146");
for (const v of await sub("s146", "text", "textVersions")) {
  const formats = v.formats.map((f) => `${f.type} @ ${new URL(f.url).host}`).join("; ");
  console.log(`${v.date?.slice(0, 10)} ${v.type}: ${formats}`);
}

// 9. Cosponsors.
h("9. cosponsors hr2794");
const cos = await sub("hr2794", "cosponsors", "cosponsors");
const tally = (f) => cos.reduce((acc, c) => ((acc[f(c)] = (acc[f(c)] ?? 0) + 1), acc), {});
console.log(`n ${cos.length}; detail count ${JSON.stringify(detail.hr2794.cosponsors)}`);
console.log("keys:", keys(cos[0]));
console.log("party:", JSON.stringify(tally((c) => c.party)), "| original:", JSON.stringify(tally((c) => c.isOriginalCosponsor)));
console.log("withdrawn:", cos.filter((c) => c.sponsorshipWithdrawnDate).length);

// 10. Counts for the backfill estimate.
h("10. counts");
let listPages = 0;
for (const type of ["hr", "s", "hjres", "sjres"]) {
  const b = await get(`/bill/119/${type}`, { limit: 1 });
  const s = await get(`/summaries/119/${type}`, { fromDateTime: "2025-01-03T00:00:00Z", limit: 1 });
  listPages += Math.ceil(b.pagination.count / 250) + Math.ceil(s.pagination.count / 250);
  console.log(`${type}: bills ${b.pagination.count}, summaries ${s.pagination.count}`);
}
console.log(`list-sweep pages at limit 250: ${listPages}`);

// 11. A House roll call to work out the human page.
h("11. recorded votes");
for (const a of fixtures["s146-actions.json"].actions) {
  for (const v of a.recordedVotes ?? []) {
    console.log(`${v.chamber} ${v.date?.slice(0, 10)} roll ${v.rollNumber} session ${v.sessionNumber}: ${v.url}`);
  }
}

// Fixtures, checked for the key before writing.
h("fixtures");
for (const [name, data] of Object.entries(fixtures)) {
  const json = JSON.stringify(data, null, 2) + "\n";
  if (json.includes(process.env.CONGRESS_API_KEY) || /api_key=/i.test(json)) {
    throw new Error(`${name} would contain the key; not written`);
  }
  await writeFile(path.join(FIXTURES, name), json);
  console.log(`wrote ${name} (${json.length} bytes, no key)`);
}

h("requests");
console.log(`sent ${stats.requests}, cache hits ${stats.cacheHits}, rate limit remaining ${stats.rateLimitRemaining ?? "n/a"}`);
