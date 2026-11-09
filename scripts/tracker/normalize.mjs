// Raw API responses → the normalized bill (tracker spec §3.4).
import { milestonesOf, stageOf } from "./stage.mjs";

const LABELS = { HR: "H.R.", S: "S.", HJRES: "H.J.Res.", SJRES: "S.J.Res.", HRES: "H.Res.", SRES: "S.Res.", HCONRES: "H.Con.Res.", SCONRES: "S.Con.Res." };
const SLUGS = { HR: "house-bill", S: "senate-bill", HJRES: "house-joint-resolution", SJRES: "senate-joint-resolution" };

export const billId = (type, number, congress) => `${type.toLowerCase()}${number}-${congress}`;
export const billLabel = (type, number) => `${LABELS[type.toUpperCase()] ?? type.toUpperCase()} ${number}`;
const day = (iso) => iso.slice(0, 10);
export const ordinal = (n) => {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th")}`;
};

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);

/** CRS summary HTML → plain-text paragraphs, so the site never renders API HTML. */
export function htmlToParagraphs(html) {
  return html
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .split(/<\/?(?:p|li|ul|ol|div|h\d|br)\b[^>]*>/i)
    .map((part) => decode(part.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

// "Sen. Cruz, Ted [R-TX]" → "Sen. Ted Cruz".
function sponsorOf(s) {
  const title = s.fullName.match(/^(Sen\.|Rep\.|Del\.|Resident Commissioner)/)?.[1] ?? "";
  return {
    name: [title, s.firstName, s.lastName].filter(Boolean).join(" "),
    party: s.party,
    state: s.state,
    ...(s.district != null && { district: s.district }),
    bioguideId: s.bioguideId,
  };
}

function cosponsorsOf(list) {
  const active = list.filter((c) => !c.sponsorshipWithdrawnDate);
  const party = (p) => active.filter((c) => c.party === p).length;
  const latest = active.map((c) => c.sponsorshipDate).filter(Boolean).sort().at(-1);
  return {
    count: active.length,
    D: party("D"),
    R: party("R"),
    // Anyone outside the two parties counts as independent.
    I: active.filter((c) => c.party !== "D" && c.party !== "R").length,
    original: active.filter((c) => c.isOriginalCosponsor).length,
    ...(latest && { latestDate: day(latest) }),
  };
}

function committeesOf(list) {
  return list.map((c) => {
    // Some committee activities come back without a date (backfill crash, Nov 9); skip those.
    const latest = (c.activities ?? []).filter((a) => a.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    return { name: c.name, chamber: c.chamber, ...(latest && { latest: { name: latest.name, date: day(latest.date) } }) };
  });
}

const EXCERPT_CHARS = 600;
const sentence = (p) => /\.$/.test(p);

/**
 * The panel's excerpt (spec §3.4): leading paragraphs up to about 600 characters, ending
 * at one that ends in a period. CRS splits lists into paragraphs, so a cut anywhere else
 * can end mid-sentence. The title-only opening line is used only when nothing else exists.
 */
export function excerptOf(paragraphs) {
  const start = paragraphs.findIndex(sentence);
  if (start < 0) return paragraphs.slice(0, 1);
  const taken = [];
  let length = 0;
  let end = 0;
  for (const p of paragraphs.slice(start)) {
    if (taken.length && length + p.length > EXCERPT_CHARS) break;
    taken.push(p);
    length += p.length;
    if (sentence(p)) end = taken.length;
  }
  return taken.slice(0, end);
}

function summaryOf(list) {
  const latest = list.filter((s) => s.actionDate).sort((a, b) => b.actionDate.localeCompare(a.actionDate) || (b.updateDate ?? "").localeCompare(a.updateDate ?? ""))[0];
  if (!latest) return null;
  const paragraphs = htmlToParagraphs(latest.text ?? "");
  return { version: latest.actionDesc, date: latest.actionDate, paragraphs, excerpt: excerptOf(paragraphs) };
}

// T1: dates can be null and the array isn't in order, so take the latest dated version.
function textOf(versions) {
  const latest = versions.filter((v) => v.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return null;
  const format = latest.formats.find((f) => f.type === "Formatted Text") ?? latest.formats[0];
  return format ? { version: latest.type, date: day(latest.date), url: format.url } : null;
}

/**
 * Companion bills (spec §4.5). Congress.gov rarely says "Identical bill" (T1), so a tracker
 * bill from the other chamber with the same title counts too. It links to its row when it's
 * in the tracker, else to Congress.gov (same Congress, so only the bill's own path changes).
 * `titles` maps every tracker bill's id to its title; run after `related[].inTracker` is set.
 */
export function companionsOf(bill, titles) {
  const chamberOf = (id) => (id.startsWith("s") ? "Senate" : "House");
  return bill.related
    .filter((r) => r.relation.includes("Identical bill") || (chamberOf(r.id) !== bill.originChamber && titles.get(r.id) === bill.title))
    .map(({ id, label, inTracker }) => {
      const [, type, number] = /^(\D+)(\d+)/.exec(id);
      const href = inTracker ? `#${id}` : bill.congressGovUrl.replace(/[^/]+\/\d+$/, `${SLUGS[type.toUpperCase()]}/${number}`);
      return { id, label, href };
    });
}

export const matchesAny =(patterns, s) => patterns.some(({ re, flags }) => new RegExp(re, flags).test(s));

/** `raw` = { detail, actions, cosponsors, committees, subjects, summaries, relatedBills, textVersions }. */
export function normalize(raw, config) {
  const d = raw.detail;
  const id = billId(d.type, d.number, d.congress);
  const congressGovUrl = `https://www.congress.gov/bill/${ordinal(d.congress)}-congress/${SLUGS[d.type]}/${d.number}`;
  const subjects = raw.subjects.legislativeSubjects?.map((s) => s.name) ?? [];
  const summary = summaryOf(raw.summaries);
  // CRS summaries open with a title-only line; the first sentence-like paragraph is the description.
  const firstParagraph = summary?.paragraphs.find((p) => /\.$/.test(p)) ?? "";
  const topicText = [d.title, ...subjects, d.policyArea?.name ?? "", firstParagraph].join("\n");
  const matchedBy = [
    config.watchlist.includes(id) && "watchlist",
    subjects.some((s) => config.subjects.includes(s)) && "subject",
    matchesAny(config.titlePatterns, d.title) && "title",
  ].filter(Boolean);

  return {
    id,
    congress: d.congress,
    type: d.type,
    number: Number(d.number),
    label: billLabel(d.type, d.number),
    title: d.title,
    originChamber: d.originChamber,
    introducedDate: d.introducedDate,
    sponsor: sponsorOf(d.sponsors[0]),
    cosponsors: cosponsorsOf(raw.cosponsors),
    ...stageOf(d, raw.actions),
    latestAction: { date: d.latestAction.actionDate, text: d.latestAction.text },
    milestones: milestonesOf(raw.actions, congressGovUrl),
    committees: committeesOf(raw.committees),
    summary,
    policyArea: d.policyArea?.name ?? null,
    subjects,
    topics:
      config.topicOverrides[id] ?? config.topics.filter((t) => new RegExp(t.re, "i").test(topicText)).map((t) => t.id),
    // inTracker and companions are set once every candidate is classified.
    related: raw.relatedBills.map((r) => ({
      id: billId(r.type, r.number, r.congress),
      label: billLabel(r.type, r.number),
      relation: [...new Set(r.relationshipDetails.map((x) => x.type))].join("; "),
      inTracker: false,
    })),
    cbo: (d.cboCostEstimates ?? []).filter((c) => c.pubDate && c.url).map((c) => ({ title: c.title, date: day(c.pubDate), url: c.url })),
    law: d.laws?.[0] ? `${d.laws[0].type} ${d.laws[0].number}` : null,
    text: textOf(raw.textVersions),
    matchedBy,
    congressGovUrl,
    updateDate: d.updateDate,
  };
}
