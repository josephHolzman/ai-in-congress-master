import { ChevronLeft, ChevronRight } from "@carbon/icons-react";
import type { TrackerPage } from "@/lib/tracker";
import { fill, PER_PAGE, type FinderState } from "./finder";
import { Select } from "./Select";

type PaginationProps = {
  copy: TrackerPage["pagination"];
  total: number;
  page: number;
  pages: number;
  start: number;
  end: number;
  per: FinderState["per"];
  setPer: (per: FinderState["per"]) => void;
  goTo: (page: number) => void;
};

const arrow =
  "grid size-40 place-items-center rounded-full border border-tile-fg type-heading-h5 enabled:hover:bg-stone disabled:border-tile-line disabled:text-tile-muted";

// Per page and the range on the left, the pager on the right (spec §4.4b).
// .bill-pager puts the range on its own line when the nav is narrow.
export function Pagination({
  copy,
  total,
  page,
  pages,
  start,
  end,
  per,
  setPer,
  goTo,
}: PaginationProps) {
  return (
    <nav aria-label={copy.label} className="bill-pager mt-stack">
      <div className="flex flex-wrap items-center gap-x-stack gap-y-16 type-text-regular">
        {/* htmlFor, not a wrapping label: wrapped, the select's value
            joins its name ("Page 2"). */}
        <span className="flex items-center gap-8">
          <label htmlFor="pager-per">{copy.perPage}</label>
          <Select
            id="pager-per"
            value={per}
            onChange={(event) =>
              setPer(Number(event.target.value) as FinderState["per"])
            }
          >
            {PER_PAGE.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </Select>
        </span>
        <p className="bill-pager-range text-tile-muted">
          {total === 1
            ? copy.rangeOne
            : fill(copy.range, { start, end, total })}
        </p>
        {pages > 1 && (
          <div className="ms-auto flex items-center gap-stack">
            <span className="flex items-center gap-8">
              <label htmlFor="pager-page">{copy.page}</label>
              <Select
                id="pager-page"
                value={page}
                onChange={(event) => goTo(Number(event.target.value))}
              >
                {Array.from({ length: pages }, (_, i) => (
                  <option key={i}>{i + 1}</option>
                ))}
              </Select>
              {fill(copy.pageOf, { pages })}
            </span>
            <span className="flex gap-stack-sm">
              <button
                type="button"
                aria-label={copy.previous}
                disabled={page === 1}
                onClick={() => goTo(page - 1)}
                className={arrow}
              >
                <ChevronLeft
                  size={32}
                  aria-hidden
                  className="size-icon-inline"
                />
              </button>
              <button
                type="button"
                aria-label={copy.next}
                disabled={page === pages}
                onClick={() => goTo(page + 1)}
                className={arrow}
              >
                <ChevronRight
                  size={32}
                  aria-hidden
                  className="size-icon-inline"
                />
              </button>
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
