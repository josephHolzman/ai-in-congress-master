// public/data/ai-bills-{congress}.csv (spec §3.2 step 6): RFC 4180, UTF-8 with no BOM.
const COLUMNS = {
  id: (b) => b.id,
  label: (b) => b.label,
  title: (b) => b.title,
  sponsor: (b) => b.sponsor.name,
  party: (b) => b.sponsor.party,
  state: (b) => b.sponsor.state,
  originChamber: (b) => b.originChamber,
  introducedDate: (b) => b.introducedDate,
  stage: (b) => b.stage,
  stageLabel: (b) => b.stageLabel,
  latestActionDate: (b) => b.latestAction.date,
  latestActionText: (b) => b.latestAction.text,
  cosponsors: (b) => b.cosponsors.count,
  D: (b) => b.cosponsors.D,
  R: (b) => b.cosponsors.R,
  I: (b) => b.cosponsors.I,
  topics: (b) => b.topics.join("; "),
  policyArea: (b) => b.policyArea ?? "",
  congressGovUrl: (b) => b.congressGovUrl,
};

const field = (v) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(bills) {
  const rows = [Object.keys(COLUMNS), ...bills.map((b) => Object.values(COLUMNS).map((f) => f(b)))];
  return rows.map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";
}
