"use client";

import { useState, type SyntheticEvent } from "react";
import { ChevronDown } from "@carbon/icons-react";
import { formatDate } from "@/lib/dates";
import type {
  TrackerBillDetail,
  TrackerIndexBill,
  TrackerPage,
} from "@/lib/tracker";
import { BillPanel, External } from "./BillPanel";
import { ordinal } from "./finder";

const STEPS = [1, 2, 3, 4, 5];

// Panel data is fetched on first open (or hover/focus) and kept for the page's
// life, so reopening, paging back or re-filtering never refetches (T9). A
// failed request is forgotten, so the next open retries.
const requests = new Map<string, Promise<TrackerBillDetail>>();
const loaded = new Map<string, TrackerBillDetail>();
function loadDetail(id: string) {
  let request = requests.get(id);
  if (!request) {
    request = fetch(`/data/tracker/bills/${id}.json`).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<TrackerBillDetail>;
    });
    request.then(
      (detail) => loaded.set(id, detail),
      () => requests.delete(id),
    );
    requests.set(id, request);
  }
  return request;
}
const prefetch = (id: string) => loadDetail(id).catch(() => {});

const PATHS = {
  HR: "house-bill",
  S: "senate-bill",
  HJRES: "house-joint-resolution",
  SJRES: "senate-joint-resolution",
};
/** The fallback link when the detail can't load (its file has the real one). */
const congressGovUrl = ({ id, type, number }: TrackerIndexBill) =>
  `https://www.congress.gov/bill/${ordinal(Number(id.split("-")[1]))}-congress/${PATHS[type]}/${number}`;

type BillRowProps = {
  bill: TrackerIndexBill;
  copy: TrackerPage["row"];
  panelCopy: TrackerPage["panel"];
};

/** The panel repeats the title only when the row clamps it (spec §4.5), so
    measure before the row opens: the clamp is visual and the width varies. */
export function markClamped(details: HTMLDetailsElement) {
  const title = details.querySelector(".bill-title")!;
  details.toggleAttribute(
    "data-clamped",
    title.scrollHeight > title.clientHeight,
  );
}

// One bill. The <summary> is the row, laid out by .bill-row (globals.css);
// it holds phrasing content only, and the sr-only prefixes make its name read
// as a sentence. The panel follows it inside the <details>.
export function BillRow({ bill, copy, panelCopy }: BillRowProps) {
  const { sponsor, cosponsors, latestAction } = bill;
  const [detail, setDetail] = useState(() => loaded.get(bill.id));
  const [failed, setFailed] = useState(false);

  // Also fires when a hash link opens the row (BillFinder sets `open`).
  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    if (!event.currentTarget.open || detail) return;
    setFailed(false);
    loadDetail(bill.id).then(setDetail, () => setFailed(true));
  };

  let panel;
  if (detail) panel = <BillPanel bill={{ ...bill, ...detail }} copy={panelCopy} />;
  else if (failed)
    panel = (
      <div className="bill-panel type-text-regular">
        <p>{panelCopy.failed}</p>
        <p className="type-heading-h5">
          <External href={congressGovUrl(bill)}>{panelCopy.congressGov}</External>
        </p>
      </div>
    );
  else
    panel = (
      <>
        <div
          aria-busy="true"
          className="bill-panel bill-panel-loading type-text-regular text-tile-muted"
        >
          <p>{panelCopy.loading}</p>
        </div>
        {/* Without JS the detail can't load; the page explains why. */}
        <noscript>
          <div className="bill-panel type-text-regular">
            <p className="type-heading-h5">
              <External href={congressGovUrl(bill)}>
                {panelCopy.congressGov}
              </External>
            </p>
          </div>
        </noscript>
      </>
    );

  return (
    <li id={bill.id} className="border-b border-tile-line">
      <details onToggle={onToggle}>
        <summary
          className="bill-row"
          onClick={(event) =>
            markClamped(event.currentTarget.parentElement as HTMLDetailsElement)
          }
          onPointerEnter={() => prefetch(bill.id)}
          onFocus={() => prefetch(bill.id)}
        >
          <span className="bill-cell-bill">
            <span className="type-heading-h5">{bill.label}</span>
            <span className="type-text-regular text-tile-muted">
              <span className="sr-only">, </span>
              <span className="bill-sep" aria-hidden>
                {" · "}
              </span>
              {bill.originChamber}
            </span>
          </span>
          <span className="bill-cell-title">
            <span className="bill-title type-heading-h5">{bill.title}</span>
            <span className="bill-sponsor mt-4 type-text-regular text-tile-muted">
              {sponsor.name} ({sponsor.party}-{sponsor.state})
            </span>
          </span>
          <span className="bill-cell-status">
            <span className="block whitespace-nowrap type-heading-h5">
              <span className="sr-only">{copy.statusPrefix} </span>
              {bill.stageLabel}
            </span>
            <span
              className="bill-bar mt-4 flex gap-(--progress-gap)"
              aria-hidden
            >
              {STEPS.map((step) => (
                <span
                  key={step}
                  className={`flex-1 ${step <= bill.stage ? "bg-signal" : "bg-stone"}`}
                />
              ))}
            </span>
            <span className="mt-4 block whitespace-nowrap type-text-regular text-tile-muted">
              {copy.step.replace("{stage}", String(bill.stage))}
            </span>
          </span>
          <span className="bill-cell-action type-text-regular">
            <span className="bill-action">
              <span className="sr-only">{copy.latestActionPrefix} </span>
              <span className="bill-latest" aria-hidden>
                {copy.latestShort}{" "}
              </span>
              {latestAction.text}
            </span>
            <time
              dateTime={latestAction.date}
              className="mt-4 block whitespace-nowrap text-tile-muted"
            >
              {formatDate(latestAction.date)}
            </time>
          </span>
          <span className="bill-cell-cos type-heading-h5 tabular-nums">
            {cosponsors.count}
            <span className="bill-cos-word">
              {" "}
              {cosponsors.count === 1 ? copy.cosponsor : copy.cosponsors}
            </span>
          </span>
          <span className="bill-cell-chev type-heading-h5" aria-hidden>
            <ChevronDown size={32} className="bill-chevron size-icon-inline" />
          </span>
        </summary>
        {panel}
      </details>
    </li>
  );
}
