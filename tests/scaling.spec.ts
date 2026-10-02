import { expect, test } from "@playwright/test";

// Widest first: every value must hold or shrink as the window narrows.
const widths = [1920, 1440, 1366, 1281, 1280, 1024, 992, 991, 768, 767, 390];
const types = [
  "type-display-h1",
  "type-display-h2",
  "type-display-h3",
  "type-heading-h4",
  "type-heading-h5",
  "type-text-large",
  "type-text-medium",
  "type-text-article",
  "type-text-regular",
  "type-text-small",
  "type-ui-nav",
  "type-ui-label",
];

const layout = ["tile-pad", "tile-top-md", "tile-top-lg", "stack"];

test("type and layout tokens never grow as the window narrows", async ({
  page,
}, testInfo) => {
  // The test sets its own widths, so one project is enough.
  test.skip(testInfo.project.name !== "1440x900");

  await page.goto("/styleguide");
  const rows: Record<string, number>[] = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    rows.push(
      await page.evaluate(
        ({ types, layout }) => {
          const px = (v: string) => Math.round(parseFloat(v) * 100) / 100;
          const row: Record<string, number> = {
            root: px(getComputedStyle(document.documentElement).fontSize),
          };
          // A probe resolves each layout token to px; not every token is used on the page.
          const probe = document.body.appendChild(
            document.createElement("div"),
          );
          for (const l of layout) {
            probe.style.paddingTop = `var(--layout-${l})`;
            row[l] = px(getComputedStyle(probe).paddingTop);
          }
          probe.remove();
          for (const t of types) {
            const s = getComputedStyle(document.getElementById(t)!);
            row[t.replace("type-", "")] = px(s.fontSize);
            row[t.replace("type-", "") + " lh"] = px(s.lineHeight);
          }
          return row;
        },
        { types, layout },
      ),
    );
  }
  // px keys keep the columns in width order (integer keys would sort).
  console.table(
    Object.fromEntries(
      Object.keys(rows[0]).map((key) => [
        key,
        Object.fromEntries(widths.map((w, i) => [`${w}px`, rows[i][key]])),
      ]),
    ),
  );

  const grew: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    for (const [key, value] of Object.entries(rows[i])) {
      if (key === "root") continue; // The root jumps 14 → 16 at 991 by design (A6).
      const wider = rows[i - 1][key];
      if (value > wider)
        grew.push(
          `${key}: ${wider} at ${widths[i - 1]} → ${value} at ${widths[i]}`,
        );
    }
  }
  expect(grew).toEqual([]);

  for (const row of rows) {
    expect(row["text-article"]).toBeGreaterThanOrEqual(18);
    expect(row["text-small"]).toBeGreaterThanOrEqual(13);
    expect(row["ui-label"]).toBeGreaterThanOrEqual(13);
  }
});
