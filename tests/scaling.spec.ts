import { expect, test } from "@playwright/test";

// Widest first: every value must hold or shrink as the window narrows.
const widths = [
  3440, 2560, 2048, 1920, 1862, 1600, 1440, 1366, 1281, 1280, 1024, 992, 991,
  768, 767, 390,
];
const types = [
  "type-display-h1",
  "type-display-h2",
  "type-display-h3",
  "type-heading-h4",
  "type-heading-h4-24",
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
// Component sizes, resolved as a width (--mark-footer is a % below 768).
const sizes = [
  "logo-topbar",
  "mark-footer",
  "measure",
  "disclaimer",
  "topbar-row",
];

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
    expect(row["heading-h4-24"]).toBeGreaterThanOrEqual(24);
  }
});

// E6.7: back to Figma's display sizes (E6.4's smaller ones reverted). 1220
// is a laptop window (root 14).
// E6.10: 16.5 at 1920, 22 from 2560.
const display = {
  2560: [123.75, 90.75, 52.25],
  1920: [92.81, 68.06, 39.19],
  1440: [90, 66, 38],
  1220: [78.75, 57.75, 33.25],
};

test("display headings follow the root: 90/66/38 at 1440, 78.75/57.75/33.25 at 1220", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  await page.goto("/styleguide");
  for (const [width, expected] of Object.entries(display)) {
    await page.setViewportSize({ width: Number(width), height: 900 });
    const sizes = await page.evaluate(() =>
      ["h1", "h2", "h3"].map((h) =>
        parseFloat(
          getComputedStyle(document.getElementById(`type-display-${h}`)!)
            .fontSize,
        ),
      ),
    );
    expect(
      sizes.map((s) => Math.round(s * 100) / 100),
      `display h1/h2/h3 at ${width}`,
    ).toEqual(expected);
  }
});

// E6.10: above 1440 the root is max(1rem, 0.859375vw), capped at 22 from 2560.
const roots = {
  3440: 22,
  2560: 22,
  2048: 17.6,
  1920: 16.5,
  1862: 16,
  1600: 16,
  1440: 16,
};

test("the root is 16 to 1862, 16.5 at 1920, 17.6 at 2048 and 22 from 2560", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  await page.goto("/styleguide");
  for (const [width, expected] of Object.entries(roots)) {
    await page.setViewportSize({ width: Number(width), height: 900 });
    const root = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(Math.round(root * 100) / 100, `root at ${width}`).toBe(expected);
  }
});

// WCAG 1.4.4: browser zoom z renders a width/z layout at z device px per CSS
// px, so text reaches 200% once the zoomed root × z doubles the 100% root.
test("zoom up to 500% doubles the text at 1920 and 2560", async ({
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  for (const width of [1920, 2560]) {
    const at = async (z: number) => {
      const context = await browser.newContext({
        viewport: { width: Math.round(width / z), height: 900 },
        deviceScaleFactor: z,
      });
      const page = await context.newPage();
      await page.goto(`${testInfo.project.use.baseURL}/styleguide`);
      const root = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).fontSize),
      );
      await context.close();
      return root * z;
    };
    const base = await at(1);
    const zoomed = [];
    for (const z of [2, 3, 4, 5]) zoomed.push(await at(z));
    expect(
      Math.max(...zoomed),
      `device px at ${width}: 100% ${base}, 200–500% ${zoomed.join(" / ")}`,
    ).toBeGreaterThanOrEqual(2 * base);
  }
});

test("the shell and Home's buttons never grow as the window narrows", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  await page.goto("/");
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
          "footer mark": px(box("footer svg").width),
          "bill tracker button height": px(
            box("main section [data-tile=signal]").height,
          ),
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

// E6.6: heading-h5 (nav links, pills, dates) 18 at 1440; root 14 at 1220.
const h5 = { 1440: 18, 1220: 15.75, 991: 15 };

test("heading-h5 computes to 18 at 1440, 15.75 at 1220 and 15 at 991", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  await page.goto("/styleguide");
  for (const [width, expected] of Object.entries(h5)) {
    await page.setViewportSize({ width: Number(width), height: 900 });
    const size = await page.evaluate(() =>
      parseFloat(
        getComputedStyle(document.getElementById("type-heading-h5")!).fontSize,
      ),
    );
    expect(size, `heading-h5 at ${width}`).toBe(expected);
  }
});

// E6.11: inline icons are 1.25em of their label; tile arrows are --icon-tile.
// [icon, label]; a null label marks a standalone tile arrow.
const icons: Record<string, Record<string, [string, string | null]>> = {
  "/": {
    "topbar ↗": ["header nav a svg", "header nav a:has(svg)"],
    "footer ↗": ["footer nav a svg", "footer nav a:has(svg)"],
    "tracker →": [
      "main section [data-tile=signal] svg",
      "main section [data-tile=signal] a",
    ],
    "featured arrow": ["main [data-tile=navy] svg", null],
    "grid arrow": ["main article[data-tile=ink] svg", null],
  },
  // Bilirakis: it has sources and a rail.
  "/posts/rep-bilirakis-introduces-bill-to-prohibit-ai-generated-child-pornography":
    {
      "back ←": ['main a[href="/"] svg', 'main a[href="/"]'],
      "source ↗": ["main ol a[rel=noopener] svg", "main ol a[rel=noopener]"],
      "rail ↗": ["aside a svg", "aside a"],
    },
};
const tileArrow: Record<number, number> = {
  1440: 48,
  1280: 42,
  991: 40,
  390: 32,
};
const ratioWidths = [1440, 991, 390];

test("icons never grow as the window narrows; inline = 1.25 × label, tile arrows 48/42/40/32", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "1440x900");

  for (const [path, probes] of Object.entries(icons)) {
    await page.goto(path);
    const rows: Record<string, number>[] = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const row = await page.evaluate((probes) => {
        const px = (v: number) => Math.round(v * 100) / 100;
        const out: Record<string, number> = {};
        for (const [name, [icon, label]] of Object.entries(probes)) {
          const box = document.querySelector(icon)!.getBoundingClientRect();
          out[name] = px(box.width);
          out[`${name} h`] = px(box.height);
          if (label)
            out[`${name} label`] = px(
              parseFloat(
                getComputedStyle(document.querySelector(label)!).fontSize,
              ),
            );
        }
        return out;
      }, probes);
      rows.push(row);

      for (const [name, [, label]] of Object.entries(probes)) {
        if (label && ratioWidths.includes(width))
          expect(
            Math.abs(row[name] - 1.25 * row[`${name} label`]),
            `${name} at ${width}: ${row[name]} vs label ${row[`${name} label`]}`,
          ).toBeLessThanOrEqual(0.5);
        if (!label && width in tileArrow)
          expect(row[name], `${name} at ${width}`).toBe(tileArrow[width]);
      }
    }
    console.table(
      Object.fromEntries(
        Object.keys(rows[0]).map((key) => [
          key,
          Object.fromEntries(widths.map((w, i) => [`${w}px`, rows[i][key]])),
        ]),
      ),
    );
    expect(grown(rows), path).toEqual([]);
  }
});
