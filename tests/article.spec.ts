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

  test(`${s}: the topbar takes the header's color, logo, links and rings in its fg, a hairline below`, async ({
    page,
  }) => {
    await open(page, s);
    const colors = await page.evaluate(() => {
      const topbar = document.querySelector("header[data-tile]")!;
      const header = document.querySelector("main > [data-tile]")!;
      return {
        mode: topbar.getAttribute("data-tile"),
        headerMode: header.getAttribute("data-tile"),
        bg: getComputedStyle(topbar).backgroundColor,
        headerBg: getComputedStyle(header).backgroundColor,
        fg: getComputedStyle(topbar).color,
        logo: getComputedStyle(topbar.querySelector("svg[role=img]")!).color,
        links: [...topbar.querySelectorAll("nav a")].map(
          (a) => getComputedStyle(a).color,
        ),
        hairline: `${getComputedStyle(topbar).borderBottomStyle} ${getComputedStyle(topbar).borderBottomWidth}`,
      };
    });
    expect(colors.mode).toBe(colors.headerMode);
    expect(colors.bg).toBe(colors.headerBg);
    expect(colors.logo).toBe(colors.fg);
    expect(colors.links).toHaveLength(5);
    for (const link of colors.links) expect(link).toBe(colors.fg);
    expect(colors.hairline).toBe("solid 1px");

    // Every topbar stop: a solid 2px ring in the fg, ≥ 3:1 on the topbar.
    const stops: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const topbar = document.querySelector("header[data-tile]")!;
        if (!topbar.contains(el)) return null;
        const rgb = (c: string) => c.match(/[\d.]+/g)!.map(Number);
        const lum = (c: string) => {
          const [r, g, b] = rgb(c).map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const style = getComputedStyle(el);
        const [hi, lo] = [
          lum(style.outlineColor),
          lum(getComputedStyle(topbar).backgroundColor),
        ].sort((a, b) => b - a);
        return {
          name: el.textContent?.trim() || "logo",
          outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
          fg: getComputedStyle(topbar).color,
          contrast: (hi + 0.05) / (lo + 0.05),
        };
      });
      if (!stop) {
        if (stops.length) break;
        continue; // the skip link comes first
      }
      expect(stop.outline, stop.name).toBe(`solid 2px ${stop.fg}`);
      expect(stop.contrast, stop.name).toBeGreaterThanOrEqual(3);
      expect(await focusIsVisible(page), `${stop.name} is covered`).toBe(true);
      stops.push(stop.name);
    }
    expect(stops).toHaveLength(6); // the logo and 5 nav links
  });

  test(`${s}: over 3 lines at display-h2, the title steps down to display-h3`, async ({
    page,
  }) => {
    await open(page, s);
    const t = await page.locator("h1").evaluate((h1) => {
      const measure = () => {
        const style = getComputedStyle(h1);
        const lh = parseFloat(style.lineHeight);
        return {
          size: style.fontSize,
          lh: style.lineHeight,
          lines: Math.round(h1.getBoundingClientRect().height / lh),
          trim: style.getPropertyValue("text-box-trim"),
        };
      };
      const long = h1.hasAttribute("data-long");
      const now = measure();
      h1.removeAttribute("data-long");
      const h2 = measure();
      h1.toggleAttribute("data-long", long);
      // A display-h3 reference, measured in the same header.
      const ref = document.createElement("p");
      ref.className = "type-display-h3";
      h1.after(ref);
      const h3 = getComputedStyle(ref);
      const h3Size = { size: h3.fontSize, lh: h3.lineHeight };
      ref.remove();
      return { long, now, h2, h3: h3Size };
    });
    expect(t.long, `${t.h2.lines} lines at h2`).toBe(t.h2.lines > 3);
    expect([t.now.size, t.now.lh]).toEqual(
      t.long ? [t.h3.size, t.h3.lh] : [t.h2.size, t.h2.lh],
    );
    expect(t.now.trim).toBe("none"); // untrimmed in both sizes
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

test("the header color shows beside the image's top edge", async ({ page }, {
  project,
}) => {
  onlyAt1440(project.name);
  for (const [width, overlap] of [
    [1440, 104],
    [991, 91],
    [390, 56],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    for (const s of slugs) {
      await open(page, s);
      const m = await page.evaluate(() => {
        const header = document.querySelector("main > [data-tile]")!;
        const paper = header.nextElementSibling!;
        const img = document.querySelector("main figure > div")!;
        const box = img.getBoundingClientRect();
        // The image's transparent padding wrapper is the hit target here, so
        // ask which tile sits under the point, not which tile it belongs to.
        const tile = document
          .elementsFromPoint(box.left - 8, box.top + 8)
          .find((el) => el.matches("[data-tile]"));
        return {
          mode: header.getAttribute("data-tile"),
          headerIsHit: tile === header,
          overlap: header.getBoundingClientRect().bottom - box.top,
          seam:
            paper.getBoundingClientRect().top -
            header.getBoundingClientRect().bottom,
        };
      });
      const at = `${m.mode} at ${width}`;
      expect(m.headerIsHit, at).toBe(true);
      expect(m.overlap, at).toBeCloseTo(overlap, 0);
      expect(Math.abs(m.seam), at).toBeLessThanOrEqual(1);
    }
  }
});

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

test("rail: the cap is signal, its heading paper", async ({ page }) => {
  await open(page, CHILD_SAFETY);
  const cap = await page
    .locator("aside > [data-tile]")
    .first()
    .evaluate((el) => ({
      mode: el.getAttribute("data-tile"),
      bg: getComputedStyle(el).backgroundColor,
      heading: getComputedStyle(el.querySelector("h2")!).color,
    }));
  expect(cap).toEqual({
    mode: "signal",
    bg: "rgb(255, 67, 1)",
    heading: "rgb(255, 255, 255)",
  });
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
