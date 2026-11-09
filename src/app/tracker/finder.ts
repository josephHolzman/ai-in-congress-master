import type { TrackerIndexBill } from "@/lib/tracker";

// Pure search, filter, sort and paging for BillFinder (tracker spec §4.3,
// §4.4b). Type-only import: the client bundle never pulls in the loader.

export type FinderBill = Pick<
  TrackerIndexBill,
  | "id"
  | "type"
  | "number"
  | "label"
  | "title"
  | "sponsor"
  | "originChamber"
  | "stage"
  | "topics"
  | "latestAction"
  | "introducedDate"
  | "cosponsors"
>;

export const CHAMBERS = ["", "house", "senate"] as const;
export const STATUSES = ["", "5", "4", "3", "2", "1"] as const;
export const SORTS = ["latest", "introduced", "cosponsors", "number"] as const;
export const PER_PAGE = [10, 25, 50, 100] as const;

export type FinderState = {
  q: string;
  chamber: (typeof CHAMBERS)[number];
  status: (typeof STATUSES)[number];
  topic: string;
  sort: (typeof SORTS)[number];
  page: number;
  per: (typeof PER_PAGE)[number];
};

export const DEFAULTS: FinderState = {
  q: "",
  chamber: "",
  status: "",
  topic: "",
  sort: "latest",
  page: 1,
  per: 10,
};

const pick = <T>(options: readonly T[], value: T | null, fallback: T) =>
  value !== null && options.includes(value) ? value : fallback;

/** The URL is user input: anything unknown falls back to its default. */
export function parseState(search: string, topicIds: string[]): FinderState {
  const params = new URLSearchParams(search);
  const page = Number(params.get("page"));
  return {
    q: params.get("q") ?? "",
    chamber: pick(
      CHAMBERS,
      params.get("chamber") as FinderState["chamber"],
      "",
    ),
    status: pick(STATUSES, params.get("status") as FinderState["status"], ""),
    topic: pick(topicIds, params.get("topic"), ""),
    sort: pick(SORTS, params.get("sort") as FinderState["sort"], "latest"),
    page: Number.isInteger(page) && page > 1 ? page : 1,
    per: pick(
      PER_PAGE,
      Number(params.get("per")) as FinderState["per"],
      DEFAULTS.per,
    ),
  };
}

/** "?q=…&page=2", defaults left out; "" when everything is default. */
export function toSearch(state: FinderState) {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULTS) as (keyof FinderState)[])
    if (state[key] !== DEFAULTS[key]) params.set(key, String(state[key]));
  const search = params.toString();
  return search && `?${search}`;
}

/** Lowercase, diacritics stripped: "María" → "maria". */
const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const LABEL = /^(hr|s|hjres|sjres)?(\d+)?$/;

/** A query shaped like a bill number ("hr 2794", "H.R.2794", "2794", "s146")
    matches that number only, and a bill type alone ("hr", "h.r.", "s")
    matches that type; otherwise every word must appear in the label, title
    or sponsor. */
export function matchesQuery(bill: FinderBill, q: string) {
  const query = fold(q).trim();
  if (!query) return true;
  const [, type, number] =
    LABEL.exec(query.replace(/[^a-z0-9]/g, "")) ?? [];
  if (type || number)
    return (
      (!number || Number(number) === bill.number) &&
      (!type || type === bill.type.toLowerCase())
    );
  const haystack = fold(`${bill.label} ${bill.title} ${bill.sponsor.name}`);
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

/** Search, chamber and status; the topic only unless `ignoreTopic`. */
export function filterBills<T extends FinderBill>(
  bills: T[],
  state: FinderState,
  ignoreTopic = false,
) {
  return bills.filter(
    (bill) =>
      (!state.chamber || bill.originChamber.toLowerCase() === state.chamber) &&
      (!state.status || bill.stage === Number(state.status)) &&
      (ignoreTopic || !state.topic || bill.topics.includes(state.topic)) &&
      matchesQuery(bill, state.q),
  );
}

const TYPE_ORDER = ["HR", "S", "HJRES", "SJRES"];
const byDesc = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);

const comparators: Record<
  FinderState["sort"],
  (a: FinderBill, b: FinderBill) => number
> = {
  latest: (a, b) => byDesc(a.latestAction.date, b.latestAction.date),
  introduced: (a, b) => byDesc(a.introducedDate, b.introducedDate),
  cosponsors: (a, b) => b.cosponsors.count - a.cosponsors.count,
  number: (a, b) =>
    TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
    a.number - b.number,
};

/** Stable, so ties keep bills.json's order. */
export function sortBills<T extends FinderBill>(
  bills: T[],
  sort: FinderState["sort"],
) {
  return bills.toSorted(comparators[sort]);
}

/** Per topic, the bills that match everything but the topic; "" is all. */
export function topicCounts(
  bills: FinderBill[],
  state: FinderState,
  topicIds: string[],
) {
  const matching = filterBills(bills, state, true);
  const counts: Record<string, number> = { "": matching.length };
  for (const id of topicIds)
    counts[id] = matching.filter((bill) => bill.topics.includes(id)).length;
  return counts;
}

/** The state that shows bill `id` (hash links, spec §4.5): each filter that
    hides it is cleared, the rest kept, and the page is the one holding it.
    null when `id` isn't a bill. */
export function revealBill(
  bills: FinderBill[],
  state: FinderState,
  id: string,
): FinderState | null {
  const bill = bills.find((b) => b.id === id);
  if (!bill) return null;
  const keeps = (patch: Partial<FinderState>) =>
    filterBills([bill], { ...DEFAULTS, ...patch }).length > 0;
  const next = { ...state };
  for (const key of ["q", "chamber", "status", "topic"] as const)
    if (!keeps({ [key]: state[key] }))
      Object.assign(next, { [key]: DEFAULTS[key] });
  const index = sortBills(filterBills(bills, next), next.sort).indexOf(bill);
  return { ...next, page: Math.floor(index / next.per) + 1 };
}

/** 119 → "119th" */
export function ordinal(n: number) {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]);
}

/** page.json copy:"{start}–{end} of {total} bills" with the values filled in. */
export const fill = (copy: string, values: Record<string, string | number>) =>
  copy.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));

/** 1-based page, clamped to the last; start and end are 1-based and
    inclusive (0 and 0 when nothing matches). */
export function paginate(total: number, page: number, per: number) {
  const pages = Math.max(1, Math.ceil(total / per));
  const current = Math.min(Math.max(1, page), pages);
  const start = total ? (current - 1) * per + 1 : 0;
  return { page: current, pages, start, end: Math.min(total, current * per) };
}
