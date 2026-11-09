import { expect, test } from "vitest";
import { getBills, statusLine, type Bill } from "@/lib/bills";
import { formatDate } from "@/lib/dates";
import { getTrackerMeta } from "@/lib/tracker";

test("a bill in the tracker takes its stage and latest action, as of the fetch", () => {
  const [s146] = getBills(["s146-119"]);
  // The fetch date moves with every refresh; the rest is settled history.
  const fetched = formatDate(getTrackerMeta().fetchedAt.slice(0, 10));
  expect(statusLine(s146)).toBe(
    `Became law, latest action May 19, 2025, as of ${fetched}`,
  );
});

test("a bill not in the tracker falls back to the manual status", () => {
  const [s146] = getBills(["s146-119"]);
  const untracked: Bill = {
    ...s146,
    id: "hr99999-119",
    status: "Introduced, no committee action",
  };
  expect(statusLine(untracked)).toBe(
    "Introduced, no committee action as of Oct 1, 2026",
  );
});
