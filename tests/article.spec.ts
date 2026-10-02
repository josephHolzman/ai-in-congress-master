import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Dev serves drafts too, so this is all 6 posts (one per header mode).
const slugs = fs
  .readdirSync("content/posts")
  .filter((name) => name.endsWith(".mdx"))
  .map((name) => name.replace(/\.mdx$/, ""));
const slug = (start: string) => slugs.find((s) => s.startsWith(start))!;
const DEEPFAKES = slug("what-the-take-it-down"); // navy, 2 bills
const CHILD_SAFETY = slug("rep-bilirakis"); // blush, 1 bill
const LAWMAKERS = slug("rep-french-hill"); // volt, no bills

const onlyAt1440 = (name: string) =>
  test.skip(name !== "1440x900", "layout checks run at 1440×900");

const open = (page: Page, s: string) =>
  page.goto(`/posts/${s}`, { waitUntil: "networkidle" });

/** The topmost element at the focused element's center is inside it. */
const focusIsVisible = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const box = el.getBoundingClientRect();
    const hit = document.elementFromPoint(
      box.left + Math.min(box.width / 2, 20),
      box.top + box.height / 2,
    );
    // Next's dev-tools badge (dev only) is fixed at the bottom left.
    if (hit?.tagName === "NEXTJS-PORTAL") return true;
    return !!hit && (el.contains(hit) || hit.contains(el));
  });

const railPosition = (page: Page) =>
  page.locator("aside").evaluate((el) => getComputedStyle(el).position);

for (const s of slugs) {
  test(`${s}: axe, no horizontal scroll`, async ({ page }) => {
    await open(page, s);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test(`${s}: header text is full-strength tile fg, back link ≥ 4.5:1`, async ({
    page,
  }, { project }) => {
    onlyAt1440(project.name);
    await open(page, s);
    const header = await page
      .locator("main > [data-tile]")
      .first()
      .evaluate((tile) => {
        const rgb = (c: string) => c.match(/[\d.]+/g)!.map(Number);
        const lum = (c: string) => {
          const [r, g, b] = rgb(c).map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const style = getComputedStyle(tile);
        const fg = style.getPropertyValue("--tile-fg").trim();
        const [hi, lo] = [lum(style.backgroundColor), lum(fg)].sort(
          (a, b) => b - a,
        );
        const texts = [...tile.querySelectorAll("a, span, h1, p, time")].map(
          (el) => getComputedStyle(el).color,
        );
        return {
          mode: tile.getAttribute("data-tile"),
          fg,
          colors: [...new Set(texts)],
          back: getComputedStyle(tile.querySelector("a")!).color,
          contrast: (hi + 0.05) / (lo + 0.05),
        };
      });
    // No muted (translucent) text in any header, so none on slate or sage.
    expect(header.colors, header.mode!).toEqual([header.fg]);
    expect(header.back).toBe(header.fg);
    expect(header.contrast, header.mode!).toBeGreaterThanOrEqual(4.5);
  });
}

test("heading outline", async ({ page }, { project }) => {
  onlyAt1440(project.name);
  await open(page, DEEPFAKES);
  const headings = await page
    .locator("main :is(h1, h2, h3)")
    .evaluateAll((els) =>
      els.map((el) => `${el.tagName} ${el.textContent!.trim()}`),
    );
  // The rail sits before the body in the DOM (one position for every width).
  expect(headings[0]).toMatch(/^H1 /);
  expect(headings[1]).toBe("H2 Bills in this article");
  expect(headings.at(-1)).toBe("H2 Sources");
  const levels = headings.map((h) => Number(h[1]));
  levels.forEach((level, i) => {
    if (i > 0) expect(level - levels[i - 1]).toBeLessThanOrEqual(1);
  });
});

test("rail: docked to the right edge, 80 from the text, top on the first paragraph", async ({
  page,
}, { project }) => {
  onlyAt1440(project.name);
  await open(page, CHILD_SAFETY);
  const m = await page.evaluate(() => {
    const box = (s: string) =>
      document.querySelector(s)!.getBoundingClientRect();
    return {
      aside: box("aside"),
      railText: box("aside h2"),
      body: box("article p"),
      width: document.documentElement.clientWidth,
    };
  });
  expect(m.aside.left).toBe(m.width * 0.75);
  expect(m.aside.right).toBe(m.width);
  expect(m.railText.left - m.body.right).toBe(80);
  expect(m.aside.top).toBe(m.body.top);
});

test("rail: sticky while it fits the viewport minus 80", async ({ page }, {
  project,
}) => {
  onlyAt1440(project.name);
  await open(page, DEEPFAKES);
  const height = await page
    .locator("aside")
    .evaluate((el) => (el as HTMLElement).offsetHeight);
  await page.setViewportSize({ width: 1440, height: height + 80 });
  await expect.poll(() => railPosition(page)).toBe("sticky");
  await page.evaluate(() => window.scrollBy(0, 2000));
  expect(
    await page
      .locator("aside")
      .evaluate((el) => el.getBoundingClientRect().top),
  ).toBe(0);

  await page.setViewportSize({ width: 1440, height: height + 79 });
  await expect.poll(() => railPosition(page)).toBe("relative");
});

test("rail: below 1280 it's a block before the body and never sticks", async ({
  page,
}, { project }) => {
  onlyAt1440(project.name);
  await page.setViewportSize({ width: 1024, height: 900 });
  await open(page, CHILD_SAFETY);
  const top = () =>
    page.locator("aside").evaluate((el) => el.getBoundingClientRect().top);
  const before = await top();
  await page.evaluate((y) => window.scrollBy(0, y + 200), before);
  expect(await top()).toBeCloseTo(-200, 0);
  const article = await page
    .locator("article")
    .evaluate((el) => el.getBoundingClientRect().top);
  expect(article).toBeGreaterThan(await top());
});

test("no aside without bills", async ({ page }) => {
  await open(page, LAWMAKERS);
  await expect(page.locator("aside")).toHaveCount(0);
});

test("keyboard: every stop outlined and uncovered", async ({ page }) => {
  await open(page, DEEPFAKES);
  const links = await page.locator("a, input, button").count();
  const stops: string[] = [];
  for (let i = 0; i < links; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        name:
          el.tagName === "NEXTJS-PORTAL"
            ? el.tagName
            : el.textContent?.trim() || el.getAttribute("name") || el.tagName,
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
      };
    });
    // Past the footer: the page body, or Next's dev-tools badge (dev only).
    if (stop.name === "BODY" || stop.name === "NEXTJS-PORTAL") break;
    expect(stop.outline, `outline on ${stop.name}`).toBe("solid 2px");
    expect(await focusIsVisible(page), `${stop.name} is covered`).toBe(true);
    stops.push(stop.name);
  }
  // Header back link, then the rail, then the body.
  const back = stops.indexOf("All articles");
  const rail = stops.indexOf("Track this bill (external site)");
  expect(back).toBeGreaterThan(0);
  expect(rail).toBeGreaterThan(back);
});

test("not sticky under reduced motion", async ({ browser }) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await open(page, CHILD_SAFETY);
  expect(await railPosition(page)).toBe("relative");
  await page.close();
});

test("without JS: everything renders, the rail doesn't stick", async ({
  browser,
}) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  await page.goto(`/posts/${DEEPFAKES}`);
  for (const selector of ["h1", "figure", "[role=note]", "aside", "article"]) {
    await expect(page.locator(selector).first()).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  expect(await railPosition(page)).toBe("relative");
  await page.close();
});
