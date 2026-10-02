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

const layout = [
  "tile-pad",
  "tile-top-md",
  "tile-top-lg",
  "stack",
  "article-gap",
  "image-overlap",
];
// Component sizes, resolved as a width (--logo-footer is a % below 768).
const sizes = ["logo-topbar", "logo-footer", "measure"];

/** Every value that's larger than at the next wider width. */
const grown = (rows: Record<string, number>[]) => {
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
  return grew;
};

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
        ({ types, layout, sizes }) => {
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
          probe.style.paddingTop = "";
          for (const s of sizes) {
            probe.style.width = `var(--${s})`;
            row[s] = px(getComputedStyle(probe).width);
          }
          probe.style.width = "";
          // Prose rhythm is in em of text-article (globals.css, .prose-article).
          probe.className = "prose-article type-text-article";
          probe.innerHTML = "<p>a</p><p>b</p><h2>c</h2>";
          const [, p, h2] = probe.children;
          row["prose p gap"] = px(getComputedStyle(p).marginTop);
          row["prose h2 gap"] = px(getComputedStyle(h2).marginTop);
          probe.remove();
          for (const t of types) {
            const s = getComputedStyle(document.getElementById(t)!);
            row[t.replace("type-", "")] = px(s.fontSize);
            row[t.replace("type-", "") + " lh"] = px(s.lineHeight);
          }
          return row;
        },
        { types, layout, sizes },
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

  expect(grown(rows)).toEqual([]);

  for (const row of rows) {
    expect(row["text-article"]).toBeGreaterThanOrEqual(18);
    expect(row["text-small"]).toBeGreaterThanOrEqual(13);
    expect(row["ui-label"]).toBeGreaterThanOrEqual(13);
  }
});

test("the shell never grows as the window narrows", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  await page.goto("/tracker");
  const rows: Record<string, number>[] = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    rows.push(
      await page.evaluate((width) => {
        const px = (v: number) => Math.round(v * 100) / 100;
        const box = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect();
        const nav = box('nav[aria-label="Main"]');
        const link = document.querySelector('nav[aria-label="Main"] a')!;
        // The nav's columns, from the first one's left to the last one's right.
        const items = [
          ...document.querySelectorAll('nav[aria-label="Main"] li'),
        ].map((li) => li.getBoundingClientRect());
        return {
          "link font": px(parseFloat(getComputedStyle(link).fontSize)),
          "link height": px(link.getBoundingClientRect().height),
          "topbar logo": px(box("header svg").width),
          "footer logo": px(box("footer svg").width),
          "email input height": px(box("#newsletter-email").height),
          "submit height": px(box('button[type="submit"]').height),
          // Below md the nav drops under the logo and runs full width.
          ...(width >= 768 && {
            "nav columns": px(
              Math.max(...items.map((r) => r.right)) - items[0].left,
            ),
            "off the 50% line": px(Math.abs(nav.left - innerWidth / 2)),
          }),
        };
      }, width),
    );
  }
  console.table(
    Object.fromEntries(
      Object.keys(rows[0]).map((key) => [
        key,
        Object.fromEntries(widths.map((w, i) => [`${w}px`, rows[i][key]])),
      ]),
    ),
  );
  expect(grown(rows)).toEqual([]);
  for (const row of rows) expect(row["off the 50% line"] ?? 0).toBe(0);
});
