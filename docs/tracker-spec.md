# Bill tracker spec (`/tracker`)

The source of truth for the tracker's data and UI. Part A still rules tokens, color and type; CLAUDE.md still rules how to work. Where this file and the Figma frames disagree, this file wins (the reasons are in §5).

Figma file `9DKYbMDVJ43Kt1IDcf0XJS`, page "AI in Congress redesign":
- **AIBills `2212:699`**: the page (topbar, body `2212:765`, footer).
- **BillFinder `2209:2`**: the body on its own.
- **BillFinderNoMatch `2212:536`**: the empty state.

All three are auto layout bound to the spacing variables, so Dev Mode shows token names. All text in them is placeholder, and some of it is wrong (§5).

Legend: ✅ verified · ⚠ believed, verify in T1 · ❌ wrong (T1 records what's true).

---

## 1. What the page does, in order of importance

1. **Find a bill:** search by number, title or sponsor; filter by chamber, stage and topic; sort.
2. **See where each bill stands:** its stage (1–5), latest action and date, and support (cosponsor count).
3. **Expand a bill** (the chevron) for what a researcher checks next: the CRS summary, the milestone timeline with roll-call votes, committees, the party split of cosponsors, the companion bill, the CBO estimate and the text.
4. **Trust and reuse it:** how bills are chosen, when the data was fetched, a CSV of the data, and how to cite.

Not in scope: per-bill pages, charts, alerts, the "What's moving" and "The debates" sections from the old design board, and state bills.

---

## 2. Congress.gov API v3

### 2.1 Access
- **Base:** `https://api.congress.gov/v3`. Responses are JSON with `format=json`. ✅ (README)
- **Key:** a free key from https://api.congress.gov/sign-up/. It lives in `.env.local` as `CONGRESS_API_KEY` (`.env*` is gitignored ✅). It is never committed, never printed, never logged and never sent to the browser. There is no `NEXT_PUBLIC_` key.
- **Header:** send it as an `X-Api-Key` header, so URLs in logs never carry it. ✅ (T1: the header and `api_key=` both return 200; with the header, `pagination.next` carries no key)
- **Rate limit:** 5,000 requests an hour. ✅ (README; T1: our key's `X-RateLimit-Limit` header says 20,000. The 750 ms spacing stays under either.)
- **Pagination:** `limit` up to 250 (default 20), `offset`, and `pagination.next` in each response. ✅ (README; T1: `next` is the same query with `offset` and `limit` set)

### 2.2 Endpoints we use
| Endpoint | Used for | Status |
|---|---|---|
| `/bill/{congress}/{type}?fromDateTime&toDateTime&sort=updateDate+desc&limit=250` | Discovery: every bill of a type (title, latestAction, updateDate, originChamber) | ✅ T1: the date filters filter on `updateDate`, and `sort=updateDate desc` / `asc` both work. A list item has congress, introducedDate, latestAction, number, originChamber(Code), title, type, updateDate, updateDateIncludingText and url. **No sponsors.** Its `updateDate` is a date only (`2026-10-22`); the detail's is a full timestamp |
| `/summaries/{congress}/{type}?fromDateTime&toDateTime&limit=250` | Discovery: CRS summary text for every summarized bill | ✅ It includes `text`. Without the date params it only returns the last day ✅. T1: an item has actionDate, actionDesc, versionCode, text, updateDate, lastSummaryUpdateDate, currentChamber and `bill` {congress, type, number, title, originChamber, updateDateIncludingText, url} |
| `/bill/{congress}/{type}/{number}` | Detail: title, originChamber, introducedDate, sponsors, cosponsors.count, laws, latestAction, policyArea, cboCostEstimates, updateDate, updateDateIncludingText | ✅ T1: `laws` is `[{ number: "119-12", type: "Public Law" }]`. `cboCostEstimates` is **absent** when there is none, else `[{ title, description, pubDate, url }]` (url on www.cbo.gov). `sponsors[]` has bioguideId, firstName, lastName, fullName, party, state, isByRequest (plus district for House members). `cosponsors` is `{ count, countIncludingWithdrawnCosponsors, url }` |
| `…/actions` | Stage and the milestone timeline: actionDate, text, type, actionCode, sourceSystem, recordedVotes (rollNumber, url, chamber, date, sessionNumber) | ✅ (actionCode only for sourceSystem 2 House / 9 LoC; T1: Senate actions have sourceSystem `{ name: "Senate" }` with no code. The same event appears once per source system, and a vote is attached to each copy) |
| `…/cosponsors` | Party split, original vs later, withdrawn: party, state, sponsorshipDate, isOriginalCosponsor, sponsorshipWithdrawnDate | ✅ (T1: party is "D"/"R"/"I"; `sponsorshipWithdrawnDate` is absent unless withdrawn; the detail's `countIncludingWithdrawnCosponsors − count` gives the withdrawn count) |
| `…/committees` | Committee names, chamber, activities (name, date) | ✅ |
| `…/subjects` | legislativeSubjects[].name, policyArea.name | ✅ (T1: many 2025 bills have no legislative subjects yet; see §2.4 #5) |
| `…/summaries` | Every summary version (versionCode, actionDate, actionDesc, text) | ✅ (text is CDATA HTML that "may not be valid") |
| `…/relatedbills` | Companions: relationshipDetails[].type and identifiedBy | ✅ (T1: seen "Related bill" and "Public law contains the text", by CRS. NO FAKES' Senate companion S. 1367 is only "Related bill", so "Identical bill" can't be the only companion signal) |
| `…/text` | textVersions[].type, date, formats[] (Formatted Text, PDF, Formatted XML) | ✅ (T1: also "United States Legislative Markup"; all on www.congress.gov. ❌ `date` can be null (S. 146's "Enrolled Bill") and the array isn't in date order: take the version with the latest non-null date, here "Public Law" 2025-05-20) |

**There is no keyword or subject filter on `/bill`.** That's why discovery works from the two list sweeps (§3.1).

### 2.3 Client rules (`scripts/tracker/congress.mjs`)
- Plain Node ESM with global `fetch` and no dependencies. Load the key with `process.loadEnvFile(".env.local")` in a try/catch, so CI can pass the key as an environment variable instead.
- Leave at least 750 ms between requests (≤ 4,800 an hour).
- On 429 or 5xx, retry up to 5 times with exponential backoff, honoring `Retry-After`. Log the rate-limit-remaining header when there is one.
- `paginate()` follows `pagination.next` with `limit=250`.
- **Disk cache** in `.cache/congress/` (gitignored), keyed by path and query:
  - A bill's sub-endpoints are reused while its `updateDate` and `updateDateIncludingText` are unchanged. Take them from the detail (full timestamps), not the list item (date only), so a second update on the same day still invalidates. That's one uncached detail request per candidate.
  - List sweeps are never cached.
- **Logs:** never print a URL that holds the key, or the key itself, including in error messages.

### 2.4 T1 probe checklist
Bills: S. 146 (TAKE IT DOWN, became law), H.R. 2794 (NO FAKES), H.R. 1283 and H.R. 1121 (introduced only).

1. A request with the header returns 200. Then try `api_key=` and record whether both work.
2. Record the detail fields listed in §2.2 for S. 146, including the shapes of `laws` and `cboCostEstimates`.
3. On `/bill/119/s`, check that `fromDateTime`, `toDateTime` and `sort=updateDate+desc` are accepted and filter. Record which fields a list item has: does it include introducedDate or sponsors?
4. On `/summaries/119/hr` with `fromDateTime=2025-01-03T00:00:00Z`, record `pagination.count` and the fields of one item.
5. On `/subjects` for all four bills, record the exact legislative subject term for AI. Is it "Artificial intelligence"? Record every subject on each bill.
6. On `/actions` for S. 146 and H.R. 1283, list each action's date, type, actionCode, sourceSystem, the first 60 characters of its text, and whether it has recordedVotes. Fill §3.3 from this.
7. On `/relatedbills` for S. 146 and H.R. 2794, record the relationshipDetails types you see.
8. On `/text` for S. 146, record the format types and URL hosts.
9. On `/cosponsors` for H.R. 2794, record the party values, isOriginalCosponsor and withdrawn handling.
10. Record `pagination.count` for `/bill/119/{hr,s,hjres,sjres}`. Use it to estimate the backfill requests and minutes.
11. **Roll-call links:** take one House recordedVotes `url` (it's XML), work out the human page URL pattern, and check it with WebFetch. Do the same for the Senate if any probe bill has a Senate vote. If you can't confirm a pattern, the milestone links to the Congress.gov actions page instead.

**T1 results (2026-11-08, `npm run tracker:probe`).** Items 2–4, 7–9 are in the §2.1–2.2 notes; §3.3 has item 6.
- **#5 ❌ CRS doesn't index 119th bills under "Artificial intelligence."** None of the four probe bills has it. Neither does S. 2938, the *Artificial Intelligence Risk Evaluation Act*, whose 8 terms include "Advanced technology and technological innovations", "Computers and information technology" and "Technology assessment" (all far broader than AI). Three other AI-titled 2025 bills (H.R. 3919, S. 1699, S. 1792) have **no** legislative subjects yet. Subjects per probe bill:
  - S. 146: Child safety and welfare · Crimes against children · Criminal investigation, prosecution, interrogation · Digital media · Fraud offenses and financial crimes · Internet, web applications, social media · Pornography · Sex offenses.
  - H.R. 2794: Administrative law and regulatory procedures · Administrative remedies · Art, artists, authorship · Civil actions and liability · Computers and information technology · Department of Commerce · Digital media · Federal preemption · Intellectual property · Internet, web applications, social media · Music · Photography and imaging · Sound recording.
  - H.R. 1283: Advanced technology and technological innovations · Crimes against children · Domestic violence and child abuse · Pornography · Sex offenses.
  - H.R. 1121: Computer security and identity theft · Computers and information technology · Executive agency funding and structure · Internet, web applications, social media.
  
  So the `subjects` route in §3.1 matches nothing today. Inclusion works through the watchlist and titles, with summary matches in the review queue. The dek in §4.7 must not say CRS indexes these bills under AI.
- **#10:** bills hr 10,960 · s 5,674 · hjres 221 · sjres 221; summaries since 2025-01-03 hr 3,618 · s 1,737 · hjres 125 · sjres 101. That's 93 list pages at limit 250 (§3.2 step 9).
- **#11 ✅ House:** recordedVotes `url` is `https://clerk.house.gov/evs/{year}/roll{nnn}.xml` (zero-padded). The human page is `https://clerk.house.gov/Votes/{year}{rollNumber}` (checked with WebFetch: `/Votes/2025104` is S. 146's roll call 104, 409–2; `/Votes/20255` and `/Votes/2025005` both open roll 5). **Senate: unconfirmed.** No probe bill has a Senate roll call (S. 146 passed by unanimous consent), so a Senate vote links to the bill's Congress.gov actions page, `{congressGovUrl}/all-actions`.

---

## 3. Data pipeline

### 3.1 Which bills are in the tracker
The rules live in `content/tracker/config.json`, which Joey edits:

```json
{
  "congress": 119,
  "billTypes": ["hr", "s", "hjres", "sjres"],
  "subjects": ["Artificial intelligence"],
  "titlePatterns": [
    { "re": "\\bartificial intelligence\\b", "flags": "i" },
    { "re": "\\bA\\.?I\\.?(?!\\/AN)(?=\\b|[- ])", "flags": "" },
    { "re": "machine learning|deep ?fakes?|digital replicas?|\\bgenerative\\b|chatbots?|large language models?|synthetic media|frontier models?|automated decision|algorithmic", "flags": "i" }
  ],
  "summaryPatterns": [
    { "re": "artificial intelligence|machine learning|deep ?fakes?|digital replicas?|generative|algorithmic|automated decision", "flags": "i" }
  ],
  "watchlist": ["s146-119", "hr2794-119", "hr1283-119", "hr1121-119"],
  "exclude": [],
  "topics": [ /* 17 topics, see the table below */ ],
  "topicOverrides": {}
}
```

**T8 title fixes:** `generative` is a whole word (it matched "Regenerative" in 3 bills), and the A.I. pattern refuses "AI/AN" (American Indian/Alaska Native; 2 bills). `scripts/tracker/config.test.mjs` holds the must-match and must-not-match titles.

**Inclusion.** A bill is in the tracker when it isn't in `exclude` and any of these hold:
- it's on the `watchlist`;
- one of its CRS legislative subjects is in `subjects`;
- its title matches a `titlePattern`.

Each bill records which of these let it in, as `matchedBy`.

❌ T1: no 119th bill carries the "Artificial intelligence" subject today (§2.4 #5), so in practice bills get in by watchlist or title. The `subjects` rule stays in case CRS adds the term.

**Review queue.** A bill whose CRS summary matches a `summaryPattern`, but that doesn't qualify by watchlist, subject or title, goes to `content/tracker/review.json` and is not published. Each entry has its id, label, title, a summary excerpt and its subjects. Joey moves bills from there into the `watchlist` or `exclude`.

**Topics** are editorial:
- Each topic's `re` is tested, case-insensitively, against the title, the CRS subjects, the policy area and the summary's first paragraph. (T2: CRS summaries open with a title-only line, so "first paragraph" is the first one ending in a period.)
- A bill can have several topics or none.
- `topicOverrides` (`{ "<id>": ["topic-id"] }`) replaces the computed topics for that bill.
- Topics and `topicOverrides` aren't part of the config hash, so editing them never forces a full sweep; `npm run tracker:rebuild` applies them.

T8 topics, in pill order (each row's alternatives joined with `|` in `config.json`), with their counts after the T8 rebuild (215 bills):

| id | Label | Pattern | Bills |
|---|---|---|---|
| deepfakes | Deepfakes and likeness | `deep ?fakes?`, `digital replicas?`, `likeness`, `synthetic (media\|content\|images?)`, `intimate (images?\|visual)`, `impersonat`, `voice clon`, `fabricated` | 11 |
| chatbots | Chatbots and companions | `chatbots?`, `companion`, `conversational`, `human-like` | 7 |
| child-safety | Children and teens | `\bchild`, `\bminors?\b`, `\bkids?\b`, `\bteens?`, `\byouth`, `crimes against children`, `child safety` | 10 |
| elections | Elections | `elections?`, `campaign`, `political ad`, `voters?`, `ballot` | 9 |
| transparency | Disclosure and labeling | `disclos`, `label`, `transparen`, `watermark`, `provenance`, `bill of materials`, `\bads?\b`, `advertis` | 17 |
| safety | Safety and risk | `\brisks?\b`, `kill switch`, `emergency button`, `rogue`, `self-improving`, `incident`, `threat`, `guardrail`, `containment`, `frontier`, `evaluation`, `catastroph`, `loss of control` | 22 |
| privacy | Privacy and data | `privacy`, `personal data`, `data protection`, `data collection`, `biometric`, `surveillance` | 19 |
| fraud | Fraud and consumer protection | `fraud`, `scams?`, `decepti`, `consumer`, `collusion`, `price gouging`, `pricing`, `identity theft` | 30 |
| bias | Bias and civil rights | `\bbias`, `discriminat`, `civil rights`, `algorithmic accountability`, `algorithmic systems`, `censorship` | 8 |
| jobs | Jobs and the economy | `\bjobs?\b`, `\bworkers?\b`, `workforce`, `employ`, `labor`, `talent`, `wage`, `small business`, `main ?street` | 28 |
| health | Health care | `health`, `medic`, `doctors?`, `patients?`, `hospital`, `clinical`, `\bFDA\b` | 12 |
| education | Education | `educat`, `classroom`, `\bschools?\b`, `teachers?`, `literacy`, `universit`, `college` | 17 |
| government | Government use of AI | `federal agenc`, `government`, `veterans?`, `\bVA\b`, `procure`, `\bOMB\b`, `CISA`, `customs`, `border`, `\bSBA\b`, `federal data` | 49 |
| preemption | Federal and state roles | `preempt`, `moratorium`, `state law`, `states'? right`, `state regulation` | 4 |
| national-security | National security | `national security`, `defense`, `military`, `armed forces`, `foreign adversar`, `China`, `Chinese`, `DeepSeek`, `export`, `chips?\b`, `semiconductor`, `intelligence community`, `national intelligence`, `terroris`, `weapons`, `cyber` | 40 |
| research-compute | Research and compute | `research`, `\bcompute\b`, `NAIRR`, `National Science Foundation`, `\bNSF\b`, `testbed`, `standards`, `NIST`, `grand challenge` | 44 |
| energy | Energy and data centers | `energy`, `data cent`, `cooling`, `environment`, `climate`, `\bheat\b`, `grid`, `electricity`, `emissions` | 15 |

26 bills (12.1%) have no topic.

Resolutions that can't become law (hres, sres, hconres, sconres) are out of scope, because the five-stage bar doesn't apply to them.

### 3.2 The fetch script (`npm run tracker:fetch`, `scripts/tracker/fetch.mjs`)
1. **Sweep window.** Start from `content/tracker/meta.json` → `lastRun`, minus 2 days of overlap. Do a full sweep instead (from `2025-01-03T00:00:00Z`) when:
   - there's no `meta.json`;
   - `--full` is passed;
   - the config's hash changed since the last run.
2. **List sweep.** For each bill type, page `/bill` (sorted by updateDate, inside the window) and `/summaries` (inside the window).
3. **Candidates.** Take the union of:
   - every currently included id;
   - the watchlist;
   - list items whose title matches a titlePattern;
   - summary items whose text matches a summaryPattern;
   - every id already in review.json.
4. **Fetch.** For each candidate whose `updateDate` changed or isn't cached, fetch the detail plus `/actions`, `/cosponsors`, `/committees`, `/subjects`, `/summaries`, `/relatedbills` and `/text`, each paginated.
5. **Classify** (§3.1), then **normalize** (§3.4). Strip CRS summary HTML to plain-text paragraphs in the script, so the site never renders API HTML.
6. **Write:**
   - `content/tracker/bills.json`, sorted by latest action date, newest first;
   - `content/tracker/review.json`;
   - `content/tracker/meta.json`: `lastRun`, `fetchedAt`, `congress`, the stage counts, the included count, the review count, the request count and the config hash;
   - `content/bill-stats.json`, regenerated (§3.5) with `placeholder: false`;
   - `public/data/ai-bills-119.csv`, one row per bill: id, label, title, sponsor, party, state, originChamber, introducedDate, stage, stageLabel, latestActionDate, latestActionText, cosponsors, D, R, I, topics, policyArea, congressGovUrl;
   - **T8, for fast loading:** `content/tracker/index.json`, the table's row fields only (id, type, number, label, title, sponsor {name, party, state}, originChamber, introducedDate, stage, stageLabel, latestAction, cosponsors {count}, topics), sorted like bills.json, one bill per line, validated by zod as `TrackerIndexBill` (215 bills: 99.5 KB raw, 12.9 KB gzip);
   - **T8:** `public/data/tracker/bills/{id}.json`, one compact file per bill with what its expanded panel needs: id, summary {version, date, excerpt}, milestones, committees, cosponsors (the full split), companions, cbo, law, text, congressGovUrl, subjects, policyArea (validated in test:content by `billDetailSchema`; median 0.7 KB). Files for bills that left the tracker are deleted.

   bills.json stays the full record: the CSV, the rail and the tests read it. Companions (§4.5) are computed here, once every bill is classified, and stored in bills.json and the per-bill files.
7. **Flags:**
   - `--full`;
   - `--only <id,id>` (fetch and print these bills, then write nothing);
   - `--dry-run` (print what would change);
   - `--no-sweep` (T2: skip the list sweeps and refetch the watchlist plus the bills already in bills.json and review.json. `meta.lastRun` keeps its old value, `null` if no sweep has run, so the next normal run still does a full sweep);
   - `--rebuild` (T8, `npm run tracker:rebuild`): **no API calls and no key needed.** It re-classifies and re-normalizes every bill in `.cache/congress/` (plus the watchlist and the bills in the files), so title-pattern, topic and excerpt changes apply without a sweep. A bill whose title no longer matches and isn't on the watchlist leaves the tracker. `fetchedAt`, `lastRun` and `requests` keep their values, since nothing was fetched. A cache miss is an error, never a request. Every online run stores each bill's latest detail in the cache for this (the detail is still always fetched fresh online).
8. **Exit codes:** non-zero on any API failure after retries. Never write partial output: build everything in memory and write the files last.
9. **Cost:** a full backfill is the list sweeps plus about 8 requests per candidate. T1 measured the sweeps (§2.4 #10): **93 list pages** (bills 44 + 23 + 1 + 1, summaries 15 + 7 + 1 + 1). Each candidate costs 8 requests (the detail plus 7 sub-endpoints, each one page at limit 250). The candidate count is unknown until the first sweep. Assuming 300–600 candidates (title matches, summary matches and the watchlist), that's about **2,500–4,900 requests, or 31–61 minutes** at 750 ms, plus response time (summary pages at limit 250 are large). That's within both the 5,000/h README limit and our key's 20,000/h. T2 reports the real count. **T2 (2026-11-09): a full sweep took 93 requests and 484 s and found 286 candidates (title and summary matches plus the watchlist), so a backfill is about 93 + 286 × 8 ≈ 2,400 requests, roughly 45–50 minutes.** Daily runs are small: one uncached detail per candidate, plus 8 more for each bill that changed.

### 3.3 Stage (1–5)
Codes as the API returned them in T1 (2026-11-08). The stage rules use the Library of Congress codes (sourceSystem 9), which appear on both chambers' bills. The House-only codes (sourceSystem 2) are listed for the milestones.

| Stage | Label | Rule (first match wins) | Seen in T1 |
|---|---|---|---|
| 5 | Became law | `laws` is non-empty, or there's an action coded `36000` (type `BecameLaw`) | ✅ S. 146: `laws` `[{ number: "119-12", type: "Public Law" }]`; `36000` on both "Became Public Law No: 119-12." and "Signed by President." House copies `E40000` (law) and `E30000` (signed) |
| 4 | Passed both chambers | passed House **and** passed Senate (below); or presented to the President (`28000`, type `President`). If vetoed (`31000`), label it "Vetoed" | ✅ `28000` "Presented to President." (House copy `E20000`). ⚠ `31000` not seen: no probe bill was vetoed |
| 3 | Passed House / Passed Senate | an action coded `8000` (House) or `17000` (Senate). The label names the chamber | ✅ S. 146: `8000` "Passed/agreed to in House: …" (House copy `H37300`, roll 104) and `17000` "Passed/agreed to in Senate: …" (the Senate copy has no code) |
| 2 | Reported by committee | a committee report (`5000` House / `14000` Senate) or a discharge (`14500` Senate) | ✅ `5000` "Reported (Amended) by the Committee on …" (H.R. 3331, H.R. 3100; House copy `H12200`); `14000` "Committee on … Reported by Senator …" (S. 3984, S. 2082); `14500` "Senate Committee on … discharged …" (S. 146). ⚠ No House discharge seen |
| 1 | Introduced | otherwise | ✅ `1000` "Introduced in House" (also `Intro-H`), `10000` "Introduced in Senate" |

- **Fallback when actionCode is missing:** match the action text with `/^Passed\/agreed to in (House|Senate)/`, `/^Became Public Law No:/`, `/^Reported\b|\. Reported by /` and `/discharged/i`. (T1: a Senate report reads "Committee on Environment and Public Works. Reported by Senator …", which `/^Reported/` alone misses.)
- **Duplicates:** each event appears once per source system, so match on the LoC code and dedupe milestones by kind.
- **Referral milestone:** House `H11100` "Referred to the House Committee on …"; the Senate copy has no code (type `IntroReferral`, "Read twice and referred to the Committee on …"). Match type `IntroReferral` plus `/referred to/i`.
- **Tests:** vitest unit tests in `scripts/tracker/stage.test.mjs`, using fixtures saved from the probe (`scripts/tracker/fixtures/`, real responses with no key in them).
- **Caveat:** stage describes this bill only. A bill whose text was enacted inside another bill (often the NDAA) stays at its own stage. The methodology says so (§4.7).

**Milestones** for the expanded row, in date order, keeping the latest of each kind:
- introduced;
- referred to committee(s);
- reported;
- passed House;
- passed Senate;
- resolving differences (if any);
- presented to the President;
- became law (with the law number) or vetoed.

A passage milestone carries its roll call when it has one: chamber, roll number and URL per T1 #11.

### 3.4 Normalized bill (`content/tracker/bills.json`, validated by zod in `src/lib/tracker.ts`)
```ts
type TrackerBill = {
  id: string;                 // "s146-119": `${type}${number}-${congress}`, same ids as content/bills.json
  congress: number;
  type: "HR" | "S" | "HJRES" | "SJRES";
  number: number;
  label: string;              // "S. 146", "H.R. 2794", "H.J.Res. 12", "S.J.Res. 3"
  title: string;              // the API's display title, verbatim
  originChamber: "House" | "Senate";
  introducedDate: string;     // YYYY-MM-DD
  sponsor: { name: string; party: string; state: string; district?: number; bioguideId: string }; // name "Sen. Ted Cruz"
  cosponsors: { count: number; D: number; R: number; I: number; original: number; latestDate?: string }; // withdrawn excluded
  stage: 1 | 2 | 3 | 4 | 5;
  stageLabel: string;         // §3.3
  latestAction: { date: string; text: string };
  milestones: { date: string; label: string; vote?: { chamber: "House" | "Senate"; roll: number; url: string } }[];
  committees: { name: string; chamber: string; latest?: { name: string; date: string } }[];
  summary: { version: string; date: string; paragraphs: string[]; excerpt: string[] } | null; // version = actionDesc, e.g. "Introduced in Senate"
  policyArea: string | null;
  subjects: string[];
  topics: string[];
  related: { id: string; label: string; relation: string; inTracker: boolean }[]; // relation e.g. "Identical bill"
  companions: { id: string; label: string; href: string }[]; // §4.5; href "#<id>" for a tracker bill, else Congress.gov
  cbo: { title: string; date: string; url: string }[];
  law: string | null;         // "Public Law 119-12"
  text: { version: string; date: string; url: string } | null; // latest version, the Formatted Text URL when it exists
  matchedBy: ("watchlist" | "subject" | "title")[];
  congressGovUrl: string;     // https://www.congress.gov/bill/119th-congress/senate-bill/146
  updateDate: string;
};
```
**Excerpt (T8):** `summary.paragraphs` keeps every paragraph. `summary.excerpt` is what the panel shows: the leading paragraphs, starting at the first one that ends in a period (skipping the title-only opening line), up to about 600 characters, and always ending at a paragraph that ends in a period. CRS splits lists into paragraphs, so any other cut can end mid-sentence (S. 146's third paragraph ends "…intimate visual depictions of"). A single long first paragraph is kept whole. The title-only line is used only when no paragraph ends in a period.

**Milestone label (T8):** a committee discharge (`14500`, or "discharged" in the text) is the milestone "Discharged from committee", not "Reported by committee". It's still stage 2, "Reported by committee" (§3.3).

`src/lib/tracker.ts` parses `bills.json`, `index.json` and `meta.json` at import time, so bad data fails the build. It exports `getTrackerBills()`, `getTrackerMeta()` and `getTrackerBill(id)`. Keep to one loader; `src/lib/bills.ts` stays for the article bills.

### 3.5 What the rest of the site reads
- **Home stats** (`content/bill-stats.json`, same schema) are cumulative counts of tracker bills:
  - `introduced` = every tracker bill;
  - `reported` = stage ≥ 2;
  - `passedOneChamber` = stage ≥ 3;
  - `becameLaw` = stage 5.

  `asOf` is the fetch date. Set `placeholder: false`.
- **The article rail** (`statusLine`): when a rail bill's id is in the tracker, its status line comes from the tracker: `stageLabel` plus the latest action date, as of `fetchedAt`. Otherwise it falls back to the manual `content/bills.json` status. The manual fields stay, as the fallback and for the rail's title and sponsor.

### 3.6 Daily refresh (T7, optional)
A GitHub Action (`.github/workflows/tracker.yml`):
- runs daily at 10:17 UTC and on `workflow_dispatch`;
- runs `npm ci` and then `npm run tracker:fetch`, with `CONGRESS_API_KEY` from repository secrets;
- commits `content/tracker/`, `content/bill-stats.json` and `public/data/` (the CSV and, since T8, the per-bill files) only if they changed, with the message "data: tracker refresh YYYY-MM-DD"; a failed fetch fails the job before the commit step;
- Node comes from `.nvmrc`; `permissions: contents: write` only; one run at a time (`concurrency`);
- caches `.cache/congress` with `actions/cache`.

The dek may say "updated daily" only once this exists and has run.

---

## 4. UI (`src/app/tracker/`)

### 4.1 Structure
```
Topbar (default mint chrome) · current="/tracker"
main > Tile mode="paper"
  header        h1, dek, source line
  section "Bill finder" (h2)
    form role="search"   search, chamber, stage, sort · fieldset Topics (radio pills)
    p role="status"      "Showing 1–10 of 215 bills"
    div.bill-table       container-type: inline-size; holds the column header and the list
      column header      aria-hidden; changes with the table layout (§4.4)
      ol                 one li per bill on the current page > details > summary (collapsed row) + panel (fetched on open, T9)
    nav "Pagination"     per page, range, page select, previous/next (§4.4b)
    empty state          replaces the table and pagination when 0 match
    noscript             "The full list needs JavaScript. Download every bill as CSV" (T9)
  section "How this list is built" (h2)  methodology, data links, citation (T6)
SiteEnd
```
- **Server and client.** `page.tsx` stays a server component and passes BillFinder only the copy and the topic labels. `BillFinder.tsx` (`"use client"`) imports `content/tracker/index.json` (T8's row fields) itself, so the rows ship as a hashed, immutably cached JS chunk rather than as props in the HTML. It does search, filters, sort, pagination and URL state. The URL stays the single source of truth (`useSyncExternalStore`); there is no state library.
- **The row** is `BillRow.tsx` (`"use client"`): it fetches its panel from `/data/tracker/bills/{id}.json` (§4.5).
- **Only the current page is in the DOM**, on the server and in the browser.
- **No-JS (T9, an exception to CLAUDE.md §5):** the server render is the default view, the first 10 bills of the default sort, with no panels. A `<noscript>` note under the table reads "The full list needs JavaScript. Download every bill as CSV" (copy in page.json `noscript`), linking the CSV; an opened row shows only "View on Congress.gov ↗". Why: rendering every bill and its panel made the page 1.5 MB raw (128 KB gzip) with 2,180 elements. The controls are inert without JS; that's accepted.
- **Pagination after mount:** the pagination nav renders after mount; the server's 10 rows are the same as the client's first page, so nothing shifts.
- **HTTP caching (`next.config.ts`):** `/data/tracker/bills/*` and `/data/*.csv` send `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` (the data changes at most daily). Next's hashed chunks, the index included, are already immutable.
- **Budgets (`tests/tracker.perf.spec.ts`, production only via `playwright.prod.config.ts`):** server HTML ≤ 120 KB raw with ≤ 10 rows and no panel content; one request per opened row and none on reopening; LCP < 2.5 s and TBT < 200 ms at 390 with 4× CPU and Fast 3G.

### 4.2 Header (Figma `2211:96`, `2211:97`, `2211:149`)
- **h1:** `type-display-h2`, copy from `content/tracker/page.json`, with "{congress} Congress" in `text-signal`. That's display size, so signal text is allowed (≥ 24px).
- **Dek:** `type-heading-h4`, max width `--measure`.
- **Source line:** `type-heading-h5 text-tile-muted`, "Congress.gov, updated <time>{fetchedAt}</time>". This matches Home.
- **Spacing:**
  - h1 to the intro: `tile` (40);
  - dek to the source line: `16`;
  - header to the Bill finder section: `tile-lg` (140).
- **Page padding:** top `tile-md`, sides `tile`, bottom `tile-lg`.

### 4.3 Finder controls (Figma `2216:30`)
- **"Bill finder" h2:** `type-display-h3`, followed by a `tile` gap.
- **Controls row:**
  - the search is on the left (24rem; 384 in Figma);
  - three selects sit on the right, `stack-sm` (8) apart;
  - the row is bottom-aligned, with a `32` gap down to Topics.
- **Labels:** `type-text-small`, `stack-sm` above their field.
- **Fields:** 3.5rem tall (`spacing-56`), 1px `border-tile-fg`, padding `16`, `type-text-regular`, paper fill.
  - Placeholders use `text-tile-muted`, like all secondary text (§4.4).
  - Selects are native `<select>` with `appearance-none` and an aria-hidden Carbon `ChevronDown` at `size-icon-inline`, positioned inside.
- **Options:**
  - **Chamber:** Both / House / Senate (the originating chamber).
  - **Stage** (labelled "Status" in Figma; keep "Status"): Any status, Became law, Passed both chambers, Passed one chamber, Reported by committee, Introduced only. Each filters to the exact stage.
  - **Sort by:** Latest action (default), Introduced (newest), Most cosponsors, Bill number.
- **Search:** `type="search"`, label "Search bills".
  - It matches label variants: "hr 2794", "H.R.2794", "2794" and "s146" all find their bill. A bill type alone ("hr", "h.r.", "s", "hjres") lists that type (T11).
  - Chrome's native clear "×" is hidden; our own button sits inside the field (T11): Carbon `Close` at `size-icon-inline` in ink, a 2.5rem round target, `aria-label` "Clear search" (page.json `finder.clearSearch`), shown only with a query; it clears the search and returns focus to the field.
  - It also matches the title and the sponsor's name.
  - Matching is case-insensitive and diacritic-insensitive (NFD, marks stripped), so "Maria" finds "María".
  - Filter on input; no submit needed.
- **Topics:** `<fieldset>` with `<legend class="type-text-small">Topics</legend>`.
  - One radio group: "All topics" plus `config.topics`.
  - Each radio is visually hidden, and its label is a pill: rounded-full, 1px `border-tile-fg`, padding `8`/`16`, `type-text-regular`.
  - **Checked:** ink fill, paper text.
  - **Focus:** the 2px focus ring goes on the pill via `:has(:focus-visible)`.
  - **Count badge:** a 1.375rem circle (22 in Figma), `type-text-small`; stone with ink text, or paper with ink text when checked.
  - Counts reflect the current search, chamber and status, not the topic.
  - Pills wrap, `stack-sm` apart in both directions.
- **Filters menu below md (768) (T10):** the search stays visible; under it a full-width "Filters" button (3.5rem, 1px `border-tile-fg`, `type-text-regular`, a ChevronDown that rotates when open, with the transition only under `motion-safe`). Its label counts the active filters: "Filters (2)" when two of chamber, status, sort and topic differ from their defaults. It has `aria-expanded` and `aria-controls="finder-filters"`. The panel opens inline (no modal, no focus trap, the back button untouched): the three selects stacked full width, then the topic pills, then "Show {n} bills" (ink pill: closes the panel, scrolls the result count into view and focuses it) and "Clear filters" (a text button: resets everything but the search and per page, panel stays open). Escape closes it and returns focus to the button. It always starts closed, even with filters in the URL. The controls render once; at md and up the panel is `display: contents`, so the layout is exactly the T4 one (checked pixel-identical at 768, 1024 and 1440). Copy in page.json `finder`.
- **Result count:** `p role="status" tabindex="-1"`, `type-text-small text-tile-muted`, between Topics and the table: "Showing 1–25 of 214 bills". It's the focus target after a page change (§4.4b). This isn't in Figma; it's needed for WCAG 4.1.3.
- **URL state:** `q`, `chamber`, `status`, `topic`, `sort`, `page` and `per` sync to the query string with `history.replaceState`, and are read on mount, so a filtered view can be shared. Default values are left out of the URL.

### 4.4 The bill table: columns, spacing and text limits
The table has to hold short labels (S. 146) next to long verbatim text: official titles can run past 200 characters, and latest actions past 100. Three rules keep it from folding badly:
- every column has a minimum and maximum line length in characters;
- long text is clamped (the full text is always one click away in the expanded row);
- the layout changes with the table's own width (a container query), not the viewport.

**Stacked top rule (T11).** The stacked layout has no header, so the list opens with the header's 4px `tile-fg` rule (chosen over a 1px `tile-line` because the wide and medium tables open with that 4px rule, and the rows' 1px lines then read as separators, as they do there).

**Sticky column header (T10).** In the wide and medium layouts (the stacked layout has no header) `.bill-head` is `position: sticky` at top 0 with a paper background and `z-index: 1`, keeping its 4px rules. It sticks inside `.bill-table`, so it leaves with the table. Only at viewport height ≥ 640px; it stays sticky under reduced motion (a reading aid, not motion; CLAUDE.md §5). WCAG 2.4.11: BillTable measures the header (ResizeObserver) into `--bill-head-h`, and every summary and link in the table gets that as `scroll-margin-top`, so a focused row never sits under it. A Shift+Tab walk without it leaves 12 of 49 summaries under the header; with it, none. The /tracker topbar isn't sticky.

**Text per cell.** Only four things per row are bold: the bill label, the title, the status label and the cosponsor count. The latest action is regular weight; in Figma it's still H5 (§5).

**Secondary text** (chamber, sponsor, step, date, range) is `text-tile-muted`: ink at 72% (`--muted`), ≈ 8:1 on paper. In Figma it's ink with its opacity bound to `MutedAgainstLight` (72), the same token Home uses. Never a raw gray.

| Cell | Style | Rules |
|---|---|---|
| Bill label | `type-heading-h5` | `nowrap`; the longest, "H.J.Res. 123", is 12 characters |
| Chamber | `type-text-regular` muted | `nowrap` |
| Title | `type-heading-h5`, `text-wrap: pretty` | `max-width: 60ch`; clamp 3 lines (4 in the stacked layout) |
| Sponsor | `type-text-regular` muted | 2 lines at most |
| Status label | `type-heading-h5` | `nowrap`; the longest, "Passed both chambers", is 20 characters |
| Progress bar | 5 segments, 3/16rem apart (`--progress-gap`, 3 in Figma; T11, was `spacing-4`), 7/16rem tall | under the status label, `spacing-4` below it; full cell width, max 16rem; signal for done, stone for not done; `aria-hidden`. Fill exactly n segments. |
| Step | `type-text-regular` muted | "Step 3 of 5", `nowrap`, under the bar, `spacing-4` below it |
| Latest action | `type-text-regular` | `max-width: 48ch`; clamp 3 lines (2 in the medium and stacked layouts) |
| Date | `type-text-regular` muted | `nowrap`, in a `<time>` |
| Cosponsors | `type-heading-h5`, `tabular-nums` | right-aligned, `nowrap` |
| Chevron | Carbon `ChevronDown`, `size-icon-inline` | `aria-hidden`; rotates 180° when `[open]`, with a transition only under `motion-safe`. Add it to CLAUDE.md §3's icon list. |

`ch` in `max-width` is the cell's own font, so 60ch means 60 characters of that title. Clamping is visual only: screen readers still get the whole text.

**Spacing:**
- **Rows are sized by the two-line cells, so the separators sit equidistant.** Every other multi-line cell is a primary line in `type-heading-h5`, `spacing-4`, then a secondary line in `type-text-regular`: 25.2 + 4 + 22 ≈ 52 at 1440.
  - **The status cell is the exception.** It has three tiers: label, `spacing-4`, bar, `spacing-4`, step. That's 11px taller than the others at 1440: `--status-overhang = spacing-4 + bar height` (0.6875rem).
  - **If the row padded from the tallest cell,** every other column would get 11px more space below its text than above, and every rule would look too low. That's the bug Joey caught.
  - **Instead,** in the wide and medium layouts the status cell has `margin-block-end: calc(-1 * var(--status-overhang))`. Its step hangs into the row's bottom padding, and the row height comes from the two-line cells.
  - **Row padding** is `--table-row-pad: calc(var(--layout-stack) + var(--status-overhang) / 2)` on both sides: 29.5 at 1440. That centers the two-line text exactly between the rules and leaves the step about 19px above the rule. At ≤ 991 (stack 16) the step is about 11px above the rule.
  - **Long titles or actions** can make a row taller. The padding stays symmetric around them, and the step overhang no longer matters.
  - **The stacked layout** doesn't use the overhang; the status block sits in the stack.
- Row padding: `--table-row-pad` top and bottom (above), or `stack` in the stacked layout. Rule: 1px `border-tile-line` at the bottom. Cells are top-aligned. Don't vertically center them: that breaks the shared first line people scan across.
- Column header: `type-text-regular`, padding `16` top and bottom, a 4px ink rule top and bottom.

**Layouts** (container query on `.bill-table`; tracks as layout tokens in globals.css):

| Layout | When the table is | Columns | Column gap |
|---|---|---|---|
| Wide | ≥ 66.5rem | bill `7.5rem` · title and sponsor `minmax(15rem, 3fr)` · status `13rem` · latest action `minmax(14rem, 2fr)` · cosponsors `5.5rem` · chevron `1.5rem` | `2rem` (32) |
| Medium | 38.5–66.5rem | main `minmax(15rem, 1fr)` · status `12rem` · cosponsors `5.5rem` · chevron `1.5rem` | `1.5rem` (24) |
| Stacked | < 38.5rem | main `1fr` · chevron `1.5rem` | `1rem` (16) |

- **The breakpoints are the column minimums added up.** Wide is 7.5 + 15 + 13 + 14 + 5.5 + 1.5 + 5 × 2 = 66.5rem. Medium is 15 + 12 + 5.5 + 1.5 + 3 × 1.5 = 38.5rem. Container queries can't read custom properties, so write the numbers in the `@container` rules with a comment that shows this sum. Change the tokens and you change the sum.
- **Why rem:** the root scales (A6), so the same rule holds at every monitor and zoom. With the current root:

  | Viewport | Layout | Title column | Title chars per line | Action chars per line |
  |---|---|---|---|---|
  | 1440 | Wide | ≈ 418px | ~40 | ~40 |
  | 1280 and 1024 | Wide | ≈ 16–26rem | 24–40 | 26–40 |
  | 991 and 768 | Medium | 21–35rem | 34–56 | (folded, 2 lines) |
  | 390 and 320 | Stacked | full width | up to the clamp | (2 lines) |

  These are estimates. T3 measures them, and the min and max rules are what the tests enforce.
- **Extra width goes 3:2** to the title and the latest action. Past their `ch` caps, it becomes white space inside the column, so the columns still line up.
- **Wide** (Figma `2216:46`). Header labels: Bill · Title and sponsor · Status · Latest action · Cosponsors (right-aligned) · an empty chevron slot. The chamber sits under the bill label.
- **Medium.** The main cell stacks:
  - "S. 146 · Senate" (label plus muted chamber, one line);
  - the title;
  - the sponsor;
  - the latest action and its date ("Latest: {text} · {date}", clamp 2).

  Header labels: Bill · Status · Cosponsors · slot.
- **Stacked.** No header row. The main cell stacks, `stack` (16) apart:
  - "S. 146 · Senate" level with the chevron;
  - the title, with the sponsor `spacing-4` below it;
  - the status block (bar max 16rem);
  - the latest action and its date;
  - "{n} cosponsors".

**Semantics:**
- `<ol>` with an `<li id="{bill.id}">` per bill. Each `li` holds a `<details>`, and its `<summary>` is the row.
- The summary holds phrasing content only (`<span>`s laid out with grid), and no links.
- Hide the default marker (`list-style: none` and `::-webkit-details-marker`).
- Visually hidden prefixes ("Status:", "Latest action:", "cosponsors") make the summary's accessible name read as a sentence. It's announced as a button with its expanded state.
- The global 2px focus ring must show on the summary.

### 4.4b Pagination (Figma `2220:32`)
A `<nav aria-label="Pagination">`, `stack` below the table. Two groups sit at the ends, `stack` apart inside each:
- **Left:**
  - "Bills per page" as a native `<select>`: 10, 25, 50 or 100, **default 10** (T9, Joey's call; `DEFAULTS.per` and `parseState`'s fallback). The visible label and the select read as one control, with a ChevronDown inside.
  - The range, "1–10 of 215 bills", in `type-text-regular` muted. Use an en dash.
- **Right:**
  - "Page" as a native `<select>` (1…n), followed by "of 9";
  - Previous and next: 2.5rem circles (`spacing-40`), 1px `border-tile-fg`, with Carbon `ChevronLeft`/`ChevronRight` at `size-icon-inline`, `aria-hidden`. They carry `aria-label` "Previous page" and "Next page", and are `stack-sm` (8) apart.
  - At the first or last page the button is `disabled`, with a `border-tile-line` border and a muted icon.
- **Selects:** borderless, like Figma, but every select's hit area is at least 2.5rem tall. Hover and focus are visible, and the focus ring is the global one.
- **Behavior:**
  - Changing search, a filter, sort or per page goes back to page 1.
  - Changing page scrolls the table's top into view (instantly under reduced motion) and focuses the result count. That way keyboard and screen-reader users start at the top of the new page instead of staying at the bottom.
  - `page` and `per` are in the URL (§4.3).
  - With one page, hide the page select and the buttons and keep the range. With no results, hide the nav.
- **Narrow tables:** below 38.5rem the nav wraps. The range takes its own line first; then per page sits on the left and the pager on the right, with a `16` row gap.

### 4.5 Expanded row (T5)
- **Lazy (T9):** the panel's data is `/data/tracker/bills/{id}.json` (T8), fetched on first open and kept in a module-level Map, so reopening, paging back or re-filtering never refetches. `pointerenter` and `focus` on the summary prefetch it. While loading, the panel reads "Loading details…" with `aria-busy="true"` in the panel's own box, so the row doesn't jump. A failed fetch shows "Couldn't load the details" plus "View on Congress.gov ↗" (the URL built from the row's type and number) and retries on the next open. Hash links open the row, and its `toggle` starts the fetch. **T11:** the first reveal runs a task after mount (Next's App Router replaces the URL in its own mount effect, which runs after ours and undid the reveal), and a module-level `popstate`/`hashchange` listener remembers a hash Next drops while hydrating. Any finder change other than a reveal drops the hash from the URL, so a reload doesn't re-reveal a bill and undo the change. The markup once loaded is unchanged; the row's fields (title, sponsor party) merge with the file's.
- **Layout:** the panel starts at the title column (column 2 through the last at ≥ 1280; full width below). It ends with a `tile` bottom padding.
- **≥ 1024:** two columns.
  - **Left (reading measure):**
    - "Summary" as an h3 in `type-heading-h5`;
    - `summary.version · date` in `type-text-small text-tile-muted`;
    - `summary.excerpt` in `type-text-regular` (T8: whole paragraphs up to about 600 characters, never ending mid-sentence; §3.4);
    - then "Read the full CRS summary on Congress.gov ↗".
    - With no summary: "No CRS summary yet." in muted text.
  - **Right:** a `<dl>` with:
    - **Where it stands:** an `<ol>` of milestones (date, label, and "Roll call {n} ↗" when there's a vote);
    - **Committees:** names, with each latest activity and date;
    - **Cosponsors:** "21: 12 D, 9 R · 4 original". Add "Bipartisan" when both D and R are above 0, counting the sponsor's party;
    - **Companion bill:** the label links to `#{id}` when `inTracker`, and to Congress.gov otherwise. A companion is a related bill marked "Identical bill", or a tracker bill from the other chamber with the same title (T5; Congress.gov rarely marks "Identical", per T1). Computed by fetch.mjs as `companions` (T8);
    - **Subjects:** policy area plus up to 6 CRS subjects;
    - **CBO cost estimate:** links;
    - **Text:** the latest version, its date and a link;
    - **Law:** "Public Law 119-12".

    Omit any term that has no data.
- **Footer link:** "View on Congress.gov ↗".
- **Links:** every external link follows A9: ↗ plus visually hidden "(external site)".
- **Hash links:** if the URL hash matches a bill id on load (or on `hashchange`), clear any filter that hides it, go to the page that holds it, open that `<details>` and scroll it into view. That's a small effect inside BillFinder.
- **Payload:** the panel content is rendered for every bill. Measure the `/tracker` HTML transfer size gzipped. If it's above 300 KB, cut the summary excerpt to its first paragraph and report it.

### 4.6 Empty state (Figma `2212:536` / `2217:46`)
- **Placement:** it replaces the list and the pagination, keeps the column header, and is announced by the status line.
- **Heading:** an h3 in `type-display-h3`: `No bills match “{q}”`, or "No bills match these filters" when there's no query.
- **Body:** `type-text-article`, max `--measure`, copy from page.json.
- **Button:** "Clear all filters", a pill: ink fill, paper text, `type-heading-h5`, padding `16`/`24`. Reuse an existing button style if one exists.
  - It resets every control and the URL, and moves focus to the search input.
- **Spacing:** copy to button `tile`; heading to body `stack`.

### 4.7 Copy (`content/tracker/page.json`, never hardcoded in components)
Copy is Joey's to approve, so mark the file `TODO(joey)`. Suggested values:
- **h1:** "AI bills in the" + "{congress} Congress". Home uses a lowercase "bills"; keep them the same.
- **Dek:** "Bills in the 119th Congress that name artificial intelligence, deepfakes or related technology in their title, plus bills we add after reading their CRS summaries. Status from Congress.gov." Don’t claim "every bill that would regulate, fund or restrict AI" (§5).
- **Empty body:** "Try a bill number like “H.R. 1283”, a sponsor’s last name, or a broader topic. The tracker lists bills that name AI or related technology in their title, plus bills we add after reading their summaries."
- **T1 / Nov 9:** CRS doesn't index 119th bills under AI (§2.4 #5), so the dek and the empty body were reworded to the real rule (title match, plus hand-picked bills from the summary review). T3 writes this copy into page.json; it stays TODO(joey) for approval.
- **Methodology** (T6): three short paragraphs:
  - what's included (§3.1, in plain words, including the review queue);
  - what stage means, plus the enacted-elsewhere caveat (§3.3);
  - the source and the refresh, with the fetch date.
- **Links:** "Download the data (CSV)" and "How to cite": `AI in Congress, “AI bills in the 119th Congress,” updated {date}, {url}.`

### 4.8 Accessibility checks specific to the tracker
- Every control has a visible label, and the topic group has a legend.
- The status message updates on every filter change. It's polite, not assertive.
- The summary rows are reachable by Tab, toggle with Enter and Space, and show the focus ring.
- No horizontal scroll at 320 or at 400% zoom: the table becomes stacked rows, so this holds.
- Signal is used only for display-size text and the bar segments. The bar is aria-hidden; its meaning is in the text.
- `prefers-reduced-motion`: no chevron transition.
- axe reports 0 violations with rows collapsed, one row expanded, and in the empty state.

---

## 5. Where this departs from Figma, and why
Already fixed in Figma (Nov 8):
- secondary text is ink at `MutedAgainstLight`;
- Heading/H5 is Switzer;
- rows are padded 29.5 (`stack` + half the status overhang) on both sides, and the status cell is fixed at the two-line height with its step overflowing (Figma's stand-in for the negative margin);
- the columns are 120 / fill / 208 / 342 / 88 / 24 with 32 gaps (the 1440 case of §4.4);
- the page controls are an auto-layout Pagination row.

Still different:
1. **Latest action** is `type-text-regular` in the build, but H5 in Figma. Change the 7 text layers to Text/Regular.
2. **The status bar fills n segments.** The mock shows 4 for "Step 5 of 5".
3. **Chamber means the originating chamber.** The mock's "S. 146 · House" is wrong data.
4. **The dek** describes the real inclusion rule instead of "every bill that would regulate, fund or restrict AI", which the data can't back.
5. **Added:** the result count (4.1.3), the URL state, the medium and stacked layouts (§4.4), and the methodology/CSV/cite section.
6. **Pagination copy:**
   - "Bills per page" (not "Items per page: 10");
   - "1–25 of 214 bills", with an en dash and "bills" (not "1 - 10 of 20 items");
   - "Page [1] of 9" (not "1 of 10 pages");
   - ~~the default per page is 25, not 10.~~ T9: the default is now 10, as in Figma (Joey's call; it also keeps the page light).
7. **Figma's own placeholder errors:** "H.R, 2794" has a comma; NO FAKES is marked "Became law".

---

## 6. Open (Joey)
- Approve the copy in `content/tracker/page.json` and the topic rules in `config.json`.
- Go through `review.json` after the first backfill.
- T7: add the `CONGRESS_API_KEY` repository secret and approve the Action committing data to main.
  1. **Add the secret:** on GitHub, open the repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Name: `CONGRESS_API_KEY`. Secret: the same key as in `.env.local`. **Add secret.**
  2. **Push** `.github/workflows/tracker.yml` and `.nvmrc` to `main`. A scheduled or manual run only exists once the workflow file is on the default branch.
  3. **First run:** **Actions** → **Tracker refresh** (left list) → **Run workflow** → branch `main` → **Run workflow**. The first run has no `.cache/congress`, so it fetches each candidate's sub-endpoints once (about 2,400 requests if the config hash changed and it does a full sweep, otherwise far fewer); `timeout-minutes` is 90.
  4. **Check it:** the run is green, and either the log says "No data changes." or there's a new commit "data: tracker refresh YYYY-MM-DD" on `main`. Then resolve the TODO(joey) in `content/tracker/page.json`'s `_note` (the dek's "updated daily").
  5. After that it runs daily at 10:17 UTC. If `main` is protected against direct pushes, the commit step fails: allow `github-actions[bot]` to push, or change the step to open a pull request instead.
