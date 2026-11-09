import { z } from "zod";
import billsJson from "../../content/tracker/bills.json";
import indexJson from "../../content/tracker/index.json";
import metaJson from "../../content/tracker/meta.json";
import pageJson from "../../content/tracker/page.json";
import configJson from "../../content/tracker/config.json";
import { CHAMBERS, SORTS, STATUSES } from "@/app/tracker/finder";
import { isoDate } from "@/lib/iso-date";

// The shape scripts/tracker/fetch.mjs writes (tracker spec §3.4). Bad data fails the build.
const text = z.string().min(1);
const count = z.number().int().nonnegative();
const https = z.url({ protocol: /^https$/ });

const billSchema = z.object({
  id: z.string().regex(/^(hr|s|hjres|sjres)\d+-\d+$/),
  congress: z.number().int(),
  type: z.enum(["HR", "S", "HJRES", "SJRES"]),
  number: z.number().int().positive(),
  label: text,
  title: text,
  originChamber: z.enum(["House", "Senate"]),
  introducedDate: isoDate,
  sponsor: z.object({
    name: text,
    party: text,
    state: text,
    district: z.number().int().optional(),
    bioguideId: text,
  }),
  cosponsors: z.object({
    count,
    D: count,
    R: count,
    I: count,
    original: count,
    latestDate: isoDate.optional(),
  }),
  stage: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  stageLabel: text,
  latestAction: z.object({ date: isoDate, text }),
  milestones: z.array(
    z.object({
      date: isoDate,
      label: text,
      vote: z
        .object({
          chamber: z.enum(["House", "Senate"]),
          roll: count,
          url: https,
        })
        .optional(),
    }),
  ),
  committees: z.array(
    z.object({
      name: text,
      chamber: text,
      latest: z.object({ name: text, date: isoDate }).optional(),
    }),
  ),
  summary: z
    .object({
      version: text,
      date: isoDate,
      paragraphs: z.array(text),
      excerpt: z.array(text),
    })
    .nullable(),
  policyArea: text.nullable(),
  subjects: z.array(text),
  topics: z.array(text),
  related: z.array(
    z.object({ id: text, label: text, relation: text, inTracker: z.boolean() }),
  ),
  // Spec §4.5; href is "#<id>" for a tracker bill, else its Congress.gov page.
  companions: z.array(
    z.object({ id: text, label: text, href: z.union([https, z.string().regex(/^#/)]) }),
  ),
  cbo: z.array(z.object({ title: text, date: isoDate, url: https })),
  law: text.nullable(),
  text: z.object({ version: text, date: isoDate, url: https }).nullable(),
  matchedBy: z.array(z.enum(["watchlist", "subject", "title"])).min(1),
  congressGovUrl: https,
  updateDate: z.iso.datetime(),
});

// T8's split files: content/tracker/index.json (the table's rows) and
// public/data/tracker/bills/{id}.json (one panel each, fetched on first open).
const indexBillSchema = billSchema
  .pick({
    id: true,
    type: true,
    number: true,
    label: true,
    title: true,
    originChamber: true,
    introducedDate: true,
    stage: true,
    stageLabel: true,
    latestAction: true,
    topics: true,
  })
  .extend({
    sponsor: billSchema.shape.sponsor.pick({ name: true, party: true, state: true }),
    cosponsors: billSchema.shape.cosponsors.pick({ count: true }),
  })
  .strict();

export const billDetailSchema = billSchema
  .pick({
    id: true,
    milestones: true,
    committees: true,
    cosponsors: true,
    companions: true,
    cbo: true,
    law: true,
    text: true,
    congressGovUrl: true,
    subjects: true,
    policyArea: true,
  })
  .extend({
    summary: z
      .object({ version: text, date: isoDate, excerpt: z.array(text) })
      .nullable(),
  })
  .strict();

const metaSchema = z.object({
  lastRun: z.iso.datetime().nullable(),
  fetchedAt: z.iso.datetime(),
  congress: z.number().int(),
  stages: z.record(z.enum(["1", "2", "3", "4", "5"]), count),
  included: count,
  review: count,
  requests: count,
  configHash: text,
});

/** Every value exactly once, in the order the select shows them. */
const options = <T extends string>(values: readonly T[]) =>
  z
    .array(z.object({ value: z.enum(values), label: text }))
    .refine(
      (list) =>
        list.length === values.length &&
        new Set(list.map((o) => o.value)).size === values.length,
      "needs every value once",
    );

// The /tracker copy (spec §4.7), Joey's to approve. {placeholders} are filled
// in by the components.
const pageSchema = z.object({
  title: z.object({ lead: text, congress: text }),
  dek: text,
  source: text,
  finderHeading: text,
  // Option values are the finder's URL values (src/app/tracker/finder.ts).
  finder: z.object({
    search: text,
    searchPlaceholder: text,
    chamber: text,
    chamberOptions: options(CHAMBERS),
    status: text,
    statusOptions: options(STATUSES),
    sort: text,
    sortOptions: options(SORTS),
    topics: text,
    allTopics: text,
    // T10: the phone Filters menu.
    filters: text,
    filtersActive: text,
    showResults: text,
    showResultsOne: text,
    clearFilters: text,
    clearSearch: text,
  }),
  columns: z.object({
    bill: text,
    title: text,
    status: text,
    latestAction: text,
    cosponsors: text,
  }),
  row: z.object({
    statusPrefix: text,
    step: text,
    latestActionPrefix: text,
    latestShort: text,
    cosponsor: text,
    cosponsors: text,
  }),
  panel: z.object({
    summary: text,
    noSummary: text,
    fullSummary: text,
    stands: text,
    rollCall: text,
    committees: text,
    cosponsors: text,
    cosponsorSplit: text,
    bipartisan: text,
    companion: text,
    subjects: text,
    cbo: text,
    text,
    law: text,
    congressGov: text,
    loading: text,
    failed: text,
  }),
  noscript: z.object({ text, link: text }),
  methodology: z.object({
    heading: text,
    paragraphs: z.array(text).length(3),
    download: text,
    downloadMeta: text,
    cite: text,
    citation: text,
  }),
  emptyBody: text,
  empty: z.object({ heading: text, headingQuery: text, clear: text }),
  pagination: z.object({
    label: text,
    perPage: text,
    range: text,
    rangeOne: text,
    status: text,
    statusOne: text,
    statusEmpty: text,
    page: text,
    pageOf: text,
    previous: text,
    next: text,
  }),
});

// Only the topic labels; the fetch script owns the rest of config.json.
const topicsSchema = z.object({
  topics: z.array(z.object({ id: text, label: text })),
});

export type TrackerPage = z.infer<typeof pageSchema>;
export type TrackerTopic = { id: string; label: string };

const bills = z.array(billSchema).parse(billsJson);
export type TrackerBill = z.infer<typeof billSchema>;
const index = z.array(indexBillSchema).parse(indexJson);
export type TrackerIndexBill = z.infer<typeof indexBillSchema>;
export type TrackerBillDetail = z.infer<typeof billDetailSchema>;
const meta = metaSchema.parse(metaJson);
const page = pageSchema.parse(pageJson);
const topics: TrackerTopic[] = topicsSchema
  .parse(configJson)
  .topics.map(({ id, label }) => ({ id, label }));
const byId = new Map(bills.map((bill) => [bill.id, bill]));

export function getTrackerBills() {
  return bills;
}

export function getTrackerIndex() {
  return index;
}

export function getTrackerMeta() {
  return meta;
}

export function getTrackerPage() {
  return page;
}

export function getTrackerTopics() {
  return topics;
}

export function getTrackerBill(id: string) {
  return byId.get(id);
}
