import { statSync } from "node:fs";
import type { Metadata } from "next";
import { SiteEnd } from "@/components/SiteEnd";
import { Tile } from "@/components/Tile";
import { Topbar } from "@/components/Topbar";
import { formatDate } from "@/lib/dates";
import { SITE_LIVE, SITE_URL } from "@/lib/site";
import {
  getTrackerBills,
  getTrackerMeta,
  getTrackerPage,
  getTrackerTopics,
} from "@/lib/tracker";
import { BillFinder } from "./BillFinder";
import { fill, ordinal } from "./finder";

const CSV = "/data/ai-bills-119.csv";

export const metadata: Metadata = {
  title: "Bill tracker · AI in Congress",
  // A page-level robots replaces the layout's, so keep pre-launch nofollow.
  robots: { index: false, follow: SITE_LIVE },
};

export default function TrackerPage() {
  const copy = getTrackerPage();
  const meta = getTrackerMeta();
  // Only the row count: BillFinder brings its own rows (T9).
  const bills = getTrackerBills();
  const method = copy.methodology;
  const congress = ordinal(meta.congress);
  const fetched = formatDate(meta.fetchedAt.slice(0, 10));
  // SITE_URL falls back to "#" until it's set; a citation needs the path at least.
  const url = `${SITE_URL === "#" ? "" : SITE_URL}/tracker`;
  const values = { congress, date: fetched, url };

  return (
    <>
      <Topbar variant="article" current="/tracker" />
      <main id="main" tabIndex={-1} className="outline-none">
        <Tile mode="paper" top="md" className="pb-tile-lg">
          <header>
            <h1 className="type-display-h2">
              {copy.title.lead}{" "}
              <span className="text-signal">
                {fill(copy.title.congress, values)}
              </span>
            </h1>
            <p className="mt-tile max-w-measure type-heading-h4">{copy.dek}</p>
            <p className="mt-16 type-heading-h5 text-tile-muted">
              {copy.source} <time dateTime={meta.fetchedAt}>{fetched}</time>
            </p>
          </header>
          <section aria-labelledby="finder-heading" className="mt-tile-lg">
            <h2 id="finder-heading" className="mb-tile type-display-h3">
              {copy.finderHeading}
            </h2>
            <BillFinder copy={copy} topics={getTrackerTopics()} />
            {/* The server renders only the default page (T9, spec §4.1). */}
            <noscript>
              <p className="prose-article mt-stack type-text-regular">
                {copy.noscript.text}{" "}
                <a href={CSV} download>
                  {copy.noscript.link}
                </a>
              </p>
            </noscript>
          </section>
          <section aria-labelledby="method-heading" className="mt-tile-lg">
            <h2 id="method-heading" className="mb-tile type-display-h3">
              {method.heading}
            </h2>
            {/* prose-article: the article body's link style and rhythm. */}
            <div className="prose-article max-w-measure type-text-article">
              {method.paragraphs.map((p) => (
                <p key={p}>{fill(p, values)}</p>
              ))}
              <p>
                <a href={CSV} download>
                  {method.download}
                </a>{" "}
                <span className="text-tile-muted">
                  {fill(method.downloadMeta, {
                    size: `${Math.round(statSync(`public${CSV}`).size / 1000)} KB`,
                    // fetch.mjs writes the CSV and bills.json in the same run.
                    rows: bills.length,
                  })}
                </span>
              </p>
              <h3 className="type-heading-h4">{method.cite}</h3>
              <p>{fill(method.citation, values)}</p>
            </div>
          </section>
        </Tile>
      </main>
      <SiteEnd />
    </>
  );
}
