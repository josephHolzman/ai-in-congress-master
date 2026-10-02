import { expect, test } from "@playwright/test";

test("body text renders in Switzer", async ({ page }) => {
  await page.goto("/");
  const fontFamily = await page.evaluate(
    () => getComputedStyle(document.body).fontFamily,
  );
  expect(fontFamily).toMatch(/switzer/i);

  // The family name alone doesn't prove the file loaded; the fallback would match too.
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return (
      document.fonts.check("400 16px switzer") &&
      [...document.fonts].some(
        (f) => /switzer/i.test(f.family) && f.status === "loaded",
      )
    );
  });
  expect(loaded).toBe(true);
});
