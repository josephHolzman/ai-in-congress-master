// The API half of the fetch (spec §3.2 steps 2 and 4).
import { cachedLatest, get, getLatest, paginate } from "./congress.mjs";
import { billId, htmlToParagraphs, matchesAny } from "./normalize.mjs";

/** Ids of bills in the window whose title or CRS summary matches the config's patterns. */
export async function sweep(config, window) {
  const ids = new Set();
  for (const type of config.billTypes) {
    const list = await paginate(`/bill/${config.congress}/${type}`, { ...window, sort: "updateDate desc" }, "bills");
    for (const b of list) if (matchesAny(config.titlePatterns, b.title)) ids.add(billId(b.type, b.number, b.congress));
    const sums = await paginate(`/summaries/${config.congress}/${type}`, window, "summaries");
    for (const s of sums) {
      const text = htmlToParagraphs(s.text ?? "").join(" ");
      if (matchesAny(config.summaryPatterns, text)) ids.add(billId(s.bill.type, s.bill.number, s.bill.congress));
    }
    console.log(`  ${type}: ${list.length} bills, ${sums.length} summaries in the window`);
  }
  return ids;
}

/** Ids of every bill whose detail is in the cache (for --rebuild). */
export async function cachedBillIds() {
  return (await cachedLatest()).filter((d) => d.bill).map(({ bill: b }) => billId(b.type, b.number, b.congress));
}

/**
 * Detail plus every sub-endpoint. The detail is always fetched fresh (offline, its last
 * copy); its update dates version the rest.
 */
export async function fetchBill(id) {
  const [, type, number, congress] = id.match(/^([a-z]+)(\d+)-(\d+)$/) ?? [];
  if (!type) throw new Error(`Bad bill id "${id}" (expected e.g. s146-119)`);
  const base = `/bill/${congress}/${type}/${number}`;
  const detail = (await getLatest(base)).bill;
  const opts = { cacheVersion: `${detail.updateDate}|${detail.updateDateIncludingText}` };
  const sub = (endpoint, key) => paginate(`${base}/${endpoint}`, {}, key, opts);
  return {
    detail,
    actions: await sub("actions", "actions"),
    cosponsors: await sub("cosponsors", "cosponsors"),
    committees: await sub("committees", "committees"),
    subjects: (await get(`${base}/subjects`, { limit: 250 }, opts)).subjects ?? {},
    summaries: await sub("summaries", "summaries"),
    relatedBills: await sub("relatedbills", "relatedBills"),
    textVersions: await sub("text", "textVersions"),
  };
}
