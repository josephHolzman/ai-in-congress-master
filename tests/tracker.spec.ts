import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const bills: { id: string; topics: string[] }[] = JSON.parse(
  readFileSync("content/tracker/bills.json", "utf8"),
);

// The 1440 project also checks the widths no project covers.
const EXTRA_WIDTHS = [2560, 991, 320];

/** Grid tracks per layout (spec §4.4): wide 6, medium 4, stacked 2. */
const tracksAt = (width: number) => (width >= 1024 ? 6 : width >= 768 ? 4 : 2);

/** Every text-limit and spacing rule of spec §4.4, over every row. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const failures: string[] = [];
    const rows = [...document.querySelectorAll<HTMLElement>(".bill-row")];
    const tracks = getComputedStyle(rows[0])
      .gridTemplateColumns.split(" ")
      .filter(Boolean).length;
    const layout = tracks === 6 ? "wide" : tracks === 4 ? "medium" : "stacked";

    // ch is the width of "0" in the element's own font (CSS ch ignores
    // letter-spacing, so the probe does too).
    const chOf = (el: Element) => {
      const probe = document.createElement("span");
      probe.textContent = "0";
      probe.style.cssText =
        "position:absolute;visibility:hidden;white-space:nowrap;letter-spacing:0";
      el.append(probe);
      const width = probe.getBoundingClientRect().width;
      probe.remove();
      return width;
    };
    const titleCh = chOf(rows[0].querySelector(".bill-title")!);
    const actionCh = chOf(rows[0].querySelector(".bill-action")!);
    const lineHeight = (el: Element) =>
      parseFloat(getComputedStyle(el).lineHeight);
    // Height, not getClientRects(): an inline box holding an sr-only
    // (absolute) child reports two rects on one line.
    const oneLine = (el: Element) =>
      el.getBoundingClientRect().height < 1.5 * lineHeight(el);
    const box = (el: Element) => el.getBoundingClientRect();

    let titleChars = [Infinity, 0];
    let actionChars = [Infinity, 0];
    let oneLineTitles = 0;
    for (const row of rows) {
      const q = (s: string) => row.querySelector<HTMLElement>(s)!;
      const label = row.querySelector(".bill-cell-bill")!.textContent!;
      const fail = (rule: string) => failures.push(`${label}: ${rule}`);
      const status = q(".bill-cell-status");

      const single = {
        "bill label": q(".bill-cell-bill > :first-child"),
        chamber: q(".bill-cell-bill > :last-child"),
        "status label": status.children[0],
        step: status.children[2],
        date: q(".bill-cell-action time"),
        cosponsors: q(".bill-cell-cos"),
      };
      for (const [name, el] of Object.entries(single))
        if (!oneLine(el)) fail(`${name} wraps`);

      const title = q(".bill-title");
      const tw = box(title).width / titleCh;
      titleChars = [Math.min(titleChars[0], tw), Math.max(titleChars[1], tw)];
      if (tw < 23.5 || tw > 60.5) fail(`title is ${tw.toFixed(1)}ch wide`);
      const aw = box(q(".bill-action")).width / actionCh;
      actionChars = [
        Math.min(actionChars[0], aw),
        Math.max(actionChars[1], aw),
      ];
      if (layout === "wide" && (aw < 19.5 || aw > 48.5))
        fail(`action is ${aw.toFixed(1)}ch wide`);

      for (const el of row.querySelectorAll<HTMLElement>(
        "[class*=bill-cell-], .bill-title, .bill-sponsor, .bill-action, time",
      ))
        if (el.scrollWidth > el.clientWidth)
          fail(`${el.className || el.tagName} overflows`);

      // Symmetric padding: the row's top edge to its first cell equals its
      // last line of text to the bottom rule (the status cell's overhang
      // aside). Long titles or actions just make both sides of the text
      // taller, so every row is checked; one-line titles are counted.
      if (title.getBoundingClientRect().height < 1.5 * lineHeight(title))
        oneLineTitles++;
      const li = row.closest("li")!;
      const rule =
        box(li).bottom - parseFloat(getComputedStyle(li).borderBottomWidth);
      const cells = [...row.children].filter(
        (el) => el !== status && !el.classList.contains("bill-cell-chev"),
      );
      const top = box(q(".bill-cell-bill")).top - box(row).top;
      const bottom = rule - Math.max(...cells.map((el) => box(el).bottom));
      if (Math.abs(top - bottom) > 1)
        fail(`padding ${top.toFixed(1)} above, ${bottom.toFixed(1)} below`);
      if (layout !== "stacked") {
        const above = rule - box(status).bottom;
        if (above < 8) fail(`step ${above.toFixed(1)} above the rule`);
      }
    }
    return {
      layout,
      tracks,
      failures,
      oneLineTitles,
      titleChars: titleChars.map((n) => +n.toFixed(1)),
      actionChars: actionChars.map((n) => +n.toFixed(1)),
    };
  });
}

async function checkLayoutAndLimits(page: Page, width: number) {
  const result = await measure(page);
  const where = `at ${width}`;
  expect(result.tracks, where).toBe(tracksAt(width));
  expect(result.failures, where).toEqual([]);
  if (result.layout !== "stacked")
    expect(result.oneLineTitles, where).toBeGreaterThan(0);
  console.log(`tracker ${width}: ${JSON.stringify(result)}`);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tracker");
});

// T9: only the current page is in the DOM, so the limits page through every
// bill at 100 per page.
const ALL_PAGES = Math.ceil(bills.length / 100);
async function checkEveryRow(page: Page, width: number) {
  for (let n = 1; n <= ALL_PAGES; n++) {
    await page.goto(`/tracker?per=100&page=${n}`);
    await expect(page.locator(".bill-pager-range")).toHaveText(
      new RegExp(`^${(n - 1) * 100 + 1}–`),
    );
    await checkLayoutAndLimits(page, width);
  }
}

test("layout and text limits at this viewport, every row", async ({ page }) => {
  await checkEveryRow(page, page.viewportSize()!.width);
});

test("layout and text limits at 2560, 991 and 320, every row", async ({
  page,
}, { project }) => {
  test.skip(project.name !== "1440x900", "sets its own widths");
  for (const width of EXTRA_WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await checkEveryRow(page, width);
  }
});

test("a row toggles with Enter and Space, with a 2px focus ring", async ({
  page,
}) => {
  const details = page.locator(".bill-table details").first();
  const summary = details.locator("summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  const outline = await summary.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).toBe("solid");
  expect(outline.width).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
});

test("axe reports no violations on /tracker", async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("no horizontal scroll at 320 or at 400% zoom of 1280", async ({
  page,
  browser,
}, { project }) => {
  test.skip(project.name !== "1440x900", "sets its own widths");
  const fits = (p: Page) =>
    p.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    );
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await fits(page), "at 320").toBe(true);
  // 400% of 1280 is a 320 CSS px viewport at 4 device pixels per px.
  const context = await browser.newContext({
    viewport: { width: 320, height: 800 },
    deviceScaleFactor: 4,
  });
  const zoomed = await context.newPage();
  await zoomed.goto("/tracker");
  expect(await fits(zoomed), "at 400% of 1280").toBe(true);
  await context.close();
});

test("without JavaScript, the first 10 bills render, newest action first, with the CSV note", async ({
  browser,
}, { project }) => {
  test.skip(project.name !== "1440x900", "one viewport is enough");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/tracker");
  const rows = await page.locator(".bill-table > ol > li").evaluateAll((lis) =>
    lis.map((li) => ({
      id: li.id,
      date: li.querySelector("time")!.getAttribute("datetime")!,
    })),
  );
  expect(rows.map((row) => row.id)).toEqual(
    bills.slice(0, 10).map((bill) => bill.id),
  );
  for (let i = 1; i < rows.length; i++)
    expect(rows[i].date <= rows[i - 1].date, rows[i].id).toBe(true);
  // Playwright's text engine skips <noscript>, so these use CSS.
  const note = page.locator("section[aria-labelledby=finder-heading] > noscript > p");
  await expect(note).toBeVisible();
  expect(await note.evaluate((p) => p.textContent)).toBe(
    "The full list needs JavaScript. Download every bill as CSV",
  );
  await expect(note.locator("a")).toHaveAttribute(
    "href",
    "/data/ai-bills-119.csv",
  );
  // An opened row offers Congress.gov, not a loading message that never ends.
  const details = page.locator(".bill-table > ol > li > details").first();
  await details.locator("summary").click();
  await expect(details.locator(".bill-panel-loading")).toBeHidden();
  await expect(details.locator("noscript a")).toBeVisible();
  await context.close();
});

// T4: the finder (spec §4.3, §4.4b, §4.6). Each test waits for the pagination
// nav, which only renders after hydration.
const TOTAL = bills.length;
const PER = 10;
const PAGES = Math.ceil(TOTAL / PER);
const STATUS = "section[aria-labelledby=finder-heading] p[role=status]";
const finder = (page: Page) => ({
  nav: page.getByRole("navigation", { name: "Pagination" }),
  status: page.locator(STATUS),
  rows: page.locator(".bill-table > ol > li"),
  search: page.locator("#finder-q"),
  // Not the panels' "Summary" h3s.
  empty: page.locator(".bill-table > div > h3"),
});
const ready = (page: Page) => expect(finder(page).nav).toBeVisible();
/** Below md the selects and pills sit in the Filters menu (T10). */
async function openFilters(page: Page) {
  const button = page.getByRole("button", { name: /^Filters/ });
  if (
    (await button.isVisible()) &&
    (await button.getAttribute("aria-expanded")) === "false"
  )
    await button.click();
}
const isFocused = (page: Page, selector: string) =>
  page.evaluate(
    (s) => document.activeElement === document.querySelector(s),
    selector,
  );

test("axe: 0 violations filtered, on page 2 and in the empty state", async ({
  page,
}) => {
  const f = finder(page);
  await ready(page);
  const axe = async (where: string) => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations, where).toEqual([]);
  };
  await openFilters(page);
  await page.locator(".finder-pill", { hasText: "Deepfakes" }).click();
  await axe("filtered");
  await page.goto("/tracker?page=2");
  await ready(page);
  await axe("page 2");
  await f.search.fill("zzzz");
  await expect(f.empty).toBeVisible();
  await axe("empty state");
});

test('"zzzz" shows the empty state; Clear resets and focuses the search', async ({
  page,
}) => {
  const f = finder(page);
  await ready(page);
  await openFilters(page);
  await page.locator(".finder-pill", { hasText: "Children and teens" }).click();
  await f.search.fill("zzzz");
  await expect(f.empty).toHaveText("No bills match “zzzz”");
  await expect(f.status).toHaveText("No bills match");
  await expect(f.rows).toHaveCount(0);
  await expect(f.nav).toHaveCount(0);
  await expect(page.locator(".bill-head")).toBeAttached();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(f.rows).toHaveCount(PER);
  await expect(f.status).toHaveText(`Showing 1–${PER} of ${TOTAL} bills`);
  await expect(f.search).toHaveValue("");
  expect(await isFocused(page, "#finder-q")).toBe(true);
  expect(new URL(page.url()).search).toBe("");
  await expect(page.locator("input[name=topic][value='']")).toBeChecked();
});

test("a topic narrows the list, and its URL round-trips on reload", async ({
  page,
}) => {
  const f = finder(page);
  const n = bills.filter((b) => b.topics.includes("deepfakes")).length;
  expect(n).toBeGreaterThan(1);
  expect(n).toBeLessThan(TOTAL);
  const text = `Showing 1–${Math.min(PER, n)} of ${n} bills`;
  await ready(page);
  await openFilters(page);
  await page.locator(".finder-pill", { hasText: "Deepfakes" }).click();
  await expect(page).toHaveURL(/\?topic=deepfakes$/);
  await expect(f.status).toHaveText(text);
  await page.reload();
  await ready(page);
  await expect(page.locator("input[value=deepfakes]")).toBeChecked();
  await expect(f.status).toHaveText(text);
});

test("Next goes to page 2 and focuses the count; Next is disabled at the end", async ({
  page,
}) => {
  const f = finder(page);
  await ready(page);
  const previous = f.nav.getByRole("button", { name: "Previous page" });
  const next = f.nav.getByRole("button", { name: "Next page" });
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(f.nav.locator(".bill-pager-range")).toHaveText(
    `11–20 of ${TOTAL} bills`,
  );
  await expect(page).toHaveURL(/\?page=2$/);
  expect(await isFocused(page, STATUS)).toBe(true);
  await expect(previous).toBeEnabled();
  await f.nav.getByLabel("Page", { exact: true }).selectOption(String(PAGES));
  await expect(next).toBeDisabled();
  await expect(f.rows).toHaveCount(TOTAL - (PAGES - 1) * PER);
});

test("changing a filter on page 3 goes back to page 1", async ({ page }) => {
  const f = finder(page);
  await page.goto("/tracker?page=3");
  await ready(page);
  await expect(f.nav.locator(".bill-pager-range")).toHaveText(
    `21–30 of ${TOTAL} bills`,
  );
  await openFilters(page);
  await page.selectOption("#finder-chamber", "house");
  await expect(page).toHaveURL(/\?chamber=house$/);
  await expect(f.status).toHaveText(/^Showing 1–/);
});

test("50 per page shows 50 rows", async ({ page }) => {
  const f = finder(page);
  await ready(page);
  await f.nav.getByLabel("Bills per page").selectOption("50");
  await expect(f.rows).toHaveCount(50);
  await expect(page).toHaveURL(/\?per=50$/);
});

// T9: Joey saw per page 10 change more than the page size. Every count must
// stay put apart from the page size, and per page must survive every action.
test("10 per page changes only the page size, and survives filter, sort, page, reload and hash", async ({
  page,
}) => {
  const f = finder(page);
  const snapshot = () =>
    page.evaluate((status) => {
      const pills = [...document.querySelectorAll(".finder-pill")].map(
        (p) => p.textContent,
      );
      return {
        status: document.querySelector(status)!.textContent!,
        range: document.querySelector(".bill-pager-range")!.textContent!,
        pages: document.querySelectorAll("#pager-page option").length,
        pills,
      };
    }, STATUS);
  await page.goto("/tracker?per=25");
  await ready(page);
  const at25 = await snapshot();
  expect(at25.range).toBe(`1–25 of ${TOTAL} bills`);
  await f.nav.getByLabel("Bills per page").selectOption("10");
  await expect(f.rows).toHaveCount(10);
  await expect(page).toHaveURL(/\/tracker$/);
  const at10 = await snapshot();
  expect(at10).toEqual({
    status: `Showing 1–10 of ${TOTAL} bills`,
    range: `1–10 of ${TOTAL} bills`,
    pages: Math.ceil(TOTAL / 10),
    pills: at25.pills,
  });
  expect(at25.status).toBe(`Showing 1–25 of ${TOTAL} bills`);
  expect(at25.pages).toBe(Math.ceil(TOTAL / 25));

  // A non-default per page survives each action (10 is the default, so 50).
  const per = f.nav.getByLabel("Bills per page");
  await per.selectOption("50");
  await openFilters(page);
  await page.selectOption("#finder-chamber", "house");
  await expect(per).toHaveValue("50");
  await page.selectOption("#finder-sort", "cosponsors");
  await expect(per).toHaveValue("50");
  await f.nav.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=2&per=50$/);
  await page.reload();
  await ready(page);
  await expect(per).toHaveValue("50");
  await expect(f.rows).toHaveCount(50);
  await page.goto("/tracker?per=50#s146-119");
  await ready(page);
  await expect(row(page, "s146-119")).toHaveAttribute("open", "");
  await expect(per).toHaveValue("50");
  await expect(page).toHaveURL(/per=50#s146-119$/);
});

test("every control has a name; targets ≥ 24px, pager buttons 2.5rem", async ({
  page,
}) => {
  await ready(page);
  await openFilters(page);
  const report = await page.evaluate(() => {
    const root = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const section = document.querySelector(
      "section[aria-labelledby=finder-heading]",
    )!;
    const problems: string[] = [];
    const controls = section.querySelectorAll<HTMLInputElement>(
      "form input, form select, nav select, nav button",
    );
    for (const el of controls) {
      const name =
        el.getAttribute("aria-label") || el.labels?.[0]?.textContent?.trim();
      if (!name) problems.push(`${el.outerHTML.slice(0, 60)} has no name`);
      // A radio is sr-only; its pill label is the target.
      const target = el.type === "radio" ? el.closest("label")! : el;
      const { width, height } = target.getBoundingClientRect();
      if (width < 24 || height < 24)
        problems.push(`${name}: ${width}×${height}`);
    }
    const near = (a: number, b: number) => Math.abs(a - b) < 0.5;
    for (const button of section.querySelectorAll("nav button")) {
      const { width, height } = button.getBoundingClientRect();
      if (!near(width, 2.5 * root) || !near(height, 2.5 * root))
        problems.push(`pager button ${width}×${height}`);
    }
    for (const select of section.querySelectorAll("nav select"))
      if (select.getBoundingClientRect().height < 2.5 * root - 0.5)
        problems.push(`pager select ${select.getBoundingClientRect().height}`);
    return { problems, count: controls.length };
  });
  expect(report.problems).toEqual([]);
  expect(report.count).toBeGreaterThan(10);
});

test("the pagination wraps with no horizontal scroll at 390 and 320", async ({
  page,
}, { project }) => {
  test.skip(project.name !== "390x844", "sets 390 and 320");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await ready(page);
    const result = await finder(page).nav.evaluate((nav) => {
      const box = (el: Element) => el.getBoundingClientRect();
      const outer = box(nav);
      return {
        fits:
          document.documentElement.scrollWidth <=
            document.documentElement.clientWidth &&
          nav.scrollWidth <= nav.clientWidth,
        rangeFirst:
          box(nav.querySelector(".bill-pager-range")!).bottom <=
          box(nav.querySelector("label")!).top,
        inside: [...nav.querySelectorAll("label, p, button")].every(
          (el) =>
            box(el).left >= outer.left - 0.5 &&
            box(el).right <= outer.right + 0.5,
        ),
      };
    });
    expect(result, `at ${width}`).toEqual({
      fits: true,
      rangeFirst: true,
      inside: true,
    });
  }
});

// T5: the expanded row (spec §4.5).
const row = (page: Page, id: string) =>
  page.locator(`li[id="${id}"] > details`);

test("axe: 0 violations with one row open", async ({ page }) => {
  // S. 146 fills every part of the panel.
  await page.goto("/tracker?q=s146");
  await ready(page);
  const details = row(page, "s146-119");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await expect(details.locator(".bill-panel-facts")).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, `at ${page.viewportSize()!.width}`).toEqual([]);
});

// T9: panels load on first open.
test("loading state: aria-busy, then the panel; axe clean while loading", async ({
  page,
}) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/data/tracker/bills/s146-119.json", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto("/tracker?q=s146");
  await ready(page);
  const details = row(page, "s146-119");
  await details.locator("summary").click();
  const loading = details.locator(".bill-panel-loading");
  await expect(loading).toHaveText("Loading details…");
  await expect(loading).toHaveAttribute("aria-busy", "true");
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations, "loading").toEqual([]);
  release();
  await expect(details.locator(".bill-panel-facts")).toBeVisible();
  await expect(loading).toHaveCount(0);
});

test("a failed fetch offers Congress.gov and retries on the next open", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/data/tracker/bills/s146-119.json", (route) =>
    fail ? route.fulfill({ status: 500 }) : route.continue(),
  );
  await page.goto("/tracker?q=s146");
  await ready(page);
  const details = row(page, "s146-119");
  const summary = details.locator("summary");
  await summary.click();
  await expect(details).toContainText("Couldn’t load the details");
  await expect(
    details.getByRole("link", { name: "View on Congress.gov (external site)" }),
  ).toHaveAttribute(
    "href",
    "https://www.congress.gov/bill/119th-congress/senate-bill/146",
  );
  fail = false;
  await summary.click();
  await summary.click();
  await expect(details.locator(".bill-panel-facts")).toBeVisible();
});

test("a panel isn't refetched after paging away and back", async ({ page }) => {
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/data/tracker/bills/")) fetched.push(r.url());
  });
  await ready(page);
  const first = finder(page).rows.first().locator("details");
  await first.locator("summary").click();
  await expect(first.locator(".bill-panel-facts")).toBeVisible();
  const next = finder(page).nav.getByRole("button", { name: "Next page" });
  await next.click();
  await finder(page).nav.getByRole("button", { name: "Previous page" }).click();
  const again = finder(page).rows.first().locator("details");
  await again.locator("summary").click();
  await expect(again.locator(".bill-panel-facts")).toBeVisible();
  expect(new Set(fetched).size).toBe(fetched.length);
});

test("S. 146 open: Became law, milestones in date order, external link", async ({
  page,
}) => {
  await page.goto("/tracker?q=s146");
  await ready(page);
  const details = row(page, "s146-119");
  await details.locator("summary").click();
  const panel = details.locator(".bill-panel");
  await expect(panel).toBeVisible();
  await expect(details.locator("summary")).toContainText("Became law");
  await expect(panel).toContainText("Public Law 119-12");
  const dates = await panel
    .locator("ol time")
    .evaluateAll((els) => els.map((el) => el.getAttribute("datetime")!));
  expect(dates.length).toBeGreaterThan(3);
  expect(dates).toEqual(dates.toSorted());
  const link = panel.getByRole("link", { name: /^View on Congress\.gov/ });
  await expect(link).toHaveAccessibleName(
    "View on Congress.gov (external site)",
  );
  await expect(link).toHaveAttribute(
    "href",
    "https://www.congress.gov/bill/119th-congress/senate-bill/146",
  );
});

test("/tracker#s146-119 opens the row on another page, past a URL filter", async ({
  page,
}) => {
  // S. 146 is a Senate bill, well past page 1 of the default sort.
  await page.goto("/tracker?chamber=house#s146-119");
  await ready(page);
  const details = row(page, "s146-119");
  await expect(details).toHaveAttribute("open", "");
  await expect(page).toHaveURL(/\/tracker\?page=([2-9]|\d\d+)#s146-119$/);
  await expect(details.locator("summary")).toBeInViewport();
});

// T11 (T5's note): a hash set on the loaded page before hydration.
test("a hash set right after load, before hydration, still opens its row", async ({
  page,
}) => {
  for (const waitUntil of ["commit", "load"] as const) {
    await page.goto("/tracker", { waitUntil });
    await page.goto("/tracker#s146-119", { waitUntil: "commit" });
    const details = row(page, "s146-119");
    // Hydration itself can take seconds when every project runs at once.
    await expect(details, waitUntil).toHaveAttribute("open", "", {
      timeout: 15_000,
    });
    await expect(details.locator(".bill-panel-facts")).toBeVisible();
  }
});

test("a companion link opens its target row", async ({ page }) => {
  // Hydrated first, so this is the hashchange path (the test above loads).
  await ready(page);
  await page.goto("/tracker#hr10567-119");
  await ready(page);
  const from = row(page, "hr10567-119");
  await expect(from).toHaveAttribute("open", "");
  await from
    .locator(".bill-panel")
    .getByRole("link", { name: "S. 5417", exact: true })
    .click();
  const to = row(page, "s5417-119");
  await expect(to).toHaveAttribute("open", "");
  await expect(to.locator("summary")).toBeInViewport();
});

test("the chevron flips when open, with no transition under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const details = finder(page).rows.first().locator("details");
  const chevron = details.locator(".bill-chevron");
  const style = () =>
    chevron.evaluate((el) => {
      const s = getComputedStyle(el);
      return { transform: s.transform, duration: s.transitionDuration };
    });
  expect(await style()).toEqual({ transform: "none", duration: "0s" });
  await details.locator("summary").click();
  expect(await style()).toEqual({
    transform: "matrix(-1, 0, 0, -1, 0, 0)",
    duration: "0s",
  });
});

test("every panel open at 320: no horizontal scroll", async ({ page }, {
  project,
}) => {
  test.skip(project.name !== "390x844", "sets 320");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 800 });
  // Panels load on open (T9), so each page of 100 opens and waits for all.
  for (let n = 1; n <= ALL_PAGES; n++) {
    await page.goto(`/tracker?per=100&page=${n}`);
    await ready(page);
    const rows = await finder(page).rows.count();
    await page.evaluate(() =>
      document
        .querySelectorAll<HTMLDetailsElement>(".bill-table > ol > li > details")
        .forEach((d) => (d.open = true)),
    );
    await expect(page.locator(".bill-panel-facts")).toHaveCount(rows, {
      timeout: 30_000,
    });
    const fits = await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    );
    expect(fits, `page ${n}`).toBe(true);
  }
});

// T10: the Filters menu below md (spec §4.3).
test.describe("phone Filters menu", () => {
  test.beforeEach(async ({ page }, { project }) => {
    test.skip(project.name !== "390x844", "below md only");
    await ready(page);
  });
  const toggle = (page: Page) =>
    page.getByRole("button", { name: /^Filters/ });

  test("selects and pills hide until it opens; the label counts active filters", async ({
    page,
  }) => {
    const button = toggle(page);
    await expect(button).toHaveText("Filters");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute("aria-controls", "finder-filters");
    await expect(page.locator("#finder-chamber")).toBeHidden();
    await expect(page.locator(".finder-pill").first()).toBeHidden();
    await expect(page.locator("#finder-q")).toBeVisible();
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#finder-chamber")).toBeVisible();
    await page.selectOption("#finder-chamber", "senate");
    await page.locator(".finder-pill", { hasText: "Elections" }).click();
    await expect(button).toHaveText("Filters (2)");
    // It always starts closed, even with filters in the URL.
    await page.reload();
    await ready(page);
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page)).toHaveText("Filters (2)");
  });

  test('"Show n bills" closes the panel and focuses the count; Clear keeps it open', async ({
    page,
  }) => {
    await toggle(page).click();
    await page.selectOption("#finder-chamber", "senate");
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#finder-chamber")).toHaveValue("");
    await page.selectOption("#finder-chamber", "senate");
    const senate = bills.filter((b) => b.id.startsWith("s")).length;
    await page
      .getByRole("button", { name: `Show ${senate} bills`, exact: true })
      .click();
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    expect(await isFocused(page, STATUS)).toBe(true);
    await expect(finder(page).status).toBeInViewport();
  });

  test("Escape closes it and returns focus to the button", async ({ page }) => {
    await toggle(page).click();
    await page.locator("#finder-chamber").focus();
    await page.keyboard.press("Escape");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page)).toBeFocused();
    // T11: also with focus on the button itself.
    await page.keyboard.press("Enter");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toggle(page)).toBeFocused();
  });

  test("axe: 0 violations with the menu closed and open", async ({ page }) => {
    let { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations, "closed").toEqual([]);
    await toggle(page).click();
    ({ violations } = await new AxeBuilder({ page }).analyze());
    expect(violations, "open").toEqual([]);
  });
});

// T10: the sticky column header (wide and medium layouts).
test.describe("sticky column header", () => {
  test.beforeEach(async ({ page }, { project }) => {
    test.skip(project.name !== "1440x900", "sets its own sizes");
    await page.goto("/tracker?per=100");
    await ready(page);
  });
  const headState = (page: Page) =>
    page.evaluate(() => {
      const head = document.querySelector<HTMLElement>(".bill-head")!;
      const labels = [...head.children].filter(
        (el) => getComputedStyle(el).display !== "none",
      );
      return {
        position: getComputedStyle(head).position,
        top: head.getBoundingClientRect().top,
        labelsVisible: labels.every((el) => {
          const r = el.getBoundingClientRect();
          return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight;
        }),
        labels: labels.length,
      };
    });
  const scrollHalfway = (page: Page) =>
    page.evaluate(() => {
      const { top, height } = document
        .querySelector(".bill-table")!
        .getBoundingClientRect();
      window.scrollTo({ top: scrollY + top + height / 2, behavior: "instant" });
    });

  test("halfway through the table, the header is at top 0 with every label", async ({
    page,
  }) => {
    await scrollHalfway(page);
    expect(await headState(page)).toEqual({
      position: "sticky",
      top: 0,
      labelsVisible: true,
      labels: 5,
    });
  });

  test("it still sticks under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await scrollHalfway(page);
    expect((await headState(page)).top).toBe(0);
  });

  test("under 640 tall (1440×600) it doesn't stick", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await scrollHalfway(page);
    const state = await headState(page);
    expect(state.position).toBe("static");
    expect(state.top).toBeLessThan(0);
  });

  // Forward Tab brings rows in at the bottom; Shift+Tab is what scrolls a row
  // up to the header (without the scroll-margin, 12 of 49 land under it).
  test("a Tab walk, both ways, never leaves a focused summary under the header", async ({
    page,
  }) => {
    await page.locator(STATUS).focus();
    const problems: string[] = [];
    let summaries = 0;
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press(i < 60 ? "Tab" : "Shift+Tab");
      const r = await page.evaluate(() => {
        const el = document.activeElement!;
        const head = document.querySelector(".bill-head")!;
        return {
          summary: el.tagName === "SUMMARY",
          id: el.closest("li")?.id,
          top: el.getBoundingClientRect().top,
          headBottom: head.getBoundingClientRect().bottom,
        };
      });
      if (!r.summary) continue;
      summaries++;
      if (r.top < r.headBottom - 0.5)
        problems.push(`${r.id}: top ${r.top} < header ${r.headBottom}`);
    }
    expect(summaries).toBeGreaterThan(80);
    expect(problems).toEqual([]);
  });
});

// T11: the bug sweep.
test("the search's own clear button: named, ≥ 24px, only with a query, refocuses the field", async ({
  page,
}) => {
  await ready(page);
  const f = finder(page);
  const clear = page.getByRole("button", { name: "Clear search" });
  await expect(clear).toHaveCount(0);
  await f.search.fill("deepfake");
  await expect(clear).toBeVisible();
  const box = (await clear.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  // Chrome's own (blue) cancel button is hidden. getComputedStyle can't read
  // that pseudo-element, so look for a rule that matches the field.
  expect(
    await f.search.evaluate((input) => {
      const rules = (sheet: CSSStyleSheet | CSSGroupingRule): CSSRule[] =>
        [...sheet.cssRules].flatMap((r) =>
          r instanceof CSSStyleRule || !("cssRules" in r)
            ? [r]
            : rules(r as CSSGroupingRule),
        );
      return [...document.styleSheets]
        .flatMap((s) => rules(s))
        .some(
          (r) =>
            r instanceof CSSStyleRule &&
            r.selectorText.includes("::-webkit-search-cancel-button") &&
            r.style.appearance === "none" &&
            input.matches(
              r.selectorText.replace("::-webkit-search-cancel-button", ""),
            ),
        );
    }),
  ).toBe(true);
  await clear.click();
  await expect(f.search).toHaveValue("");
  await expect(f.search).toBeFocused();
  await expect(clear).toHaveCount(0);
  await expect(f.status).toHaveText(`Showing 1–${PER} of ${TOTAL} bills`);
});

test("the status bar's segments are --progress-gap (3/16rem) apart", async ({
  page,
}) => {
  await ready(page);
  const { gap, root } = await page.evaluate(() => ({
    gap: parseFloat(getComputedStyle(document.querySelector(".bill-bar")!).columnGap),
    root: parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(gap).toBeCloseTo((3 / 16) * root, 2);
});

test("the list opens with a 4px rule in the stacked layout only", async ({
  page,
}) => {
  await ready(page);
  const { rule, tracks } = await page.evaluate(() => ({
    rule: getComputedStyle(document.querySelector(".bill-table > ol")!)
      .borderTopWidth,
    tracks: getComputedStyle(document.querySelector(".bill-row")!)
      .gridTemplateColumns.split(" ").length,
  }));
  expect(rule).toBe(tracks === 2 ? "4px" : "0px");
});

test("a filter change after a hash link drops the hash, so the URL round-trips", async ({
  page,
}) => {
  await page.goto("/tracker#s146-119");
  await ready(page);
  await expect(row(page, "s146-119")).toHaveAttribute("open", "");
  await openFilters(page);
  await page.selectOption("#finder-chamber", "house");
  await expect(page).toHaveURL(/\/tracker\?chamber=house$/);
  await page.reload();
  await ready(page);
  await expect(page.locator("#finder-chamber")).toHaveValue("house");
});
