import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const navOrder = [
  "Articles",
  "Privacy Policy",
  "Joey Holzman (external site)",
  "Bill Tracker",
  "Accessibility",
];
const MINT = "rgb(194, 252, 211)";
const INK = "rgb(8, 8, 12)";

const onlyAt1440 = (name: string) =>
  test.skip(name !== "1440x900", "the cascade checks run at 1440×900");

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

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
});

test("axe reports no violations on /", async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("keyboard order, every stop visible and outlined", async ({ page }) => {
  const titles = await page
    .locator("main [data-interactive] a")
    .allTextContents();
  const expected = [
    "Skip to content",
    "AI in Congress",
    ...navOrder,
    "Open the bill tracker",
    ...titles,
    "Email address",
    "Submit",
    ...navOrder,
  ];
  const stops: string[] = [];
  for (let i = 0; i < expected.length; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      // Stretched links draw their ring on ::after (link-stretched).
      const ring = [getComputedStyle(el), getComputedStyle(el, "::after")].find(
        (style) => style.outlineStyle !== "none",
      );
      return {
        name:
          el.getAttribute("aria-label") ??
          el.querySelector("[aria-label]")?.getAttribute("aria-label") ??
          (el instanceof HTMLInputElement
            ? el.labels?.[0]?.textContent
            : null) ??
          el.textContent?.trim(),
        outline: ring ? `${ring.outlineStyle} ${ring.outlineWidth}` : "none",
      };
    });
    expect(stop.outline, `outline on ${stop.name}`).toBe("solid 2px");
    expect(await focusIsVisible(page), `${stop.name} is covered`).toBe(true);
    stops.push(stop.name ?? "");
  }
  expect(stops).toEqual(expected);
});

test("each tile has exactly one link", async ({ page }) => {
  const tiles = page.locator("main [data-interactive]");
  expect(await tiles.count()).toBeGreaterThan(1);
  for (const tile of await tiles.all()) {
    await expect(tile.locator("a")).toHaveCount(1);
  }
});

test("hover and focus flip a tile to mint, text ink", async ({ page }) => {
  const colors = (selector: string) =>
    page.locator(selector).evaluate((tile) => ({
      bg: getComputedStyle(tile).backgroundColor,
      fg: getComputedStyle(tile.querySelector("h2, h3")!).color,
    }));
  const featured = "main [data-tile=ink]";
  const gridTile = "main article >> nth=0";

  await page.locator(gridTile).hover();
  await page.waitForTimeout(400);
  expect(await colors(gridTile)).toEqual({ bg: MINT, fg: INK });

  await page.mouse.move(0, 0);
  await page.locator(`${featured} a`).focus();
  await page.waitForTimeout(400);
  expect(await colors(featured)).toEqual({ bg: MINT, fg: INK });
});

test("no horizontal scroll, down to 320", async ({ page }) => {
  const fits = () =>
    page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    );
  expect(await fits()).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await fits()).toBe(true);
});

test.describe("sticky cascade", () => {
  const topmostAt = (page: Page, y: number) =>
    page.evaluate((y) => {
      const hit = document.elementFromPoint(700, y);
      return hit?.closest("[data-tile]")?.getAttribute("data-tile");
    }, y);

  test("amber covers the topbar, then ink covers amber", async ({ page }, {
    project,
  }) => {
    onlyAt1440(project.name);
    await page.mouse.move(0, 0);
    // The covered layer must still be pinned at the top (sticky), not just
    // scrolled away, for the slide-over to count.
    const topOf = (selector: string) =>
      page.locator(selector).evaluate((el) => el.getBoundingClientRect().top);
    expect(await topmostAt(page, 100)).toBe("mint");
    await page.evaluate(() => window.scrollTo(0, 300));
    expect(await topOf("header")).toBe(0);
    expect(await topmostAt(page, 100)).toBe("amber");
    await page.evaluate(() => window.scrollTo(0, 1000));
    expect(await topOf("main > [data-sticky]")).toBe(0);
    expect(await topmostAt(page, 100)).toBe("ink");
  });

  test("ink covers the source and stats first, the tracker row last", async ({
    page,
  }, { project }) => {
    onlyAt1440(project.name);
    await page.mouse.move(0, 0);
    // Scroll until the featured band's top sits just below the action row of
    // the (stuck) bill band.
    const y = await page.evaluate(() => {
      const band = document.querySelector("main > [data-sticky]")!;
      const row = band.querySelector('a[href="/tracker"]')!;
      const rowBottom =
        row.getBoundingClientRect().bottom - band.getBoundingClientRect().top;
      return (
        band.nextElementSibling!.getBoundingClientRect().top - rowBottom - 1
      );
    });
    await page.evaluate((y) => window.scrollTo(0, y), y);
    const band = page.locator("main > [data-sticky]");
    expect(await band.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
    /** The topmost element at the center of `selector` is in the bill band. */
    const showing = (selector: string) =>
      band.locator(selector).evaluate((el) => {
        const box = el.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return !!hit && el.closest("[data-sticky]")!.contains(hit);
      });
    expect(await showing('a[href="/tracker"]')).toBe(true);
    expect(await showing("dl")).toBe(false);
    expect(await showing(":scope > p")).toBe(false);
  });

  test("a focused nav link comes to the front", async ({ page }, {
    project,
  }) => {
    onlyAt1440(project.name);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // logo
    await page.keyboard.press("Tab"); // Articles, under the bill band
    expect(await focusIsVisible(page)).toBe(true);
    const z = await page
      .locator("header")
      .evaluate((el) => getComputedStyle(el).zIndex);
    expect(z).toBe("3");
  });

  const positions = (page: Page) =>
    page
      .locator("[data-sticky]")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));

  test("sticky only where each layer fits", async ({ page }, { project }) => {
    onlyAt1440(project.name);
    expect(await positions(page)).toEqual(["sticky", "sticky"]);
    // A larger root makes the bill band taller than the viewport.
    await page.addStyleTag({ content: "html { font-size: 2rem !important }" });
    await expect.poll(() => positions(page)).toEqual(["sticky", "relative"]);
  });
});

test("not sticky under reduced motion", async ({ browser }) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto("/", { waitUntil: "networkidle" });
  const positions = await page
    .locator("[data-sticky]")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
  expect(positions).toEqual(["relative", "relative"]);
  await page.close();
});

test("without JS: content renders, nothing sticks", async ({ browser }) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("main article").first()).toBeVisible();
  const positions = await page
    .locator("[data-sticky]")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
  expect(positions).toEqual(["relative", "relative"]);
  await page.close();
});
