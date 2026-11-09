import { useEffect, useRef, type ReactNode } from "react";
import type { TrackerIndexBill, TrackerPage } from "@/lib/tracker";
import { BillRow } from "./BillRow";

type BillTableProps = {
  bills: TrackerIndexBill[];
  copy: TrackerPage;
  /** Shown under the column header in place of an empty list (§4.6). */
  children?: ReactNode;
};

// The column header and the list. .bill-table is the query container, so the
// layout follows the table's width, not the viewport's (spec §4.4).
export function BillTable({ bills, copy, children }: BillTableProps) {
  const { columns } = copy;
  const tableRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  // The header sticks (T10), so focused rows and links scroll clear of it:
  // globals.css gives them a scroll-margin of its measured height.
  useEffect(() => {
    const head = headRef.current!;
    const observer = new ResizeObserver(() =>
      tableRef.current!.style.setProperty(
        "--bill-head-h",
        `${head.offsetHeight}px`,
      ),
    );
    observer.observe(head);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={tableRef} className="bill-table">
      {/* Hidden from screen readers: each row's name carries its labels. */}
      <div
        ref={headRef}
        aria-hidden
        className="bill-head border-y-4 border-tile-fg py-16 type-text-regular"
      >
        <span className="bill-cell-bill">{columns.bill}</span>
        <span className="bill-cell-title">{columns.title}</span>
        <span className="bill-cell-status">{columns.status}</span>
        <span className="bill-cell-action">{columns.latestAction}</span>
        <span className="bill-cell-cos">{columns.cosponsors}</span>
      </div>
      {bills.length ? (
        <ol>
          {bills.map((bill) => (
            <BillRow
              key={bill.id}
              bill={bill}
              copy={copy.row}
              panelCopy={copy.panel}
            />
          ))}
        </ol>
      ) : (
        children
      )}
    </div>
  );
}
