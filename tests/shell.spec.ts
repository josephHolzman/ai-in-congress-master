import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const navOrder = [
  "Articles",
  "Privacy Policy",
  "Joey Holzman (external site)",
  "Bill Tracker",
  "Accessibility",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/tracker");
});

test("axe reports no violations on /tracker", async ({ page }) => {
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
  for (const link of await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link")
    .all()) {
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
  }
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

test("submit announces the pre-launch message", async ({ page }) => {
  await page.getByLabel("Email address").fill("name@domain.com");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.locator("[aria-live=polite]")).toHaveText(
    "Signups open soon.",
  );
  expect(page.url()).toMatch(/\/tracker$/);
});
