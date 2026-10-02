import { z } from "zod";
import billsJson from "../../content/bills.json";
import statsJson from "../../content/bill-stats.json";
import { formatDate, isoDate } from "@/lib/dates";

const billSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  sponsor: z.object({
    name: z.string().min(1),
    party: z.string().min(1),
    state: z.string().min(1),
  }),
  introduced: isoDate,
  status: z.string().min(1),
  asOf: isoDate,
  url: z.url({ protocol: /^https$/ }),
});

export type Bill = z.infer<typeof billSchema>;

const bills = z.object({ bills: z.array(billSchema) }).parse(billsJson).bills;
const byId = new Map(bills.map((bill) => [bill.id, bill]));

export function getBills(ids: string[]): Bill[] {
  return ids.map((id) => {
    const bill = byId.get(id);
    if (!bill) throw new Error(`Unknown bill id "${id}" (content/bills.json)`);
    return bill;
  });
}

export function sponsorLine({ sponsor }: Bill) {
  return `Sponsor: ${sponsor.name} (${sponsor.party}-${sponsor.state})`;
}

export function statusLine({ status, asOf }: Bill) {
  return `${status} as of ${formatDate(asOf)}`;
}

const count = z.number().int().nonnegative();
const billStats = z
  .object({
    placeholder: z.boolean(),
    congress: z.string().min(1),
    asOf: isoDate,
    source: z.string().min(1),
    introduced: count,
    reported: count,
    passedOneChamber: count,
    becameLaw: count,
  })
  .parse(statsJson);

if (billStats.placeholder) {
  console.warn(
    "⚠ content/bill-stats.json holds Figma placeholder numbers (placeholder: true). Replace them with real counts before launch.",
  );
}

export function getBillStats() {
  return billStats;
}
