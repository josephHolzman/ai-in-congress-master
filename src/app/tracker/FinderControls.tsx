import {
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { flushSync } from "react-dom";
import { ChevronDown, Close } from "@carbon/icons-react";
import type { TrackerPage, TrackerTopic } from "@/lib/tracker";
import { DEFAULTS, fill, type FinderState } from "./finder";
import { Select } from "./Select";

type FinderControlsProps = {
  copy: TrackerPage["finder"];
  topics: TrackerTopic[];
  state: FinderState;
  counts: Record<string, number>;
  /** Bills matching now, for "Show {n} bills". */
  total: number;
  update: (patch: Partial<FinderState>) => void;
  /** Scrolls the result count into view and focuses it. */
  showResults: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
};

const FILTERS = ["chamber", "status", "topic", "sort"] as const;

// The search, the three selects and the topic pills (spec §4.3). Inert
// without JS; BillFinder owns the state. Below md the selects and pills fold
// into an inline Filters panel (T10); they render once, and CSS plus `open`
// decide the layout. At md and up the panel is display: contents, so its
// children lay out in the row exactly as before.
export function FinderControls({
  copy,
  topics,
  state,
  counts,
  total,
  update,
  showResults,
  searchRef,
}: FinderControlsProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const active = FILTERS.filter((key) => state[key] !== DEFAULTS[key]).length;
  // On the toggle as well as in the panel (T11: it missed the toggle).
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) return;
    setOpen(false);
    toggleRef.current!.focus();
  };
  const selects = [
    ["chamber", copy.chamber, copy.chamberOptions],
    ["status", copy.status, copy.statusOptions],
    ["sort", copy.sort, copy.sortOptions],
  ] as const;

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <div className="flex flex-wrap items-end justify-between gap-x-stack gap-y-16">
        <div className="flex w-full max-w-(--finder-search) flex-col gap-stack-sm">
          <label htmlFor="finder-q" className="type-text-small">
            {copy.search}
          </label>
          {/* Our own clear button: the native one is Chrome's blue (T11). */}
          <span className="relative flex type-text-regular">
            <input
              ref={searchRef}
              id="finder-q"
              type="search"
              autoComplete="off"
              placeholder={copy.searchPlaceholder}
              value={state.q}
              onChange={(event) => update({ q: event.target.value })}
              className="h-56 w-full border border-tile-fg bg-paper ps-16 pe-56 placeholder:text-tile-muted [&::-webkit-search-cancel-button]:appearance-none"
            />
            {state.q && (
              <button
                type="button"
                aria-label={copy.clearSearch}
                onClick={() => {
                  update({ q: "" });
                  searchRef.current!.focus();
                }}
                className="absolute end-8 top-1/2 grid size-40 -translate-y-1/2 place-items-center rounded-full text-ink hover:bg-stone"
              >
                <Close size={32} aria-hidden className="size-icon-inline" />
              </button>
            )}
          </span>
        </div>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls="finder-filters"
          onClick={() => setOpen(!open)}
          onKeyDown={closeOnEscape}
          className="flex h-56 w-full items-center justify-between border border-tile-fg bg-paper px-16 type-text-regular hover:bg-stone md:hidden"
        >
          {active ? fill(copy.filtersActive, { n: active }) : copy.filters}
          <ChevronDown
            size={32}
            aria-hidden
            className={`size-icon-inline motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out ${open ? "rotate-180" : ""}`}
          />
        </button>
        <div
          id="finder-filters"
          onKeyDown={closeOnEscape}
          className={`${open ? "flex" : "hidden"} w-full flex-col gap-32 md:contents`}
        >
          <div className="flex flex-wrap gap-stack-sm max-md:flex-col">
            {selects.map(([key, label, options]) => (
              <div key={key} className="flex grow flex-col gap-stack-sm">
                <label htmlFor={`finder-${key}`} className="type-text-small">
                  {label}
                </label>
                <Select
                  field
                  id={`finder-${key}`}
                  value={state[key]}
                  onChange={(event) =>
                    update({ [key]: event.target.value } as Partial<FinderState>)
                  }
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
          {/* md+: the row's 16 gap plus 16 keeps the 32 above Topics. */}
          <fieldset className="w-full md:mt-16">
            <legend className="type-text-small">{copy.topics}</legend>
            <div className="mt-stack-sm flex flex-wrap gap-stack-sm">
              {[{ id: "", label: copy.allTopics }, ...topics].map((topic) => (
                <label key={topic.id} className="finder-pill group">
                  <input
                    type="radio"
                    name="topic"
                    value={topic.id}
                    checked={state.topic === topic.id}
                    onChange={() => update({ topic: topic.id })}
                    className="sr-only"
                  />
                  {topic.label}
                  <span className="grid h-(--pill-count) min-w-(--pill-count) place-items-center rounded-full bg-stone px-4 type-text-small text-ink tabular-nums group-has-checked:bg-paper">
                    {counts[topic.id]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-stack md:hidden">
            <button
              type="button"
              data-tile="ink"
              data-interactive
              onClick={() => {
                // Close first, so the scroll lands where the count ends up.
                flushSync(() => setOpen(false));
                showResults();
              }}
              className="rounded-full px-24 py-16 type-heading-h5"
            >
              {total === 1
                ? copy.showResultsOne
                : fill(copy.showResults, { n: total })}
            </button>
            <button
              type="button"
              onClick={() =>
                update({ chamber: "", status: "", topic: "", sort: "latest" })
              }
              className="py-16 type-text-regular underline underline-offset-4"
            >
              {copy.clearFilters}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
