import { expect, test, type Browser } from "@playwright/test";

// T9 budgets for /tracker. Production only: run with
// `npx playwright test --config playwright.prod.config.ts --project perf`.
// Its "perf" project runs after the rest, alone.
test.beforeEach(async ({ request }) => {
  const html = await (await request.get("/tracker")).text();
  test.skip(
    html.includes("/_next/static/chunks/webpack") ||
      html.includes("react-refresh") ||
      html.includes("turbopack-hmr"),
    "a dev server: the budgets apply to `next start` only",
  );
});

test("the server HTML is ≤ 120 KB with ≤ 10 rows and no panel content", async ({
  request,
}) => {
  const html = await (await request.get("/tracker")).text();
  expect(Buffer.byteLength(html)).toBeLessThanOrEqual(120 * 1024);
  expect(html.match(/<summary class="bill-row"/g)?.length).toBeLessThanOrEqual(10);
  expect(html).not.toContain("bill-panel-facts");
});

test("opening a row fetches its JSON once; reopening fetches nothing", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/data/tracker/bills/")) requests.push(r.url());
  });
  await page.goto("/tracker");
  await expect(
    page.getByRole("navigation", { name: "Pagination" }),
  ).toBeVisible();
  const details = page.locator(".bill-table > ol > li > details").first();
  const id = await details.evaluate((el) => el.parentElement!.id);
  const summary = details.locator("summary");
  await summary.click();
  await expect(details.locator(".bill-panel-facts")).toBeVisible();
  await summary.click();
  await summary.click();
  await expect(details.locator(".bill-panel-facts")).toBeVisible();
  expect(requests).toEqual([
    expect.stringContaining(`/data/tracker/bills/${id}.json`),
  ]);
});

// TBT swings ±100 ms between identical loads on a shared machine, so the
// budget applies to the median of three cold loads.
test("LCP < 2.5 s and TBT < 200 ms at 390, 4× CPU and Fast 3G (median of 3)", async ({
  browser,
}, { project }) => {
  test.setTimeout(90_000);
  const runs = [];
  for (let i = 0; i < 3; i++)
    runs.push(await coldLoad(browser, project.use.baseURL!));
  const median = (xs: number[]) => xs.toSorted((a, b) => a - b)[1];
  const lcp = median(runs.map((r) => r.lcp));
  const tbt = median(runs.map((r) => r.tbt));
  console.log(
    `tracker 390: LCP ${runs.map((r) => Math.round(r.lcp))} ms, TBT ${runs.map((r) => Math.round(r.tbt))} ms`,
  );
  expect(lcp).toBeGreaterThan(0);
  expect(lcp).toBeLessThan(2500);
  expect(tbt).toBeLessThan(200);
});

async function coldLoad(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    baseURL,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const w = window as unknown as {
      perf: { lcp: number; tasks: [number, number][] };
    };
    w.perf = { lcp: 0, tasks: [] };
    new PerformanceObserver((list) =>
      list.getEntries().forEach((e) => (w.perf.lcp = e.startTime)),
    ).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) =>
      list
        .getEntries()
        .forEach((e) => w.perf.tasks.push([e.startTime, e.duration])),
    ).observe({ type: "longtask", buffered: true });
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  // DevTools' Fast 3G.
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 562.5,
    downloadThroughput: (1.6 * 1024 * 1024 * 0.9) / 8,
    uploadThroughput: (750 * 1024 * 0.9) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("/tracker", { waitUntil: "load", timeout: 60_000 });
  // Long tasks after load (hydration) still count toward TBT.
  await page.waitForTimeout(5000);
  const result = await page.evaluate(() => {
    const w = window as unknown as {
      perf: { lcp: number; tasks: [number, number][] };
    };
    const fcp =
      performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
      0;
    return {
      lcp: w.perf.lcp,
      tbt: w.perf.tasks
        .filter(([start]) => start >= fcp)
        .reduce((sum, [, duration]) => sum + Math.max(0, duration - 50), 0),
    };
  });
  await context.close();
  return result;
}
