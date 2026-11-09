import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const navOrder = [
  "Articles",
  "Privacy Policy",
  "Bill Tracker",
  "Accessibility",
  "Joey Holzman (external site)",
];
const MINT = "rgb(194, 252, 211)";
const INK = "rgb(8, 8, 12)";
const SIGNAL = "rgb(255, 67, 1)";
const PAPER = "rgb(255, 255, 255)";
const AMBER = "rgb(255, 174, 61)";

const onlyAt1440 = (name: string) =>
  test.skip(name !== "1440x900", "the scroll checks run at 1440×900");

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

test("one h1, visually hidden, naming the site", async ({ page }) => {
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText("AI in Congress");
  const box = (await h1.boundingBox())!;
  expect(box.width * box.height).toBeLessThanOrEqual(1);
  expect(await h1.evaluate((el) => getComputedStyle(el).clipPath)).toBe(
    "inset(50%)",
  );
});

test("the topbar is as tall on / as on an article", async ({ page }, {
  project,
}) => {
  test.skip(
    !["1440x900", "390x844"].includes(project.name),
    "checked at 1440 and 390",
  );
  const height = () =>
    page.locator("header").evaluate((el) => el.getBoundingClientRect().height);
  const home = await height();
  await page.goto(
    "/posts/rep-bilirakis-introduces-bill-to-prohibit-ai-generated-child-pornography",
  );
  expect(Math.abs((await height()) - home)).toBeLessThanOrEqual(1);
});

test("the topbar is mint, with no bottom line", async ({ page }) => {
  const topbar = await page.locator("header").evaluate((el) => ({
    mode: el.getAttribute("data-tile"),
    bg: getComputedStyle(el).backgroundColor,
    border: getComputedStyle(el).borderBottomWidth,
  }));
  expect(topbar).toEqual({ mode: "mint", bg: MINT, border: "0px" });
});

test("keyboard order, every stop visible and outlined", async ({ page }) => {
  const titles = await page
    .locator("main [data-interactive] :is(h2, h3) a")
    .allTextContents();
  const expected = [
    "Skip to content",
    "AI in Congress",
    ...navOrder,
    "Explore the bill tracker",
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

test("hover and focus flip a grid tile to paper and the featured tile to amber, text ink", async ({
  page,
}) => {
  const colors = (selector: string) =>
    page.locator(selector).evaluate((tile) => ({
      bg: getComputedStyle(tile).backgroundColor,
      fg: getComputedStyle(tile.querySelector("h2, h3")!).color,
    }));
  const featured = "main [data-tile=navy]:has(h2)";
  const gridTile = "main article >> nth=0";

  expect(await colors(gridTile)).toEqual({ bg: INK, fg: PAPER });
  await page.locator(gridTile).hover();
  await page.waitForTimeout(400);
  expect(await colors(gridTile)).toEqual({ bg: PAPER, fg: INK });

  await page.mouse.move(0, 0);
  await page.locator(`${featured} a`).focus();
  await page.waitForTimeout(400);
  expect(await colors(featured)).toEqual({ bg: AMBER, fg: INK });

  await page.locator(`${featured} a`).blur();
  await page.locator(featured).hover();
  await page.waitForTimeout(400);
  expect(await colors(featured)).toEqual({ bg: AMBER, fg: INK });
});

test("the bill tracker button: signal at rest, ink on hover and focus", async ({
  page,
}) => {
  const button = page.locator("main section [data-tile=signal]");
  const colors = () =>
    button.evaluate((tile) => ({
      bg: getComputedStyle(tile).backgroundColor,
      label: getComputedStyle(tile.querySelector("a")!).color,
      arrow: getComputedStyle(tile.querySelector("svg")!).color,
    }));
  const rest = { bg: SIGNAL, label: PAPER, arrow: PAPER };
  const flipped = { bg: INK, label: PAPER, arrow: PAPER };

  expect(await colors()).toEqual(rest);
  await button.hover();
  await page.waitForTimeout(400);
  expect(await colors()).toEqual(flipped);

  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  expect(await colors()).toEqual(rest);
  await button.locator("a").focus();
  await page.waitForTimeout(400);
  expect(await colors()).toEqual(flipped);
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

// Signal is 3.47:1 on paper (and paper on signal), so text in signal or on
// a signal tile is large text only, at every width (E6.3, E6.8).
const ARTICLE =
  "/posts/rep-bilirakis-introduces-bill-to-prohibit-ai-generated-child-pornography";

test("signal text, and all text on signal, is never under 24px", async ({
  page,
}, { project }) => {
  test.skip(project.name !== "1440x900", "sets its own widths");
  for (const path of ["/", "/tracker", ARTICLE]) {
    await page.goto(path, { waitUntil: "networkidle" });
    for (const width of [1440, 1280, 991, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const { inSignal, onSignal } = await page.evaluate((signal) => {
        const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize);
        const inSignal = [...document.querySelectorAll("body *")]
          .filter((el) => getComputedStyle(el).color === signal)
          .map((el) => ({ text: el.textContent!.trim(), size: size(el) }));
        const onSignal = [...document.querySelectorAll("[data-tile=signal]")]
          .flatMap((tile) => {
            const walker = document.createTreeWalker(
              tile,
              NodeFilter.SHOW_TEXT,
            );
            const nodes: Text[] = [];
            while (walker.nextNode()) nodes.push(walker.currentNode as Text);
            return nodes;
          })
          .filter((node) => node.data.trim())
          .map((node) => ({
            text: node.data.trim(),
            size: size(node.parentElement!),
          }));
        return { inSignal, onSignal };
      }, SIGNAL);
      const where = `${path} at ${width}`;
      // Home: the heading's span and the "Became law" number, at least.
      if (path === "/")
        expect(inSignal.length, where).toBeGreaterThanOrEqual(2);
      // A signal tile on Home (the button) and articles (the rail cap);
      // /tracker's header is paper with "119th Congress" in signal (T3).
      if (path === "/tracker")
        expect(inSignal.length, where).toBeGreaterThanOrEqual(1);
      else expect(onSignal.length, where).toBeGreaterThanOrEqual(1);
      for (const { text, size } of [...inSignal, ...onSignal])
        expect(size, `${where}: "${text}"`).toBeGreaterThanOrEqual(24);
    }
  }
});

test("a paper strip under the tracker button, below md only", async ({ page }, {
  project,
}) => {
  const { gap, hit } = await page.evaluate(() => {
    const band = document.querySelector("main > section")!;
    const button = band.querySelector("[data-tile=signal]")!;
    const featured = band.nextElementSibling!;
    // Bring the seam on screen so elementFromPoint can reach it.
    window.scrollBy(0, button.getBoundingClientRect().bottom - innerHeight / 2);
    const bottom = button.getBoundingClientRect().bottom;
    const top = featured.getBoundingClientRect().top;
    const hit = document
      .elementFromPoint(innerWidth / 2, (bottom + top) / 2)
      ?.closest("[data-tile]")
      ?.getAttribute("data-tile");
    return { gap: top - bottom, hit };
  });
  if (project.use.viewport!.width < 768) {
    expect(Math.abs(gap - 8)).toBeLessThanOrEqual(1);
    expect(hit).toBe("paper");
  } else {
    expect(Math.abs(gap)).toBeLessThanOrEqual(1);
  }
});

test("the featured band is at most one screen tall", async ({ page }, {
  project,
}) => {
  test.skip(project.name !== "1440x900", "sets its own sizes");
  for (const [width, height] of [
    [1440, 790],
    [1536, 730],
    [1920, 950],
    [2560, 1305],
  ]) {
    await page.setViewportSize({ width, height });
    const { band, parts } = await page.evaluate(() => {
      const tile = document.querySelector("main [data-tile=navy]:has(h2)")!;
      const grid = tile.parentElement!;
      window.scrollBy(0, grid.getBoundingClientRect().top);
      return {
        band: grid.getBoundingClientRect().height,
        parts: ["h2", "p", "svg"].map((sel) => {
          const box = tile.querySelector(sel)!.getBoundingClientRect();
          return { sel, top: box.top, bottom: box.bottom };
        }),
      };
    });
    const at = `${width}×${height}`;
    expect(band, `band at ${at}`).toBeLessThanOrEqual(height + 1);
    // 50.4375rem at the 22px root: unchanged where it already fits.
    if (width === 2560) expect(Math.abs(band - 1109.6)).toBeLessThan(1);
    for (const { sel, top, bottom } of parts) {
      expect(top, `${sel} top at ${at}`).toBeGreaterThanOrEqual(0);
      expect(bottom, `${sel} bottom at ${at}`).toBeLessThanOrEqual(height);
    }
  }
});

test.describe("single-stage scroll", () => {
  const topmostAt = (page: Page, y: number) =>
    page.evaluate((y) => {
      const hit = document.elementFromPoint(700, y);
      return hit?.closest("[data-tile]")?.getAttribute("data-tile");
    }, y);

  test("the paper band covers the topbar", async ({ page }, { project }) => {
    onlyAt1440(project.name);
    await page.mouse.move(0, 0);
    // The topbar must still be pinned at the top (sticky), not just scrolled
    // away, for the slide-over to count.
    expect(await topmostAt(page, 100)).toBe("mint");
    await page.evaluate(() => window.scrollTo(0, 300));
    expect(
      await page
        .locator("header")
        .evaluate((el) => el.getBoundingClientRect().top),
    ).toBe(0);
    expect(await topmostAt(page, 100)).toBe("paper");
  });

  test("the featured band never overlaps the bill band", async ({ page }, {
    project,
  }) => {
    onlyAt1440(project.name);
    await page.mouse.move(0, 0);
    for (const y of [0, 200, 400, 600, 900]) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      const { gap, hit } = await page.evaluate(() => {
        const band = document.querySelector("main > section")!;
        const bandBox = band.getBoundingClientRect();
        const next = band.nextElementSibling!.getBoundingClientRect();
        // Whatever of the band's paper half is still on screen shows paper.
        const y = Math.max(bandBox.top, 0) + 1;
        return {
          gap: next.top - bandBox.bottom,
          hit:
            bandBox.bottom > 1
              ? document
                  .elementFromPoint(20, y)
                  ?.closest("[data-tile]")
                  ?.getAttribute("data-tile")
              : "paper",
        };
      });
      expect(gap, `gap at scroll ${y}`).toBeGreaterThanOrEqual(0);
      expect(hit, `topmost at scroll ${y}`).toBe("paper");
    }
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

  test("only the topbar sticks, and only while it fits", async ({ page }, {
    project,
  }) => {
    onlyAt1440(project.name);
    expect(await positions(page)).toEqual(["sticky"]);
    expect(
      await page
        .locator("main > section")
        .evaluate((el) => getComputedStyle(el).position),
    ).toBe("relative");
    await page.addStyleTag({ content: "header { min-height: 120vh }" });
    await expect.poll(() => positions(page)).toEqual(["relative"]);
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
  expect(positions).toEqual(["relative"]);
  await page.close();
});

test("without JS: content renders, nothing sticks", async ({ browser }) => {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  await page.goto("/");
  await expect(page.locator("#bills-heading")).toBeVisible();
  await expect(page.locator("main article").first()).toBeVisible();
  const positions = await page
    .locator("[data-sticky]")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).position));
  expect(positions).toEqual(["relative"]);
  await page.close();
});
