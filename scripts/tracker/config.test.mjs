import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { matchesAny } from "./normalize.mjs";

const config = JSON.parse(readFileSync(new URL("../../content/tracker/config.json", import.meta.url), "utf8"));

// T8: five published bills matched "Regenerative" or "AI/AN" (American Indian/Alaska Native).
test.each([
  "Advanced Wound Care and Regenerative Medicine Access and Reform Act",
  "Battery and Regenerative Braking Act",
  "Local Food Recycling and Regenerative Opportunities Act",
  "AI/AN CAPTA",
])("title pattern refuses %s", (title) => {
  expect(matchesAny(config.titlePatterns, title)).toBe(false);
});

test.each(["AI Kill Switch Act", "Secure A.I. Development Act of 2026", "Generative AI Terrorism Risk Assessment Act", "AI-Ready Networks Act"])(
  "title pattern matches %s",
  (title) => {
    expect(matchesAny(config.titlePatterns, title)).toBe(true);
  },
);
