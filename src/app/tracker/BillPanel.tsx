import type { ReactNode } from "react";
import { ArrowUpRight } from "@carbon/icons-react";
import { formatDate } from "@/lib/dates";
import type {
  TrackerBillDetail,
  TrackerIndexBill,
  TrackerPage,
} from "@/lib/tracker";
import { fill } from "./finder";

const SUBJECTS = 6;

function When({ iso }: { iso: string }) {
  return <time dateTime={iso}>{formatDate(iso)}</time>;
}

/** A9's external link: the visible ↗ plus visually hidden text. */
export function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} rel="noopener" className="py-4">
      {children}
      <span className="sr-only"> (external site)</span>
      <ArrowUpRight
        size={32}
        aria-hidden
        className="ml-4 inline size-icon-inline align-middle"
      />
    </a>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div>
      <dt className="type-heading-h5">{term}</dt>
      <dd className="mt-4">{children}</dd>
    </div>
  );
}

type BillPanelProps = {
  /** The row's fields plus its fetched detail file (T9). */
  bill: TrackerIndexBill & TrackerBillDetail;
  copy: TrackerPage["panel"];
};

// The expanded row (tracker spec §4.5), rendered once BillRow has fetched the
// bill's detail. Laid out by .bill-panel (globals.css). Terms with no data are
// left out.
export function BillPanel({ bill, copy }: BillPanelProps) {
  const { summary, cosponsors, sponsor } = bill;
  const split = [`${cosponsors.D} D`, `${cosponsors.R} R`];
  if (cosponsors.I) split.push(`${cosponsors.I} I`);
  const bipartisan =
    cosponsors.D + (sponsor.party === "D" ? 1 : 0) > 0 &&
    cosponsors.R + (sponsor.party === "R" ? 1 : 0) > 0;
  const subjects = bill.subjects.slice(0, SUBJECTS);

  return (
    <div className="bill-panel type-text-regular">
      {/* Shown only when the row clamps the title (BillRow measures it);
          the summary already gives screen readers the whole title. */}
      <p className="bill-panel-title bill-prose type-heading-h5" aria-hidden>
        {bill.title}
      </p>
      <section
        aria-labelledby={`${bill.id}-summary`}
        className="bill-panel-summary bill-prose"
      >
        <h3 id={`${bill.id}-summary`} className="type-heading-h5">
          {copy.summary}
        </h3>
        {summary ? (
          <>
            <p className="mt-4 type-text-small text-tile-muted">
              {summary.version} · <When iso={summary.date} />
            </p>
            {summary.excerpt.map((text, i) => (
              <p key={i} className="mt-16">
                {text}
              </p>
            ))}
            <p className="mt-16">
              <External href={bill.congressGovUrl}>{copy.fullSummary}</External>
            </p>
          </>
        ) : (
          <p className="mt-4 text-tile-muted">{copy.noSummary}</p>
        )}
      </section>
      <dl className="bill-panel-facts flex flex-col gap-stack">
        {bill.milestones.length > 0 && (
          <Fact term={copy.stands}>
            <ol className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-16 gap-y-4">
              {bill.milestones.map((milestone, i) => (
                <li key={i} className="col-span-2 grid grid-cols-subgrid">
                  <span className="text-tile-muted">
                    <When iso={milestone.date} />
                  </span>
                  <span>
                    {milestone.label}
                    {milestone.vote && (
                      <>
                        {" · "}
                        <External href={milestone.vote.url}>
                          {fill(copy.rollCall, { roll: milestone.vote.roll })}
                        </External>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </Fact>
        )}
        {bill.committees.length > 0 && (
          <Fact term={copy.committees}>
            <ul className="flex flex-col gap-4">
              {bill.committees.map(({ name, chamber, latest }) => (
                <li key={name}>
                  {chamber} {name}
                  {latest && (
                    <span className="text-tile-muted">
                      {" · "}
                      {latest.name}, <When iso={latest.date} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Fact>
        )}
        {cosponsors.count > 0 && (
          <Fact term={copy.cosponsors}>
            {fill(copy.cosponsorSplit, {
              count: cosponsors.count,
              split: split.join(", "),
              original: cosponsors.original,
            })}
            {bipartisan && ` · ${copy.bipartisan}`}
          </Fact>
        )}
        {bill.companions.length > 0 && (
          <Fact term={copy.companion}>
            {bill.companions.map(({ id, label, href }, i) => (
              <span key={id}>
                {i > 0 && ", "}
                {href.startsWith("#") ? (
                  <a href={href} className="py-4">
                    {label}
                  </a>
                ) : (
                  <External href={href}>{label}</External>
                )}
              </span>
            ))}
          </Fact>
        )}
        {(bill.policyArea || subjects.length > 0) && (
          <Fact term={copy.subjects}>
            {[bill.policyArea, ...subjects].filter(Boolean).join(" · ")}
          </Fact>
        )}
        {bill.cbo.length > 0 && (
          <Fact term={copy.cbo}>
            <ul className="flex flex-col gap-4">
              {bill.cbo.map(({ title, date, url }) => (
                <li key={url}>
                  <External href={url}>{title}</External>
                  <span className="text-tile-muted">
                    {" · "}
                    <When iso={date} />
                  </span>
                </li>
              ))}
            </ul>
          </Fact>
        )}
        {bill.text && (
          <Fact term={copy.text}>
            <External href={bill.text.url}>{bill.text.version}</External>
            <span className="text-tile-muted">
              {" · "}
              <When iso={bill.text.date} />
            </span>
          </Fact>
        )}
        {bill.law && <Fact term={copy.law}>{bill.law}</Fact>}
      </dl>
      <p className="type-heading-h5">
        <External href={bill.congressGovUrl}>{copy.congressGov}</External>
      </p>
    </div>
  );
}
