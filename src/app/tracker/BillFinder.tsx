"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type {
  TrackerIndexBill,
  TrackerPage,
  TrackerTopic,
} from "@/lib/tracker";
// Imported here, not passed as props: the bundler gives the rows their own
// hashed, immutably cached chunk (T9). src/lib/tracker.ts validates the file.
import index from "../../../content/tracker/index.json";
import { markClamped } from "./BillRow";
import { BillTable } from "./BillTable";
import { FinderControls } from "./FinderControls";
import {
  type FinderState,
  fill,
  filterBills,
  paginate,
  parseState,
  revealBill,
  sortBills,
  toSearch,
  topicCounts,
} from "./finder";
import { Pagination } from "./Pagination";

// The query string is the finder's state (spec §4.3), so a view can be shared.
// replaceState doesn't fire an event, so writes notify subscribers directly.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}
/** `hash` only for a reveal: after any other change the old hash would
    re-reveal its bill on reload, undoing the change (T11). */
function setSearch(search: string, hash = "") {
  window.history.replaceState(null, "", window.location.pathname + search + hash);
  listeners.forEach((listener) => listener());
}

const instant = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// A hash set while the page loads can be gone by the time we read it (T11):
// Next's router replaces the URL as it hydrates, and on the popstate that
// precedes hashchange, dropping the hash. These listeners register before
// Next's, so they see it first.
let earlyHash = "";
if (typeof window !== "undefined") {
  const remember = () => {
    if (window.location.hash) earlyHash = window.location.hash;
  };
  remember();
  window.addEventListener("popstate", remember);
  window.addEventListener("hashchange", remember);
}

// The bill a hash link asked for (§4.5). It's opened once its row renders:
// right away, or after the state change that brings it onto the page.
let target: string | null = null;
function openTarget() {
  const details = target && document.getElementById(target)?.firstElementChild;
  if (!(details instanceof HTMLDetailsElement)) return;
  target = null;
  markClamped(details);
  details.open = true;
  details.scrollIntoView({ behavior: instant() ? "instant" : "smooth" });
}

const bills = index as TrackerIndexBill[];

type BillFinderProps = {
  copy: TrackerPage;
  topics: TrackerTopic[];
};

// The server render (and no-JS) is the default view: page 1 of the default
// sort. null is the server snapshot, so the first client render matches it
// and the URL's state applies right after hydration (spec §4.1).
export function BillFinder({ copy, topics }: BillFinderProps) {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => null,
  );
  const mounted = search !== null;
  const topicIds = useMemo(() => topics.map((topic) => topic.id), [topics]);
  const state = useMemo(
    () => parseState(search ?? "", topicIds),
    [search, topicIds],
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);

  const matching = useMemo(
    () => sortBills(filterBills(bills, state), state.sort),
    [state],
  );
  const counts = useMemo(
    () => topicCounts(bills, state, topicIds),
    [state, topicIds],
  );
  const total = matching.length;
  const { page, pages, start, end } = paginate(total, state.page, state.per);
  const shown = matching.slice(start - 1, end);

  /** Any change but the page goes back to page 1. */
  const update = (patch: Partial<FinderState>) =>
    setSearch(toSearch({ ...state, page: 1, ...patch }));

  // Start keyboard and screen-reader users at the top of the results: after
  // a page change, and after the phone Filters menu's "Show n bills".
  const goTo = (next: number) => {
    update({ page: next });
    focusCount();
  };
  const focusCount = () => {
    const count = countRef.current!;
    count.focus({ preventScroll: true });
    count.scrollIntoView({
      block: "start",
      behavior: instant() ? "instant" : "smooth",
    });
  };

  // Hash links (/tracker#s146-119, companion links): show the bill, then
  // open it. Waits for the URL's state to apply after hydration.
  useEffect(() => {
    if (!mounted) return;
    const reveal = () => {
      const hash = window.location.hash || earlyHash;
      earlyHash = "";
      const id = decodeURIComponent(hash.slice(1));
      const next = revealBill(
        bills,
        parseState(window.location.search, topicIds),
        id,
      );
      if (!next) return;
      target = id;
      setSearch(toSearch(next), `#${id}`);
      openTarget();
    };
    // A task later: child effects run before Next's App Router mount effect,
    // which replaces the URL with its own and would undo this one (T11).
    const first = setTimeout(reveal);
    window.addEventListener("hashchange", reveal);
    return () => {
      clearTimeout(first);
      window.removeEventListener("hashchange", reveal);
    };
  }, [mounted, topicIds]);
  useEffect(openTarget);

  const clear = () => {
    setSearch("");
    searchRef.current!.focus();
  };

  const { pagination, empty } = copy;
  const query = state.q.trim();
  return (
    <>
      <FinderControls
        copy={copy.finder}
        topics={topics}
        state={state}
        counts={counts}
        total={total}
        update={update}
        showResults={focusCount}
        searchRef={searchRef}
      />
      <p
        ref={countRef}
        role="status"
        tabIndex={-1}
        className="mt-32 mb-16 scroll-mt-16 type-text-small text-tile-muted"
      >
        {total === 0
          ? pagination.statusEmpty
          : total === 1
            ? pagination.statusOne
            : fill(pagination.status, { start, end, total })}
      </p>
      <BillTable bills={shown} copy={copy}>
        <div className="pt-tile">
          <h3 className="type-display-h3">
            {query ? fill(empty.headingQuery, { q: query }) : empty.heading}
          </h3>
          <p className="mt-stack max-w-measure type-text-article">
            {copy.emptyBody}
          </p>
          <button
            type="button"
            data-tile="ink"
            data-interactive
            onClick={clear}
            className="mt-tile rounded-full px-24 py-16 type-heading-h5"
          >
            {empty.clear}
          </button>
        </div>
      </BillTable>
      {mounted && total > 0 && (
        <Pagination
          copy={pagination}
          total={total}
          page={page}
          pages={pages}
          start={start}
          end={end}
          per={state.per}
          setPer={(per) => update({ per })}
          goTo={goTo}
        />
      )}
    </>
  );
}
