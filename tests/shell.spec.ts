import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const navOrder = [
  "Articles",
  "Privacy Policy",
  "Bill Tracker",
  "Accessibility",
  "Joey Holzman (external site)",
];

// A plain shell page: one body link. /tracker has its own spec (220 rows of
// tab stops since T3).
test.beforeEach(async ({ page }) => {
  await page.goto("/privacy");
});

test("axe reports no violations on /privacy", async ({ page }) => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test("keyboard order, with a visible 2px outline on every stop", async ({
  page,
}) => {
  const expected = [
    "Skip to content",
    "AI in Congress",
    ...navOrder,
    "Vercel",
    "Email address",
    "Submit",
    ...navOrder,
  ];
  const stops: string[] = [];
  for (let i = 0; i < expected.length; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        name:
          el.getAttribute("aria-label") ??
          el.querySelector("[aria-label]")?.getAttribute("aria-label") ??
          (el instanceof HTMLInputElement
            ? el.labels?.[0]?.textContent
            : null) ??
          el.textContent?.trim(),
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
      };
    });
    expect(stop.outline, `outline on ${stop.name}`).toBe("solid 2px");
    stops.push(stop.name ?? "");
  }
  expect(stops).toEqual(expected);
});

test("nav targets are at least 24px tall", async ({ page }) => {
  for (const name of ["Main", "Footer"]) {
    for (const link of await page
      .getByRole("navigation", { name })
      .getByRole("link")
      .all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    }
  }
});

test("the logo never sets the topbar's height (md and up)", async ({
  page,
}) => {
  // Below md the logo stacks above the nav, so it adds its height by design.
  test.skip((page.viewportSize()?.width ?? 0) < 768, "md and up");
  const m = await page.locator("header").evaluate((el) => ({
    logo: el.querySelector("svg[role=img]")!.getBoundingClientRect().height,
    nav: el.querySelector("nav")!.getBoundingClientRect().height,
    row: el.firstElementChild!.getBoundingClientRect().height,
  }));
  expect(m.logo).toBeLessThan(m.nav);
  expect(m.logo).toBeLessThan(m.row);
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

test("newsletter: an amber band, the input edged in 1px ink", async ({
  page,
}) => {
  const band = await page
    .locator("#newsletter-heading")
    .evaluate(
      (h) => getComputedStyle(h.closest("[data-tile]")!).backgroundColor,
    );
  expect(band).toBe("rgb(255, 174, 61)");
  const input = await page.locator("#newsletter-email").evaluate((el) => {
    const style = getComputedStyle(el);
    return `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`;
  });
  expect(input).toBe("1px solid rgb(8, 8, 12)");
});

test("submit announces the pre-launch message", async ({ page }) => {
  await page.getByLabel("Email address").fill("name@domain.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("[aria-live=polite]")).toHaveText(
    "Signups open soon.",
  );
  expect(page.url()).toMatch(/\/privacy$/);
});
