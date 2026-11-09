# Progress log

## E0: Scaffold, assets and project memory · 2026-10-02
- Built: Next.js 16.3.8 (App Router, Turbopack, `src/`, `@/*`), React 19.2.8, TypeScript 5.9 strict, Tailwind 4.3 via `@tailwindcss/postcss`, `@next/mdx` (+ `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx`, which its setup requires), gray-matter, zod 4, `@carbon/icons-react`, Playwright + `@axe-core/playwright`, ESLint 9 (`eslint-config-next` core-web-vitals + typescript), Prettier (default config). Files: `package.json`, `tsconfig.json`, `next.config.ts` (`withMDX`, no `pageExtensions`: posts are loaded content, not routes), `eslint.config.mjs`, `postcss.config.mjs`, `.prettierignore`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx` (renders nothing), `src/app/globals.css`, `src/mdx-components.tsx` (empty map; E3 fills it), `src/lib/site.ts`, `src/components/Logo.tsx`, `public/images/placeholder.svg`, `playwright.config.ts`, `tests/font.spec.ts`, `AGENTS.md`.
- Moved: `Switzer-Variable.ttf`, `Switzer-VariableItalic.ttf` → `src/fonts/`; `AIinCongressLogo.svg` → `src/assets/brand/`; `AIInCongressIcon.svg` → `src/app/icon.svg`.
- Changed: `CLAUDE.md` (Commands filled in, E0 ticked; nothing else).
- Decisions:
  - Both TTFs are variable (`fvar`, `wght` 100–900). One `localFont` family, `--font-switzer`; Next names it `switzer` with an Arial-based `switzer Fallback`.
  - `globals.css` only maps `--font-sans` to `var(--font-switzer)` in `@theme inline`, so preflight applies Switzer to `html`. No tokens yet (E1).
  - `<Logo width>` takes a CSS length string (use a rem token), applied as `style.width`; height follows the viewBox. Paths are inlined in the component with `fill="currentColor"`; the moved SVG stays as the source asset.
  - Placeholder line uses `vector-effect="non-scaling-stroke"` so it stays 1px at any rendered size.
  - `SITE_URL` / `PORTFOLIO_URL` use `||`, so an empty env var also falls back to `"#"`. `SITE_LIVE` is true only for the exact string `"true"`.
  - `AGENTS.md` exists only to protect `CLAUDE.md`: `next dev` writes a Next "agent rules" block into `CLAUDE.md` when it detects an AI agent, unless `AGENTS.md` already holds that block (see `node_modules/next/dist/server/lib/generate-agent-files.js`). Don't delete it unless you're fine with `next dev` editing `CLAUDE.md`.
  - `.prettierignore` excludes `content/`, `docs/` and all `*.md`, so `npm run format` can never touch Joey's articles or the project docs.
  - npm's allow-scripts blocked two postinstalls (`@carbon/icon-helpers` telemetry, `unrs-resolver`). Lint works without them; left blocked.
- Verified: `npm run lint` clean; `npx prettier --check .` clean; `npm run build` passes (routes `/`, `/_not-found`, `/icon.svg`, all static); built HTML has `<meta name="robots" content="noindex, nofollow">`, and a `SITE_LIVE=true` build has no robots tag; favicon link points to `/icon.svg`; `@font-face` output is one `switzer` family, normal + italic, `font-weight: 100 900`, `font-display: swap`. `npm run test:e2e`: 5/5 pass (all five viewports). The body's computed font-family is `switzer, "switzer Fallback", ui-sans-serif, system-ui, sans-serif`, a Switzer FontFace reports `loaded`, and the page has no visible content.
- Open for next prompt: no tokens, base styles or `@utility` yet (E1). No screenshots or axe run in E0 (blank page). `test:e2e` runs against `next dev`; switch `webServer` to build + start if later checks need production output. The Logo component exists but isn't used yet (E2).

## E1: Tokens (color, tile modes, type, spacing, layout) · 2026-10-02
- Built: tokens in `src/app/globals.css`: 13 color primitives (`@theme`); 12 tile modes on `[data-tile]` with a hover/focus flip; 12 `type-*` utilities; fluid root (A6, verbatim); spacing `--spacing-0/4/8/16/24/32/40/56/80/140`; layout tokens; base styles; `.prose-article a`. Also `src/app/styleguide/page.tsx` (dev only, `notFound()` in production), `src/app/styleguide/Computed.tsx` (a tiny client readout of live computed values) and `docs/token-log.md`.
- Changed: `globals.css` (rewritten from E0's single `--font-sans` line, which is kept); `CLAUDE.md` (E1 ticked).
- Decisions:
  - Tailwind defaults are cleared with `--color-*: initial` and `--spacing-*: initial`. The second also removes the `--spacing` multiplier, so `p-12` and `bg-gray-500` don't exist. Without it, `p-40` would be 40px but `p-12` 48px. Only our px-named steps exist, plus `--spacing-0: 0` so `p-0`/`inset-0` still work. Need another step? Add a token.
  - `--muted`, `--color-link`, `--color-link-hover` and the `--layout-*`/`--measure` tokens are plain `:root` vars (no utilities). The layout utilities (`p-tile`, `px-tile`, `py-tile`, `pt-tile-md`, `pt-tile-lg`, `gap-stack`, `gap-stack-sm`, `max-w-measure`) come from `@theme inline` aliases (`--spacing-tile*`, `--spacing-stack*`, `--container-measure`), so they read the vars at use time and switch at 767. Side effect: `m-tile`, `gap-tile-md` and so on also exist.
  - `[data-tile]` paints itself (`background-color: var(--tile-bg); color: var(--tile-fg)`), so a mode change recolors the element with no classes needed. `fg-muted` (via `calc(var(--muted) * 100%)`) and `line` (12%) default from `fg` on `[data-tile]`; each mode only sets bg and fg, plus overrides: sage/signal/slate muted = fg, and 20% lines for sage, signal, ink, navy, slate.
  - All tile rules are in `@layer base`, so utilities on a tile element win over the mode's `color`/`background-color`.
  - Hover flip sets `--tile-bg: var(--tile-hover-bg)` (mint everywhere; mint and signal set it to their own bg, since A3 says "none") and fg/muted/line to mint's values. The transition is on `background-color` and `color` of the tile only: children that set their own `color: var(--tile-fg-muted)` switch instantly rather than fading. Fine for now; registering the vars with `@property` would fix it if it looks wrong in E4.
  - Weights follow Part A: 600 for display/heading, 500 for ui-*, 400 for text-* (the audit's 500 is superseded). Line heights are written as Figma's px pairs, e.g. `calc(42 / 38)`.
  - The `.prose-article` link hover is paired with `:focus-visible`. Underline 1px at a 3px offset, 2px on hover (A5, in px, not the audit's em values).
  - Tailwind's own `sr-only` exists, so no custom one.
- Verified:
  - `npm run lint` clean, `npm run build` passes, and Prettier is clean. In the production build, `/styleguide` prerenders as the 404 page.
  - Playwright on dev (script kept outside the repo):
    * at 1440: root 16px, `type-display-h2` 66px with −2.31px tracking (−0.035em) at weight 600, `type-text-article` 20px/32px;
    * at 1280: root 14px;
    * at 390: tile padding 24px;
    * spacing bars at 4…140px exactly;
    * navy interactive tile: hover and keyboard focus both flip it to mint bg, ink fg and ink 72% muted; focus outline 2px solid ink, 3px offset; transition 0.3s ease-out, 0s under reduced motion;
    * axe: 0 violations on `/styleguide` at 1440 and 390.
  - Compiled with Tailwind's compiler: every requested utility generates; `p-12`, `bg-gray-500` and `text-link` don't.
  - Screenshots: `screens/e1/styleguide-1440.png`, `styleguide-390.png`.
  - Eclipse parity: in Chrome, measured inside same-origin iframes at exact widths. **1440, 1366, 1280 and 1024 match Eclipse exactly** (root 16 / 15.075 / 14 / 14px; h2 66 / 62.18 / 57.75 / 57.75; h4, h5, text-large and text-medium sizes; tile padding 40 / 37.7 / 35 / 35).
- Open for next prompt:
  - **Parity gap at 768–991 (needs Joey's call; no token changed).** A6 resets the root to 16px at ≤991, but Eclipse pairs that with a type step-down at the same breakpoint (h2 40, h4 20, h5 16, text-large 20, text-regular 15, tile padding 20). We have the root jump without the step-down, so our type *grows* as the window narrows from 1024 (h2 57.75) to 991 (h2 66). Options:
    1. add a ≤991 tier to the display/heading utilities (new values, also needed in Figma);
    2. keep the root at 14px down to 768 (deviates from A6, matches the 1024 sizes);
    3. leave it for E6's tablet pass.
  - Under 767, type is still desktop size (h2 66px at 390; Eclipse 34). E6 owns the mobile scale. Tile padding at 390 is 24 (Part A) vs Eclipse 20; Part A wins.
  - The A6 root uses `vw` between 1281 and 1919, so it mostly ignores a user's browser default font size (the audit's 1.4.4 note). Check zoom in E7.
  - The Figma MCP wasn't used (E1 has no frame to compare against).

## E1.1: Tablet type step, fluid-root floor, hover fade · 2026-10-02
- Built: `tests/scaling.spec.ts` measures root, tile padding and every `type-*` size and line height on `/styleguide` at 1920, 1440, 1366, 1281, 1280, 1024, 992, 991, 768, 767 and 390, prints the table, and fails if any value grows as the width shrinks or if text-article drops under 18px. It runs in the 1440 project only (it sets its own widths), so `test:e2e` reports 4 skips.
- Changed:
  - `src/app/globals.css`:
    * every `type-*` utility gets a nested `@media (max-width: 991px)` size (and line height for h3, h4 and text-large);
    * text-article becomes `max(1.25rem, 18px)`;
    * `--layout-tile-pad: 24` moves to its own ≤991 block;
    * the root becomes `max(0.875rem, calc(-0.125rem + 1.25vw))`;
    * `--tile-bg/fg/fg-muted/line` are `@property`-registered colors, and the interactive tile transitions those four instead of `background-color`/`color`;
    * `:root` sets `--tile-fg: ink`, because a registered var always has a value, so `:focus-visible` dropped its `var(--tile-fg, ink)` fallback.
  - `docs/build-prompts.md`: A3 hover bullet (fade), A5 (≤991 column and note), A6 (formula and note), A7 (tile-pad from ≤991).
  - `docs/token-log.md`: five lines.
- Decisions:
  - **Joey chose two things in-session.** (1) text-article gets an 18px floor everywhere, because 18 at ≤991 contradicted "≤ its 1024 size" (17.5). (2) The body and UI styles step down too, not only display and h4: the root jump made all 12 styles grow at 991.
  - **Eclipse values used (live at 990; root 16):** h1 60 (lh 1), h2 40/40, h3 32/36.8 (1.15), h4 20/26, h5 16/22.4, text-size-large 20/26, text-size-medium 15/19.5, text-size-regular 15, pad-medium 20. The stylesheet's 991 rules agree. We keep our em tracking and weights, use 36 for h3 (≤ 36.75 at 1024), 18 for text-medium (approved, not Eclipse's 15) and 24 for tile padding.
  - **Chrome quirk:** a 991px iframe inside the archive page doesn't match `(max-width: 991px)` (subpixel width), so the 990 values were read there. Playwright at an exact 991 viewport does match.
  - **Hover fade:** went with `@property`, because the hover flip already changed all four vars. Everything that reads the tile vars now fades with the background: text, muted, lines, `border-tile-fg`, icons via currentColor and the focus outline. Explicit transitions would have needed per-utility rules and reduced-motion overrides.
- Verified:
  - `npm run lint` clean; Prettier clean; `npm run build` passes; `npm run test:e2e`: 6 passed, 4 skipped.
  - **Scaling test:** passes. Mutation check: removing the h2 step makes it fail with "display-h2: 57.75 at 992 → 66 at 991".
  - **Root at the 16px default:** 14.0125 / 15.075 / 16px at 1281 / 1366 / 1440, the same as the old formula.
  - **Root at a 20px default** (CDP `Page.setFontSizes`): 17.5px at 1366, up from 15.075.
  - **Hover fade:** a navy tile at 120ms reads bg `rgb(138,179,163)` and fg `rgb(86,86,89)`, with the muted child mid-fade; it reaches mint and ink by 520ms; under reduced motion it's 0s and immediate.
  - **Focus outline outside a tile:** 2px solid ink.
  - **axe:** 0 violations on `/styleguide` at 1440, 991 and 390.
  - **Screenshots:** `screens/e1.1/styleguide-{1440,991,390}.png`.
- Open for next prompt:
  - **E6's mobile table (Part B) now conflicts with the "never grows" rule:**
    * text-article 18/30 vs 18/28.8 at ≤991;
    * display-h2 40/42 vs 40/40;
    * heading-h5 18/24 vs 16/22.4;
    * text-large 20/28 vs 20/26.

    `tests/scaling.spec.ts` will fail on those at 767. E6 needs Joey's call: relax the test for line heights, or revise the table.
  - **Under a non-16px browser default,** text-article can grow slightly at 991. At a 20px default it's 21.875 at 992 and 22.5 at 991, because the 18px floor is fixed px while the ≤991 value is 1.125rem. Not tested; check in E7's zoom pass.
  - **Other layout tokens** (tile-top-md, tile-top-lg, stack) still grow from 992 to 991 (for example, 70 → 80) because of the root jump. They aren't part of the test; they switch at 767 per A7.
  - **The Figma frames need the ≤991 values** (token-log lines marked "carry to Figma").

## E1.2: Layout tokens at ≤991, small-text floor · 2026-10-02
- Built: nothing new.
- Changed:
  - `src/app/globals.css`: `--layout-tile-top-md` (56), `--layout-tile-top-lg` (80) and `--layout-stack` (16) move into the ≤991 block next to tile-pad; the ≤767 layout block is deleted, since it held only those three. `type-text-small` and `type-ui-label` get `max(…, 13px)` at both tiers.
  - `tests/scaling.spec.ts`: also measures tile-pad, tile-top-md, tile-top-lg and stack at all 11 widths, through a probe div with `padding-top: var(--layout-*)`, because tile-top-lg isn't used on `/styleguide`. tile-pad was read from `main` before. Asserts text-small and ui-label are ≥ 13 everywhere.
  - `docs/build-prompts.md`: A5 (13px floor note; text-small and ui-label ≤991 row 13 / 18.6) and A7 (the layout column is now "≤ 991", plus a note).
  - `docs/token-log.md`: two lines, marked "carry to Figma".
  - `CLAUDE.md`: E1.1 and E1.2 ticked. The E1.1 line was missing from Progress, though its handoff entry was here.
- Decisions:
  - **No Eclipse values used for layout.** Live at 990 (root 16), Eclipse's `top-padding-5` reads 80 (70 at 992), so it grows at 991 the same way ours did. `pad-top-large` has no ≤991 rule and isn't on the archived home page. Eclipse has no stack equivalent (its gaps are per-component). So all three take our former ≤767 values: 56 / 80 / 16.
  - **Values at 992 → 991 (px):** tile-pad 35 → 24, tile-top-md 70 → 56, tile-top-lg 122.5 → 80, stack 21 → 16. stack-sm (8 at 1440, 7 at 992, 8 at 991) still steps up by 1px; the prompt didn't list it, so it was left alone.
  - **13px floor:** text-small and ui-label read 13 / 18.57 from about 1350 down (13.19 at 1366, 14 at 1440). Before, they were 12.25 at 992–1280 and 12 at ≤991.
  - **The `space-*` primitives still step up at 991** (for example, `space-40` 35 → 40 and `space-80` 70 → 80). That's intentional: they're rem, and they scale with the root. Components that need a value that never grows should use a layout token. Note this in E2.
- Verified:
  - `npm run lint` clean; Prettier clean; `npm run build` passes.
  - **Scaling test** (`npx playwright test tests/scaling.spec.ts --project=1440x900`): passes; the table covers all 11 widths. Mutation check: removing the ≤991 stack step fails it with "stack: 21 at 992 → 24 at 991" (file restored).
  - **axe:** 0 violations on `/styleguide` at 1440, 991 and 390.
  - **Screenshots:** `screens/e1.2/styleguide-{1440,991,390}.png`.
  - **Eclipse:** read in Chrome via a same-origin iframe at 1024 / 992 / 990, plus its ≤991 stylesheet rules.
  - **Not run:** the full `test:e2e` suite, a keyboard walk and a Figma compare (no component or markup changes).
- Open for next prompt:
  - The E1.1 open items still stand: E6's mobile table vs the no-growth rule; text-article at a non-16px browser default; the Figma frames need the ≤991 values.
  - Figma needs the E1.2 lines too: the layout ≤991 values and the 13px floor.
  - stack-sm's 1px step at 991 (7 → 8) if Joey wants it held.

## E2: Shell components (Tile, ActionRow, Pill, Topbar, Footer, NewsletterBand, layout) · 2026-10-02
- Built:
  - `src/components/`: `Tile.tsx` (exports `TileMode`), `ActionRow.tsx`, `Pill.tsx`, `Topbar.tsx`, `Footer.tsx`, `NewsletterBand.tsx` (the only `"use client"`), `SiteEnd.tsx`.
  - `src/app/tracker/page.tsx`: the stub page.
  - `tests/shell.spec.ts`: on /tracker at all 5 projects, checks axe, the exact tab order with a 2px solid outline at every stop, nav targets ≥ 24px, no horizontal scroll at the project width and at 320, and the submit announcement.
- Changed:
  - `src/app/globals.css`, in `:root`: `--logo-topbar` (165), `--logo-footer` (648), `--nav-cols` (192 / 199 / 192 as `minmax(0, …)`), `--footer-cols` (`calc(50% + 7rem) minmax(0, 1fr)`) and `--disclaimer` (35rem). Also a base rule, `[data-tile]:focus-visible { outline-offset: -8px }` (A9's inset on tiles, which E1 didn't implement).
  - `src/lib/site.ts`: `NAV_LINKS`, shared by Topbar and Footer.
  - `src/app/layout.tsx`: the skip link.
  - `src/app/styleguide/page.tsx`: a Components section (Pill and the three ActionRow variants, on paper and ink).
  - `CLAUDE.md`: E2 ticked.
- Decisions:
  - **The newsletter label and status use `type-display-h3`, not heading-h4 (Joey's call this session).** heading-h4 is 21px at 1024–1280 and 20px at ≤991, and paper on signal (3.5:1) needs ≥ 24px. display-h3 never drops below 32px.
  - **`<main>` lives in each page, not in the layout:** `<Topbar/>`, then `<main id="main" tabIndex={-1} className="outline-none">`, then `<SiteEnd/>`. If the layout wrapped children in `<main>`, the header and footer would sit inside it, lose their banner and contentinfo roles, and the skip link would skip nothing. The layout holds only the skip link. E4 and E5 must copy this structure.
  - **Tile doesn't add `bg-tile`/`text-tile` classes.** `[data-tile]` already paints both in the base layer, and adding them as utilities would beat a caller's `className` color (E1's design). Tile spreads other HTML attributes (used for `aria-labelledby`). The `top` prop maps `none`/`md`/`lg` to `pt-0`/`pt-tile-md`/`pt-tile-lg` over the default `p-tile`.
  - **The input and button are mode blocks via the `data-tile` attribute, not `<Tile>`.** The input is `data-tile="paper"`, so its placeholder is `text-tile-muted` (ink 72%). The button is `data-tile="ink" data-interactive`, so hover and focus flip it to mint/ink with the 300ms fade and reduced motion for free. The band itself is `<Tile mode="signal">` with `[--tile-fg:var(--color-paper)]`, so its muted, line and focus outline all follow paper.
  - **Nav order is row-major:** Articles, Privacy Policy, Joey Holzman ↗, Bill Tracker, Accessibility, in both Topbar and Footer. The footer grid is `grid-cols-3`, so the columns come out as the prompt lists them.
  - **The current page comes from a `current` prop** on Topbar (`aria-current="page"` plus an underline), which keeps it a server component.
  - **Routes:** Articles → `/`, Privacy Policy → `/privacy`, Accessibility → `/accessibility`. **The last two don't exist yet (404).**
  - **The footer's right group is at x 832 exactly at 1440,** via `--footer-cols`: 50% of the content box + 7rem, and the symmetric padding cancels out. Link columns are equal thirds with an 8 gap, at 832 / 1024 / 1216 (Figma 832 / 1014 / 1203). Rows are 28 + `gap-y-32` = 60 apart (Figma 61). Below `lg` (1024) the footer stacks: logo, links, disclaimer. The logo has `max-w-full`.
  - **Topbar:** the row is `flex-wrap`, `justify-between`, `min-h-80` (not a fixed 80, so it can wrap). The nav drops below the logo when it doesn't fit (≤ ~860) and shrinks via the `minmax(0, …)` columns. Nav items are 37px tall at 1440 (line, 8, then a 28 line height), so two rows plus the 8 gap make 82, not 80.
  - **Form gap is `gap-stack` (24, and 16 at ≤991), not Figma's 21:** no 21 token exists. The input/button row is `flex-wrap`, so Submit wraps under the input on narrow screens.
  - **Pre-launch form:** `action="#" method="post"`. `next start` and `next dev` both answer POST /tracker with 200, and POST keeps the email out of the URL (GET put `?email=` in the address bar). JS prevents the submit and writes "Signups open soon." into the `aria-live="polite"` paragraph.
  - **Tracker robots:** `{ index: false, follow: SITE_LIVE }`. A page's robots replaces the layout's, and a plain `{ index: false }` dropped the pre-launch `nofollow`.
  - Pill has `w-fit`, so it never stretches in a flex column.
  - **Copy:** the prompt's chrome strings (disclaimer, newsletter heading, label, button) are inline in the components. I read "never hardcode copy" as aimed at Figma placeholder text. If Joey wants them in `site.ts`, that's a small move.
- Verified:
  - `npm run lint` clean; Prettier clean; `npm run build` passes (`/tracker` static); `npm run test:e2e`: 31 passed, 4 skipped (the scaling test runs in 1440 only, and passes).
  - **Keyboard order:** skip link, logo, 5 nav links, email, Submit, then 5 footer links, each with a 2px solid outline. The skip link and Submit use an inset outline, and Submit flips to mint with an ink outline.
  - **axe:** 0 violations on /tracker at 1440, 1280, 1024, 768 and 390.
  - **Nav targets:** ≥ 31px tall.
  - **No-JS:** submit reloads /tracker and the page renders. The built `/tracker` HTML has `<meta name="robots" content="noindex, nofollow">`.
  - **Screenshots:** `screens/e2/`, with tracker-{1440,1024,991,768,390}, focus-{skip,nav,submit,footer}-{1440,390}, newsletter-status-{1440,390} and styleguide-components-1440.
  - **Hydration warning seen in the screenshot script only:** Playwright's caret hiding adds `style="caret-color: transparent"` to the input before hydration. Wait for `networkidle` and use `caret: "initial"` before screenshotting inputs.
  - **Eclipse parity:** Chrome on the archive via iframes at 1440, 1280, 1024, 990, 768 and 390; ours measured in Playwright at 1440, 1366, 1280, 1024, 991, 768 and 390. Both scale every shell value with the root from 1440 to 1024 (e.g. input height 90 → 78.7 for us vs 78 → 68.3 for Eclipse; H2 66 → 57.75 on both). Our sizes differ from Eclipse's by design (Figma: input font 38 vs 32, nav font 20 vs 18, footer links 20 vs 16). **No token changes.**
  - **Figma MCP:** not authenticated (only the `authenticate` tool was available), so no frame compare. Part A values were used.
- Open for next prompt:
  - **Rem sizes still grow at the 991 root jump:**
    * logo 144 → 165;
    * nav width 552 → 615;
    * the newsletter input 78.7 → 84 (`px-40`/`py-24` are primitives);
    * the footer logo 567 → 648.

    Eclipse's input shrinks there. Hold them, or leave them for E6? That's Joey's call.
  - **Mobile (E6):**
    * input text at 32px clips the placeholder at 390;
    * "Joey Holzman" wraps in the nav and the footer;
    * the nav stays 3 columns (E6 wants 2, in the order Articles, Privacy / Bill Tracker, Accessibility / Joey; that needs explicit placement or a DOM reorder);
    * the footer stacks below 1024.
  - `/privacy` and `/accessibility` don't exist.
  - The Topbar `home` variant's children slot is ready for E4's statement.
  - The skip link uses `z-50` (a Tailwind default, not a token).

## E3: Content model (built around the imported articles) · 2026-10-02
- Built:
  - `src/lib/categories.ts`: `CATEGORIES`, keyed by the frontmatter label, each `{ label, slug, headerMode }` (A4); `Category` type.
  - `src/lib/dates.ts`: `isoDate` (zod: a YAML Date or a YYYY-MM-DD string → YYYY-MM-DD) and `formatDate` ("Oct 1, 2026", in UTC). Shared by bills, posts and pages.
  - `src/lib/bills.ts`: zod-parses `content/bills.json` and `content/bill-stats.json` at import. `getBills(ids)` throws on an unknown id. Also `sponsorLine`, `statusLine` and `getBillStats`. It `console.warn`s at import while `placeholder: true`.
  - `src/lib/posts.ts`:
    * `postFrontmatter` (a zod `strictObject`);
    * `parseFrontmatter(schema, file, source)`, which throws "<file>: invalid frontmatter" plus zod's field path;
    * `getAllPosts`, `getPost`, `getFeaturedPost` and `compileMdx(body)`.

    Every post is read and validated once at import, bill ids included, so any route that imports posts.ts fails the build on a bad post.
  - `src/lib/pages.ts`: `getPage(slug)` returns `{ title, description, updated, body }`.
  - `src/components/Chart.tsx`: a `<figure>` with:
    * the title in heading-h4;
    * the summary in text-regular;
    * a real `<table>` in text-regular, with an sr-only `<caption>` equal to the title, `border-tile-line` row lines, the first cell of each row a `th scope="row"`, and all-number columns right-aligned with `tabular-nums`;
    * a figcaption, "Source: <link>", in text-small.
  - `src/app/accessibility/page.tsx` and `src/app/privacy/page.tsx`: Topbar (article variant, with `current`); a paper Tile holding the h1 (display-h2), "Updated <time>" (heading-h5, muted) and the body, all in `mx-auto max-w-measure`; then `<SiteEnd />`. The `<main>` matches /tracker.
  - `content/bill-stats.json`: the placeholder numbers, as given.
  - `src/lib/content.test.ts`, `vitest.config.mts` and `npm run test:content`. The test checks that:
    * all 6 posts validate;
    * every referenced bill id exists;
    * each post compiles and renders;
    * a post missing a category fails, naming the file and "category".
- Changed:
  - `src/mdx-components.tsx`: the A5 element map (see Decisions), plus `Chart` and `D3Chart`.
  - `src/app/globals.css`: `--spacing-12` (logged in token-log.md).
  - `package.json`:
    * `@mdx-js/mdx` ^3.1.1 (Joey approved it this session; it was already installed under `@mdx-js/loader`);
    * `vitest` ^4.1.11 as a dev dependency (v5 conflicts with the project's `@types/node@20`);
    * the `test:content` script.
  - `CLAUDE.md`: E3 ticked.
  - No content file was edited. `content/_fixtures` didn't exist.
- Decisions:
  - **MDX is compiled with `@mdx-js/mdx` `evaluate()`, not through `@next/mdx` imports.** The `@next/mdx` loader doesn't understand YAML frontmatter: it would render `---` plus the YAML as an `<hr>` and a setext h2. So gray-matter strips the frontmatter, and `compileMdx` evaluates the body with `useMDXComponents`. `@next/mdx` stays in next.config, but the content doesn't use it. E5's article route should use `compileMdx(post.body)`.
  - **`<D3Chart>` renders nothing.** The TAKE IT DOWN post nests one inside `<Chart>`, and MDX throws on an undefined component. The prompt says no chart library, so mdx-components maps it to `() => null`, and Chart ignores its children.
  - **The Chart caption is `sr-only`.** The visible title is the heading-h4 line above the summary, so a visible caption would repeat it. The source link has no ↗, matching body links, since it sits in the body.
  - **Body styles:**
    * The wrapper is `.prose-article space-y-24 type-text-article`, so p and li need no mapping.
    * h2 is display-h3 with `mt-32`. Margins collapse with the 24, which gives 32 above and 24 below.
    * h3 isn't specified in A5 and isn't used yet: heading-h4 with the same spacing.
    * ul/ol: `pl-24 space-y-12`, with markers in `text-tile-muted`.
    * blockquote: `border-l-2 border-tile-fg pl-24 space-y-24`, upright.
    * strong is `font-semibold`; em is `font-normal italic`.
    * Links: `http(s)` hrefs become `<a rel="noopener">`; anything else uses `next/link`.
  - **Frontmatter is strict:** an unknown key fails the build, so a typo like `editorNote:` can't silently drop. `editorNotes`, `sources` and `image` stay optional (not defaulted), per the prompt; `bills` defaults to [].
  - **Drafts** are excluded only when `NODE_ENV === "production"`. `getFeaturedPost()` returns the first `featured: true` post, else `getAllPosts()[0]`. So the draft TAKE IT DOWN post is featured in dev (and in vitest), and the States post is featured in production. `getPost(draftSlug)` is undefined in production, so E5 should call `notFound()`.
  - **Reading minutes** count the whitespace-separated tokens of the raw body (JSX props, URLs and `{/* */}` comments included), divided by 230 and rounded up.
  - **Static page spacing** (no Figma frame exists): h1 to "Updated" is `mt-stack`, and "Updated" to the body is `mt-tile-md`.
  - **The status line** follows the format given, so it reads, for example, "Became law May 19, 2025 as of Oct 1, 2026".
  - **The placeholder warning prints once per build worker** that loads the content layer (3× in `next build`). In E3 it comes from /accessibility and /privacy, which import posts.ts for `compileMdx`.
- Verified:
  - `npm run lint` clean; Prettier clean.
  - `npm run build` passes and prints the bill-stats warning; /accessibility and /privacy are static.
  - `npm run test:content`: 9/9 pass. `npm run test:e2e`: 31 passed, 4 skipped (unchanged).
  - **Build mutations** (a temporary post, deleted afterward); both fail the build:
    * no category: "content/posts/zz-temp.mdx: invalid frontmatter ✖ Invalid option … → at category";
    * `bills: ["hr9999-119"]`: "content/posts/zz-temp.mdx: Unknown bill id "hr9999-119"".
  - **Posts** (dev): see the table in the E3 report. Production returns 5 posts (the draft is dropped).
  - **Pages** (production build, Playwright at 1440, 1366, 1280, 1024, 991, 768 and 390):
    * at 1440: the h1 is 66px at x 400–1040 (the measure); "Updated" is 20px at ink 72%; the body is 20/32; h2 is 38px with 32 above and 24 below; list markers are ink 72%; external links have `rel=noopener`;
    * axe: 0 violations at 1440, 991 and 390 on both pages;
    * no horizontal scroll at any width, or at 320;
    * keyboard: skip link, logo, 5 nav links, the body link(s), email, Submit, then 5 footer links, each with a 2px solid outline.
  - **Screenshots:** `screens/e3/{accessibility,privacy}-{1440,1366,1280,1024,991,768,390}.png`.
  - **Not done:**
    * a Figma compare (these pages have no frame, and the MCP isn't authenticated);
    * an Eclipse parity check in Chrome (no tokens were retuned; the only token change is the new 12 step).

    The Chart has no route yet, so only the vitest render checks it.
- Open for next prompt:
  - **Body spacing grows at 991.** From 1024 to 991, p→p goes 21 → 24 and the h2 gap 28 → 32, because they use the `space-*` primitives as A5 specifies; the text itself holds at 18. If Joey wants no growth, switch the paragraph gap to `stack` (24 → 16) and add a layout token for 32.
  - **Chart:** its first real render is in E5. Run axe on it there, and decide whether the title line should be a heading.
  - **Placeholders left as they are:** `[EMAIL]` (accessibility.mdx:59, privacy-policy.mdx:37), `[TEST DATE]` (accessibility.mdx:35) and both pages' BEFORE PUBLISHING comment blocks.
  - **TODO(joey), by file:line:**
    * `content/bills.json:2`: verify every status on Congress.gov and update asOf.
    * `content/pages/accessibility.mdx:4`: set updated to the day the tests are run.
    * `content/pages/privacy-policy.mdx:4`: set updated to the go-live day. `:10`: replace [EMAIL].
    * `comparing-the-ai-policies…mdx`: `:3` verify the dek; `:4` the real publish date.
    * `house-representatives…deepseek.mdx`: `:3` verify the dek; `:4` the real publish date.
    * `rep-bilirakis…mdx`: `:3` verify the dek; `:4` the real publish date; `:10` verify the status on Congress.gov (editor note date).
    * `rep-french-hill…mdx`: `:2` the title comes from the filename; `:3` verify the dek; `:4` the real publish date.
    * `states-taking-the-lead…mdx`: `:3` verify the dek; `:4` the real publish date. Missing links at `:12` (the Executive Order), `:14` (Nelson Mullins), `:16` (the IAPP tracker), `:20` (AB 1018), `:26` (SB 2) and `:32` (HB 1709).
    * `what-the-take-it-down-act…mdx`: `:7` verify every fact before removing `draft`; `:67` re-check the GovTrack cosponsor counts; `:71` link the specific EFF analysis. Its second editor note (`:15`, not a TODO) says "Example correction for design review only. Delete before publishing."

## E4: Home (HomeNew) · 2026-10-02
- Built:
  - `src/app/page.tsx`, top to bottom: Topbar (home) with the h1 statement; the amber bill band (`<section>`, the `<dl>` stats, "Open the bill tracker"); the featured band (an ink tile beside the image); the "More analysis" grid; `<SiteEnd />`.
  - `src/components/PostMeta.tsx` (the pill and date row: featured, grid, and E5's header), `src/components/PostTile.tsx` (the grid tile; E5's "More analysis" should reuse it) and `src/components/StickyFit.tsx` (the only new `"use client"`; it renders nothing).
  - `tests/home.spec.ts`. At all 5 projects it checks: axe; the tab order, with a 2px ring at every stop and nothing covering it; one link per tile; hover and focus flipping tiles to mint with ink text; no horizontal scroll down to 320; reduced motion; no-JS. At 1440 only, it checks the cascade and the covered-nav focus case, plus that the fit guard turns sticky off.
- Changed:
  - `src/components/Topbar.tsx`: the home variant gets `data-sticky`, `z-0 focus-within:z-3` and `pb-stack`. The article variant is unchanged (never sticky).
  - `src/app/globals.css`:
    * the `[data-sticky]` rules (relative; sticky at top 0 only with `data-fits` inside the 768w / 640h / no-reduced-motion media query);
    * the `link-stretched` utility (the title's `::after` covers the tile; the focus ring draws there, 2px `tile-fg`, inset 8);
    * the tokens `--band-featured`, `--post-tile`, `--dek` and `--statement-top`, plus ≤991 values for the first three.
  - `docs/token-log.md`: two lines. `CLAUDE.md`: E4 ticked.
- Decisions:
  - **Sticky: a two-stage cascade (Joey's call this session; it replaces the single wrapper):**
    * the Topbar is sticky at z 0, the bill band sticky at z 1, and everything after it is `relative z-2` (one div inside `<main>`, one around SiteEnd);
    * `focus-within:z-3` on both sticky layers;
    * landmarks are unchanged: the header sits outside `<main>`, and the bill band is the first thing inside it;
    * `StickyFit` marks each `[data-sticky]` element `data-fits` when its own height ≤ `innerHeight` (a ResizeObserver per layer, plus window resize). Without JS nothing is marked, so nothing sticks.
    * E5's rail can reuse it: add `data-sticky` and render `<StickyFit />`.
  - **Statement top: `--statement-top: calc(var(--layout-tile-top-md) - 1lh + 1cap)`**, which is tile-top-md minus one line's trim (80 − 18.3 = 61.7 at 1440). Figma's box is at 173; with Switzer's metrics (ascent 0.985, cap 0.723) its cap top is 182.3. Ours lands at 183.7, and our nav row is 82, not 80. It scales with the type at every width.
  - **Start-only trim, twice** (`[text-box:trim-start_cap_alphabetic]`): on the h1 (Figma's 24 below is measured from the untrimmed box, so the topbar is 264.4 vs Figma 266) and on the stat `<dd>` (Figma's 8 runs box to box, so the label sits 20.5 under the number's baseline, as in Figma).
  - **"Stats start 140 below the header" is read as 140 from the header's top:** a `min-h-tile-lg` header row, not a 140 margin. In Figma the heading box top and the stats are 138 apart, and the stats-to-source gap is about 110. A margin made the band 551; the min-height gives 517 (Figma 519). The row still grows if the header wraps or text spacing is overridden. The ActionRow is `mt-tile-lg` below the labels.
  - **Stats grid:** `-mx-tile` with `px-tile` cells, so the columns are true quarters and the stats sit at 40 / 400 / 760 / 1120. 2 columns below 768 (a placeholder for E6).
  - **Featured:** the h2 holds the stretched link; `md:min-h-(--band-featured)`, a min-height so text never clips. The image is `next/image` `fill` + `object-cover` in a `relative` cell, so the text tile sets the height. With no post image it uses `placeholder.svg` with `alt=""`, and below 768 the cell is `aspect-video` after the text (E6 refines). The title uses `text-tile`, not a fixed paper, so it flips to ink on hover.
  - **Grid tiles:** `<article>`; `border-b border-tile-line md:odd:border-r`; an odd last tile spans 2 columns with no right line. Dev has 5 grid posts (the draft is featured), so the last one spans; production has 4 (States is featured).
  - **Links go to `/posts/<slug>` (E5's route, 404 until then).** No post has `featured: true`, so the newest non-draft post is featured.
  - **Copy:** the statement, the four stat labels and "More analysis" are inline in page.tsx (the prompt's strings, like E2's chrome copy). The bill heading and source line come from bill-stats.json.
- Verified:
  - `npm run lint` clean; Prettier clean; `npm run test:content` 9/9; `npm run build` passes (`/` is static); `npm run test:e2e`: 69 passed, 16 skipped (the 1440-only checks).
  - **Mutation checks:**
    * without the Topbar's `focus-within:z-3`, the covered-nav test fails;
    * with sticky swapped to relative, the cascade test fails;
    * both files restored.
  - **Production build (`next start`):** axe 0 at 1440, 1280, 991 and 390; 4 tiles with 1 link each; `noindex, nofollow`.
  - **Measured at 1440 (Figma in brackets):** topbar 264.4 (266); statement cap top 183.7 (182.3); bill band 517 (519); number cap tops 180 (184.5); stats x 40 / 400 / 760 / 1120 (quarters, per the prompt); featured 807 (807); grid tiles 354 (354).
  - **Keyboard:** skip link, logo, 5 nav links, "Open the bill tracker", the featured title, the grid titles, email, Submit, 5 footer links. Every stop has a visible 2px ring and is the topmost element at its own position. Tabbing to a nav link while the bill band covers the topbar raises the topbar to z 3; tabbing to "Open the bill tracker" while the featured band covers it raises the bill band.
  - **Hover and focus:** the featured and grid tiles go to mint `rgb(194,252,211)` with ink text.
  - **Reduced motion and no-JS:** both layers `relative`.
  - **Screenshots:** `screens/e4/`:
    * home-{1440,1280,1024,991,768,390};
    * home-prod-1440;
    * cascade-{1,2,3}-1440;
    * focus-{1-nav-while-covered,2-bill-tracker,3-featured,4-grid-tile}-1440;
    * hover-grid-tile-1440;
    * figma/ (home, topbar, bill-band from the MCP).
  - **Figma MCP:** connected this time; screenshot and metadata of 2076:2212.
  - **Eclipse parity** (Chrome, same-origin iframes at 1440 / 1366 / 1280 / 1024 / 990 / 768 / 390; ours in Playwright at the same widths plus 992 / 991):
    * both scale bands with the root from 1440 to 1280 (ours: featured 807 → 706; Eclipse open-positions 492 → 431);
    * hover: both 0.3s (ours ease-out, on the four tile vars);
    * Eclipse's hero is sticky at top 0, z 1, at every width, with no motion or height guard (ours is guarded, per A9).
    * **One token change:** at 991 our featured band and tiles grew back to their 1440 values (706 → 807, 328 → 354) while Eclipse's half band shrinks (431 → 400). Held at the 1024 size, rounded down: 704 / 308 / 428 (dek). Logged.
- Open for next prompt:
  - **Figma mismatches left as they are:**
    * the nav row is 82, not 80 (E2);
    * the featured title's cap top is 9px higher than Figma's (the prompt's 24 is measured from the trimmed cap top; Figma's 24 is to the untrimmed box);
    * the bill heading's cap top is at 40 (Figma 43.5) and the action-row line at 437 (Figma 429);
    * the last stat isn't navy (A1); the stat labels, statement casing and post titles are real copy, not Figma's placeholders;
    * the image is the placeholder (no post images);
    * the newsletter shows its "Email address" label (E2).
  - **In production, Next's prefetch of `/posts/<slug>` never resolves** (the route doesn't exist), so Playwright's `networkidle` times out against `next start`. E5's route should end it; recheck there.
  - **In dev,** Next's dev-tools badge sits over the footer's "Articles" link at 390. `home.spec.ts` ignores `nextjs-portal` hits.
  - **Mobile (E6):**
    * the featured band below 768 (aspect-video image after the text);
    * stats in 2 columns;
    * `--band-featured` and `--post-tile` have no ≤767 values;
    * the h1 wraps to 2 lines at 1024 (topbar 289).
  - **Real post images** will go through the next/image optimizer; remote sources need `images.remotePatterns`.
  - Set `featured: true` on a post if Joey wants to choose it rather than defaulting to the newest.
  - The E3 TODO(joey) list is unchanged; no content file was touched.

## E5: Article · 2026-10-02
- Built:
  - `src/app/posts/[slug]/page.tsx`:
    * `generateStaticParams` (from getAllPosts, so drafts aren't generated in production);
    * `dynamicParams = false`;
    * `generateMetadata` (the title as "<title> · AI in Congress", the dek as the description);
    * `notFound()` for unknown slugs.

    Top to bottom: Topbar (article), the header Tile (mode from `CATEGORIES[category].headerMode`), the figure, editor's notes, the body + rail grid, Sources, then `<SiteEnd />`.
  - `src/app/posts/[slug]/Rail.tsx`: the `<aside aria-labelledby="rail-heading">`: an amber cap, a stone body, one block per bill.
  - `tests/article.spec.ts`:
    * **For all 6 posts, at all 5 projects:** axe, and no horizontal scroll.
    * **At 1440 only:**
      * header text is full-strength tile fg and the back link is ≥ 4.5:1 (all 6 headers);
      * the heading outline;
      * the rail is docked from 75% to the right edge, 80 from the text, with its top level with the first paragraph;
      * the rail is sticky at exactly its height + 80 and relative at + 79;
      * below 1280 the rail scrolls away and sits before the article;
      * there's no aside without bills.
    * **At all 5 projects:** the keyboard walk (a 2px outline at every stop, nothing covered).
    * Reduced motion, and no-JS.
- Changed:
  - **Carry-over (MDX):**
    * Removed `@next/mdx`, `@mdx-js/loader` (only `@next/mdx` used it) and `@mdx-js/react` from package.json, and the `createMDX` wrapper from `next.config.ts`. Nothing imports `.mdx` files directly.
    * Kept `src/mdx-components.tsx` (`compileMdx` passes its `useMDXComponents`), `@mdx-js/mdx` and `@types/mdx` (for `mdx/types`).
    * The article body uses `compileMdx(post.body)`.
  - **Carry-over (prose em):**
    * `globals.css` gets `@property --prose-em`, registered as a `<length>`, so `1em` computes on `.prose-article` and inherits as px. A plain em on an h2's margin would resolve against the h2's own 38px.
    * The rules: `.prose-article > * + *` and `blockquote > * + *` get 1.2em; `> :is(h2, h3):not(:first-child)` gets 1.6em; `li + li` gets 0.6em.
    * `mdx-components.tsx` drops `space-y-24`, `mt-32 first:mt-0` and `space-y-12`.
    * This also applies to /privacy and /accessibility (same values at 1440).
    * `tests/scaling.spec.ts` measures "prose p gap" and "prose h2 gap" through a probe.
  - `globals.css`: `--layout-article-gap` (60, and 52 at ≤991) and `--layout-image-overlap` (104, and 91 at ≤991), with `--spacing-*` aliases (`mt-article-gap`, `-mt-image-overlap`). Both are in the scaling test.
  - `src/components/ActionRow.tsx`: a `small` prop (a heading-h5 label) for "Track this bill".
  - `src/components/StickyFit.tsx`: reads `data-sticky-margin` (px), so a layer must fit `innerHeight` minus that margin. Home is unaffected (it sets no margin).
  - `docs/token-log.md`: two lines. `CLAUDE.md`: E5 ticked.
- Decisions:
  - **Gap mapping (Figma → what we used, px at 1440):**
    * pill → title: 29 → `stack` (24);
    * title → dek: 42 → `tile` (40);
    * back link → pill: `tile` (40), so the pill top is 112.5 from the header top (Figma 122);
    * dek → meta: `tile-md` (80; Figma 101);
    * body → Sources line: `article-gap` (60; Figma 67);
    * line → "Sources": 41 → `tile` (40);
    * "Sources" → list: 30 → 1.2em (24) via `.prose-article`;
    * between sources: 0.6em (12);
    * the list indent: 30 → `pl-[1.5em]`.
  - **The h1 and the Sources h2 are untrimmed (`[text-box:none]`).** Figma's 29, 42 and 41 run box to box; with A5's trim, the visual gaps came out 10–15px tighter than the frame. Body h2s keep E3's trim.
  - **The heading outline is h1 → rail h2 (+ bill h3s) → body h2s → Sources h2,** not the prompt's h1 → body h2s → rail h2.
    * The prompt also asks for the aside before the article in the DOM at every width, and the two can't both hold. I kept the DOM order.
    * Below 1280 the rail is visually first, and at 1280+ it sits beside the first paragraph, so reading it first is sensible.
    * No levels are skipped. Bill titles are h3 (the prompt didn't name a level).
  - **The rail is sticky only from xl (`max-xl:relative`).** A sticky grid item is bounded by the whole grid, not its own row, so below 1280 the full-width rail slid over the body and covered focused links. The keyboard test caught it at 1024 and 768.
  - **At xl, the rail shares grid row 1 with the article:**
    * the rail is `xl:col-start-4 xl:row-start-1 xl:self-start`;
    * the article is `xl:col-span-full xl:row-start-1`, with its content on `mx-auto max-w-measure`.

    So the measure stays centered on the page at every width, and the rail starts on the 75% line.
  - **Rail cap:** `p-tile pb-stack`, which makes it 95 tall at 1440 (Figma 100), with the text at the bottom and no new token.
  - **Rail dots:** an empty `before:` (16, `bg-current`), centered on the first line; dot → text is `gap-stack` (Figma 20).
  - **"Track this bill"** keeps ActionRow's `justify-between`; Figma puts the arrow right after the text.
  - **The byline uses the frontmatter `author`,** so it reads "By Joseph Holzman", not the prompt's "Joey Holzman". All six posts say "Joseph Holzman", and the footer disclaimer says "Joey". Joey's call which one.
  - **The figure and body sit on a paper `data-tile` wrapper (no padding),** because `text-tile-muted` is transparent outside a tile (it's a registered `@property`). The figure and article get `px-tile`, so their measure matches the header's at narrow widths.
  - **The meta dot is 24** (`size-24`; there's no 23 token).
  - **Editor's notes:** a stone Tile, `mt-article-gap` below the figure, with notes `gap-stack` apart. There's no gap between a note's label and its text (not specified).
  - **Sources:**
    * the section is `.prose-article type-text-article`, so it reuses the body's link styles and em rhythm;
    * links have `rel="noopener"`, like body links;
    * the ↗ is inline (`align-middle`, `ml-4`) inside the link, after the sr-only "(external site)".
- Verified:
  - `npm run lint` clean; Prettier clean; `npm run test:content` 9/9; `npm run build` passes (5 posts SSG; the draft isn't generated). `npm run test:e2e`: 129 passed, 56 skipped (the 1440-only checks).
  - **Production (`next start`):**
    * the 5 posts return 200, with axe 0 at 1440, 991 and 390;
    * titles and descriptions are right; robots is `noindex, nofollow`;
    * the draft 404s;
    * **Home's `networkidle` now resolves** (the E4 prefetch hang is gone).
  - **Dev, all 6 posts:**
    * axe 0 at 1440, 1280, 1024, 768 and 390;
    * no muted text in any header (each header's text colors are exactly `--tile-fg`), so none on slate or sage;
    * "All articles" is tile fg on every header, at ≥ 4.5:1.
  - **Measured at 1440 (Figma in brackets):**
    * the header runs 163–916.5, so 753.5 including the overlap. The Deepfakes title wraps to 3 lines on the 640 measure (Figma: 702, with 2 lines on 721);
    * the back link is at 40, 40;
    * the image is 400–1040 × 388.8 and overlaps the header by 104 (104);
    * the rail is 1080–1440, its cap text 80 from the body text, its top level with the first paragraph (1547.3);
    * the Deepfakes rail is 804 tall: sticky at 900 tall, relative below 884.
  - **Mutation checks** (both files restored):
    * without the sticky margin, the "+ 79 → relative" test fails;
    * with the paragraph gap back on rem, the scaling test fails ("prose p gap: 16.8 at 992 → 19.2 at 991").
  - **Screenshots** in `screens/e5/`:
    * deepfakes-navy-{1440,1280,1024};
    * lawmakers-volt-{1440,1280,1024};
    * header-{executive-slate,states-sage,child-safety-blush,national-security-sand}-1440;
    * sticky-rail-scrolled-1440;
    * focus-{all-articles,track-this-bill}-1440;
    * nojs-1440;
    * `figma/article.png` (from the MCP).
  - **Eclipse parity** (Chrome, same-origin iframes: Eclipse at 1440 / 1366 / 1280 / 1024 / 990 / 768 / 390; ours at those widths plus 992 / 991). Eclipse has no article page, so I compared the closest analogue, its sticky side-column h2:
    * when stuck, its text is 39.9 / 37.6 / 35 / 35 from the top; our rail's cap text is 40 / 37.7 / 35 / 35 below the rail's top (sticky top 0, plus the tile padding). They match.
    * Eclipse keeps it sticky down to 390 (top 20 at ≤990); ours stops below 1280, by spec.
    * Ours: overlap 104 / 98 / 91 / 91 / 91 and paragraph gap 24 / 22.6 / 21.6 / 21.6 / 21.6. Neither grows at 991.
    * **No token changed for parity.**
- Open for next prompt:
  - **`--measure` grows at the 991 root jump** (560 → 640), so the image and the text column widen as the window narrows. It's a pre-existing token, also used on /privacy and /accessibility. E6's tablet pass should decide; a ≤991 value of 35rem holds it at 560.
  - **Classic scrollbars:** with a 15px scrollbar, the gap from the body text to the rail text is 76.3, not 80, because the measure centers on the content box while the root uses vw. Playwright's overlay scrollbars give exactly 80. Eclipse has the same vw behavior.
  - **StickyFit in a background tab:** Chrome doesn't deliver ResizeObserver callbacks to a hidden tab, so nothing is marked until the tab renders. Home showed the same in a hidden tab. I didn't see it in a visible page; worth a manual look in E7.
  - **Figma mismatches left as they are:**
    * the pill top is 112.5 (122);
    * dek → meta is 80 (101);
    * meta → image is 40 (18): the tile padding;
    * the rail cap is 95 (100);
    * the "Track this bill" arrow sits at the end of the row;
    * the topbar is 163 (160; E2's 82px nav row);
    * no post has an image (placeholder, `alt=""`).
  - **Not built (not in Figma yet):** Copy article link; Related / More analysis tiles (reuse `PostTile`); the chart treatment (`<Chart>` still renders the summary and table, and `<D3Chart>` renders nothing).
  - **Mobile (E6):** the header, rail and Sources aren't tuned below 768, and the long titles run 3–4 lines at 40px.
  - The E3 TODO(joey) list is unchanged; no content file was touched. The TAKE IT DOWN draft still shows its "Example correction for design review only" note.

## E5.1: Home refinements (nav span + bill band layout) · 2026-10-02
- Built: nothing new. `tests/home.spec.ts` gains "ink covers the source and stats first, the tracker row last" (1440 only). `tests/scaling.spec.ts` gains "the topbar nav never grows as the window narrows" (on /tracker: link font, link height, nav width ≥ 768, nav left on the 50% line); the grow check moved into a shared `grown()` helper.
- Changed:
  - `src/components/Topbar.tsx`: the nav is `w-full md:w-1/2`, so from md it runs from the 50% line to the right inset (720–1400 at 1440). Below md it drops under the logo, full width. **The link items are exactly as in E2** (heading-h5, `items-start`, `pt-stack-sm`, `gap-x-stack gap-y-stack-sm`).
  - `src/app/globals.css`: `--nav-cols` → `repeat(3, minmax(0, 1fr))` (was 192 / 199 / 192).
  - `src/app/page.tsx`, bill band, top to bottom:
    * the header row `grid md:grid-cols-2 gap-y-stack items-start`: the h2 on the left; on the right, a `md:grid-cols-(--nav-cols) md:gap-x-stack` grid with the ActionRow at `md:col-start-3`, under "Joey Holzman ↗";
    * the `<dl>` with `mt-tile-md`;
    * the source line (heading-h5, muted) with `mt-tile-md`.

    The `min-h-tile-lg` header and the bottom ActionRow are gone. Below md the action row is full width under the heading; the DOM order is the visual order.
  - `src/components/ActionRow.tsx`: the label is always `type-heading-h5`, the nav links' type (it was heading-h4, with h5 behind a `small` prop). E5's `small` prop is removed, along with its one use in `src/app/posts/[slug]/Rail.tsx`. This changes "Read more" on the featured and grid tiles, and "Open the bill tracker". "Track this bill" was already h5.
  - `docs/token-log.md`: two lines. `CLAUDE.md`: E5.1 added to Progress and ticked.
- Decisions (Joey's mid-session calls, in order):
  1. **Nav parity was measured and built, then reverted** to E2's link styling ("revert the navlink buttons to how they were originally but keep the span"). The span and equal columns stayed. What I'd built: `type-ui-nav`, 40-tall links (a new `--nav-link` token, 40 → 35 at ≤991), `gap-x-tile` and no row gap, which gave Eclipse's 80 nav row. `--nav-link` was deleted.
  2. **"Open the bill tracker" spans one nav column, not two.** I chose the last one, so its right edge stays on the right inset.
  3. **"All of the navlink style buttons used outside of the navbar should have the same typography"** → every ActionRow label is heading-h5. **This deviates from Part A** A5, where heading-h4 is listed for action-row labels; Part A should be updated. Only the type changed: the row keeps its own `items-center` and `gap-stack`, where nav links are `items-start` with no gap.
  - **Eclipse, measured live** (Chrome, same-origin iframes at 1440 / 1280 / 1024; client width 1425 / 1265 / 1009). It matches the audit:
    * `nav_link-text` is 1.125rem / 1.11 / 500 with normal tracking (18/19.98 at 1440; 15.75/17.48 at 1280 and 1024);
    * link padding is 0.625rem 0, so links are 40 / 35 / 35 tall with row gap 0;
    * the line is an absolutely positioned 1px div (navy, opacity 1) that adds no height;
    * the columns are `1fr 1fr` with a 2.5rem gap (40 / 35 / 35);
    * the block starts at 50% + half the container's 40 gap (732.5 in 1425), not on the 50% line;
    * the ↗ is 12px, flush right, vertically centered;
    * there's no hover rule or Webflow interaction on the nav links, and focus is the UA `auto` outline.
  - **Ours vs Eclipse** (at 1440):
    * link type 20/28/600 vs 18/20/500;
    * links 37 tall vs 40, so the nav block is 82 vs 80;
    * column gap 24 vs 40;
    * ↗ 24 (A8) vs 12;
    * 3 columns vs 2 (we have 5 links);
    * our left edge is on the 50% line (720) vs Eclipse's 740.

    The span and the equal columns match Eclipse's model. No parity token change survived.
  - **Nav width grows 461 → 471.5 at 992 → 991.** The nav spans from the 50% line to the tile's right inset, and the inset steps 35 → 24 there (A7), the same step that widens every tile's content box. The scaling test exempts only that step and asserts the left edge stays on the 50% line at every width ≥ 768. Link font (17.5 → 16) and height (32.5 → 31.4) still shrink there.
  - The half grid has no column gap, so its right column starts exactly on the 50% line. Stacked below md, the heading and action row are `gap-y-stack` apart (24 / 16; not specified).
- Verified:
  - **Checks:** `npm run lint` clean; Prettier clean; `npm run build` passes. `npm run test:e2e`: 131 passed, 64 skipped (the 1440-only checks). That includes axe 0 on `/` at 1440, 1280, 1024, 768 and 390, and on every article and /tracker at all 5. The keyboard walk on Home is still skip → logo → 5 nav → "Open the bill tracker" → featured → grid → email → Submit → footer, each with a visible 2px ring; the expected order already matched. `tests/shell.spec.ts` (nav targets ≥ 24) and `tests/scaling.spec.ts` pass.
  - **Mutation check:** on the interim 40 → 35 nav-link version, removing the ≤991 value made the nav test fail ("link height: 35 at 992 → 40 at 991").
  - **Nav left edge on the 50% line:** 720 (1440), 683 (1366), 640 (1280), 512 (1024), 496 (992), 495.5 (991), 384 (768).
  - **The action row's edges equal nav column 3's:** 1189.3–1400 (1440), 1128.3–1328.3 (1366), 1057.3–1245 (1280), 844–989 (1024), 820.5–967 (991), 634.7–744 (768).
  - **The ActionRow label's type is identical to the nav link's at every width:** 20/28/600/−0.3px at 1440, 18.84 at 1366, 17.5 at 1280 and 1024, 16/22.4 at ≤991.
  - **Bill band height:** 1440 is **450.1** (was 517). Also 1366 423.6, 1280 394.3, 1024 421.4, 991 347.6, 768 369.9, 390 569.3.
  - **Featured band on first load:** at **1440×900, 185.5px** shows (was about 118.6: 900 − 264.4 − 517). At **1366×768, 94.5px** shows (was about 31, derived by scaling 517 and the header to the 15.075 root).
  - **Cascade at 1440×900:** the band sticks at scroll 264.4. Frames at 264, 340, 480, 600 and 660 show ink covering the source line, then the stats, then "Open the bill tracker" last. The new test asserts it.
  - **Screenshots:**
    * `screens/e5/nav/`: eclipse-{1440,1024}, ours-{1440,1024}, compare-{1440,1024} (Eclipse above, ours below);
    * `screens/e5.1/`: home-{1440,1366,1024,768,390}, home-1440-full, cascade-1440-{264,340,480,600,660}.
  - **No Figma comparison:** the frame predates this redesign.
- Open for next prompt:
  - **"Open the bill tracker" wraps in its one column:** 2 lines from 1440 to 991, 3 at 768. At 20px the label needs about 190, plus the 24 gap and 24 icon, and the column is 211 at 1440. This makes the band 25 taller than the two-column version (425). Options, Joey's call:
    * a shorter label ("Bill tracker");
    * drop the ActionRow's label → icon gap to match the nav links (still about 2px short at 1440);
    * accept the wrap.
  - **"Joey Holzman ↗" wraps** in the nav from 768 to about 900, and at 390. That's for E6, which already plans 2 nav columns on mobile.
  - **Footer nav left as it is** (heading-h5, mint, `grid-cols-3`, its group starting at 50% + 112 per Figma). For consistency it could start on the 50% line with `--nav-cols` and `gap-x-stack`. That's Joey's call, since Figma puts it at 832.
  - **Pre-existing:**
    * `tests/article.spec.ts:132` has a TS error (`offsetHeight` on `HTMLElement | SVGElement`). Playwright still runs it.
    * The topbar row's `min-h-80` grows 70 → 80 at 991 (`spacing-80` is rem). It's not visible, because the nav is 72 there.
  - The E3 TODO(joey) list is unchanged; no content file was touched.

## E6: Mobile first pass (≤767), plus tablet sanity checks · 2026-10-02
- Built: nothing new. Scratch scripts for the screenshots, reflow, text-spacing and target checks are outside the repo.
- Changed:
  - `src/app/globals.css`:
    * a ≤767 step in six type utilities (display-h1/h2/h3, heading-h4/h5, text-large);
    * a ≤767 `:root` block: `--layout-image-overlap` 56, `--nav-cols` 2 columns, `--logo-footer` 60%;
    * ≤991 holds: `--logo-topbar` 9rem, `--logo-footer` 35.4375rem, `--nav-cols` repeat(3, minmax(0, 8.9375rem)), `--measure` 35rem.
  - `src/components/Topbar.tsx`, `Footer.tsx`: the external link's `<li>` gets `max-md:order-last`; the footer list is `max-md:grid-cols-2`, and footer links are `min-h-24` at every width (they were 22.4 tall at 768–991: a target bug).
  - `src/components/NewsletterBand.tsx`: input and Submit padding `px-tile py-stack` (was `px-40 py-24`); below md the row is a column, and the text is `max-md:type-heading-h4`. Submit also gets `max-md:[text-box:none]`: display-h3's cap trim made it 43.6 tall against the input's 52.8 once it stopped stretching to the input's height.
  - `src/app/page.tsx`: the statement is `max-md:mt-32`. The bill band is `max-md:flex-col`, its header grid `max-md:contents`, and CSS order gives heading → source line (`mt-stack`) → action row (`mt-tile`) → stats (`mt-tile-md`, `gap-y-32`). The featured image is `aspect-4/3` below md (was aspect-video).
  - `src/app/posts/[slug]/page.tsx`: the meta row is `max-md:flex-col max-md:items-start` (always 2 lines). Source links get `py-4`: single-line ones were 23 tall (an inline box is the font's content area, not the line), and the padding takes them past 24 without moving the line. That applies at every width (a bug fix).
  - `tests/scaling.spec.ts`: the token test also probes `--logo-topbar`, `--logo-footer` and `--measure`. The nav test becomes "the shell never grows as the window narrows" on /tracker: link font and height, both logos, the input and Submit heights, and the nav's column span (≥ 768). The E5.1 exemption for the nav width at 992 → 991 is gone.
  - `docs/token-log.md` (5 lines, carry to Figma), `docs/build-prompts.md` (A5 mobile-step note, A7 measure and image-overlap notes), `CLAUDE.md` (E6 ticked).
- Decisions:
  - **Mobile type:** Eclipse is identical at 767, 479 and 390 (its 479 query has no type rules), so there's one step. Values are in the token log. text-medium keeps 18: Eclipse's 15 doesn't shrink at 767, and Joey approved 18 over 15 in E1.1. text-article stays 18/28.8.
  - **Nav order (Joey's call this session):** CSS `order` on mobile only, in Topbar and footer. Desktop is unchanged. On mobile, Tab reaches "Joey Holzman ↗" third but it shows last.
  - **The ≤767 queries are `@media (width < 48rem)`, not `max-width: 767px`.** In Chrome, a 768 iframe has a fractional width just under 768. There, `max-md:` (Tailwind: `width < 48rem`) matched but `max-width: 767px` didn't, giving mobile layout with tablet type and 3 nav columns. Browser zoom produces the same fractional widths. Now tokens and utilities switch together.
  - **Nav hold at 991:** the prompt asked for a `--nav-cols` ≤991 value, so the columns cap at 143 (3 × 143 + 2 × 16 = 461, its 992 span). The nav still starts on the 50% line, but from about 970 to 991 it, and the bill band's action row under it, end up to 10.5 short of the right inset (957 vs 967 at 991).
  - **Already in place, confirmed rather than changed:** the logo on its own row; the featured band at one column with no min-height and a 56 gap (`gap-tile-md`; `justify-between` does nothing without a min-height); grid tiles at one column with only a bottom border; the article header pad 24, the measure full width below 560 + 48, "All articles" above the pill, the rail before the body, Sources full width; no sticky below 768 (the CSS guard is `min-width: 768px`, and both layers compute `relative` at 390 and 768).
- Verified:
  - `npm run lint` clean; Prettier clean; `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:content` 9/9; `npm run test:e2e`: 131 passed, 64 skipped (unchanged totals; axe 0 and the keyboard walks on Home, every article and /tracker at all 5 projects).
  - **Scaling test:** passes, with the table at 11 widths, for example 992 → 991: topbar logo 144.38 → 144, footer logo 567 → 567, measure 560 → 560, input 78.73 → 68, nav columns 461 → 461. **Mutation checks** (file restored): without the ≤991 `--logo-topbar` it fails ("logo-topbar: 144.38 at 992 → 165 at 991"); with display-h3's ≤767 line height at 1.6 it fails ("display-h3 lh: 36 at 768 → 38.4 at 767").
  - **Reflow:** 0px horizontal overflow on /, /tracker, /privacy, /accessibility and all 6 posts at 320, and at 1280 @ 400% (320 × 200 at 4× DPR). 0 at 768, 800, 900, 991, 992, 1024, 1100, 1200 and 1279 too.
  - **Text spacing (1.4.12):** line height 1.5, paragraphs 2em, letters 0.12em, words 0.16em on all 10 pages at 390, 768 and 1280: no clipped box, nothing off screen, no overflow. Checked by eye at 390 (`screens/e6/text-spacing-*-390.png`).
  - **Targets:** every link, button and input on all 10 pages at 390, 768 and 1024 is ≥ 24 × 24. Inline body links are exempt; stretched title links are measured by their tile.
  - **Tablet (768–1279):** the grid is 2 columns, the measure is centered (232–792 at 1024), and the rail is a full-width block before the body.
  - **Measured at 390:** statement 34/34, bill heading 24/27.6, stats 40, labels 16/20.8, nav 14/19.6 in 2 columns of 154.7, stat row gap 32, input and Submit 52.8 tall, full width, 16 apart, footer logo 60% (195 at a 373 client), the article image 24–366 overlapping the header by 56, the meta row on 2 lines.
  - **Screenshots:** `screens/e6/`: home, deepfakes-navy and lawmakers-volt at 390 / 768 / 1024; text-spacing-{home,what-the-take-it-down,rep-french-hill-ai-p}-390; home-991-top; lawmakers-volt-390-top.
  - **Eclipse parity** (Chrome, same-origin iframes at 1024, 990, 767, 479 and 390 on the archive; ours at 768 and 390 live): root 16 on both below 992; display and heading sizes now match Eclipse's ≤767 values. **Differences kept on purpose:** tile pad 24 vs 20 (Part A); nav 2 columns vs 1 (prompt); newsletter field 52.8 vs 44 tall, 16 vs 10 apart (prompt); input 68 vs 50 at 768 (our Figma field type is larger, E2). No parity token change beyond the type step.
  - **Not done:** a Figma compare (the mobile frames aren't designed yet).
- Open for next prompt:
  - **Design calls left alone:**
    * Grid tiles keep `--post-tile` (308) as a min-height on mobile, so short titles leave a tall empty gap above "Read more".
    * The nav and action row end 10.5 short of the inset near 991 (above).
    * "Joey Holzman ↗" and "Open the bill tracker" still wrap at 768–900 (E5.1).
    * The mobile tab order puts "Joey Holzman ↗" third while it shows last (Joey's call).
    * The footer's `gap-x-stack-sm` (8) and `gap-y-32` are unchanged on mobile.
    * Featured-band image at 4/3 is the placeholder.
  - **Still growing at 991, not in this prompt's list:** `--disclaimer` (35rem: 490 → 560) and the topbar row's `min-h-80` (70 → 80; hidden behind the 72 nav). Same fix as the others if wanted.
  - In dev, Next's dev-tools badge sits over the featured title and a stat at 390 (the screenshots show it); production doesn't render it.
  - The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.1: Bill tracker row, nav focus order, 991 holds · 2026-10-02
- Built: nothing new. Scratch measurement and screenshot scripts are outside the repo.
- Changed:
  - `src/app/page.tsx`: the bill band's action row is `md:col-span-2 md:col-start-2` on the `--nav-cols` grid (was `md:col-start-3`). Comment updated.
  - `src/lib/site.ts`: `NAV_LINKS` DOM order is Articles, Privacy Policy, Bill Tracker, Accessibility, Joey Holzman (the mobile visual order).
  - `src/components/Topbar.tsx`, `Footer.tsx`: the external link's `<li>` is `md:col-start-3 md:row-start-1` (was `max-md:order-last`). The other four auto-place around it, so desktop is unchanged. The Topbar row is `min-h-(--topbar-row)` (was `min-h-80`).
  - `src/app/globals.css`: new `--topbar-row` (`spacing-80`); ≤991 `--disclaimer: 30.625rem` (490) and `--topbar-row: 4.375rem` (70).
  - `tests/home.spec.ts`, `tests/shell.spec.ts`: `navOrder` follows the new DOM order. `tests/scaling.spec.ts`: `disclaimer` and `topbar-row` join the size probes.
  - `docs/token-log.md` (2 lines), `CLAUDE.md` (E6.1 ticked).
- Decisions:
  - **The topbar row's min-height got a token** (`--topbar-row`) rather than an existing one: `min-h-tile-md` would also hold (56 at ≤991), but it's a tile top, not the row. 80 at 1440 and 70 at 992 are unchanged; only ≤991 changes (80 → 70). It never binds today (the nav is taller), so nothing visibly moves.
  - **Desktop tab order is now Articles → Privacy Policy → Bill Tracker → Accessibility → Joey Holzman ↗**, so on desktop Tab goes across row 1's first two columns, down to row 2, then back up to column 3. That follows the prompt's single DOM order; the mobile order now matches the visual order exactly (WCAG 2.4.3).
- Verified:
  - `npm run lint` clean; Prettier clean; `npm run build` passes; `npm run test:e2e`: 131 passed, 64 skipped (same totals). That includes axe 0 on `/` and `/tracker` at 1440, 1280, 1024, 768 and 390, and both keyboard walks with the new order.
  - **Scaling test:** `disclaimer` 770 / 560 / 527.6 / 490 from 1281 down to 390; `topbar-row` 110 / 80 / 75.4 / 70 from 1281 down to 390. **Mutation check:** without the two ≤991 values it fails ("disclaimer: 490 at 992 → 560 at 991", "topbar-row: 70 at 992 → 80 at 991"); file restored.
  - **Bill tracker row** (label lines, row edges = nav column 2's left to the last column's right): 1 line at 1440 (954.7–1400), 1366 (905.6–1328.3), 1280 (848.7–1245), 1024 (678–989), 992 (656.7–957), 991 (654.5–956.5), 768 (509.3–744). Full width and 1 line at 767 and 390.
  - **Nav placement:** Topbar at 1440 is Articles 720, Privacy 954.7, Joey 1189.3 in row 1, and Bill Tracker 720, Accessibility 954.7 in row 2. That's the E5.1 layout, and it's the same at 1366, 1280, 1024, 991 and 768. The footer is the same shape (Joey in column 3 of row 1). Below md both are Articles | Privacy / Bill Tracker | Accessibility / Joey.
  - **Tab order** (scratch script): at 390 and 1440, Articles | Privacy Policy | Bill Tracker | Accessibility | Joey Holzman (external site).
  - No console errors or warnings on `/` in dev.
  - **Screenshots:** `screens/e6.1/`: home-{1440,1366,1280,1024,768,390} (top of page) and footer-{1440,1366,1280,1024,768,390}.
  - **Not done:** a Figma compare and an Eclipse parity pass. Nothing in scale, type or spacing changed except the two ≤991 holds, which are below Eclipse's values anyway.
- Open for next prompt (E7):
  - "Joey Holzman ↗" still wraps in its nav column from 768 to about 900 (visible in home-768).
  - The nav and action row still end up to 10.5 short of the right inset between about 970 and 991 (E6's `--nav-cols` hold): 957 vs 967 at 991.
  - Carried from E6: grid tiles keep the 308 min-height on mobile; the footer's gaps on mobile; `tests/article.spec.ts:132` TS error (`offsetHeight` on `HTMLElement | SVGElement`).
  - The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.1 (revised): New buttons, single-stage scroll, nav focus order, 991 holds · 2026-10-03
- Built: `src/components/Mark.tsx` (the quarter-circle from `src/app/icon.svg`, `fill="currentColor"`, `aria-hidden`, `width` prop like `<Logo>`). It sits next to `Logo.tsx` in `src/components/`, where `Logo` actually lives (the prompt said `src/assets/brand/`, which only holds the source SVG).
- Changed:
  - **This finishes the E6.1 above.** That pass (same day, uncommitted) had already done item 5 (nav DOM order, `md:col-start-3 md:row-start-1`, no `order` rules, both tests' `navOrder`) and two of item 6's holds (`--disclaimer`, `--topbar-row`). They're unchanged; its "Open the bill tracker" row is gone.
  - `src/app/page.tsx`, bill band: DOM order is heading → source line → stats → button. The header is `md:flex md:items-baseline md:justify-between` (source line top right; below md it's under the heading, `mt-stack`). The `<dl>` is unchanged (`mt-tile-md`). The button: a `-mx-tile mt-tile-md grid md:grid-cols-2` row with `<Tile mode="ink" interactive>` at `md:col-start-2`, holding a `link-stretched` "Explore the bill tracker" (heading-h4) and `ArrowRight` 32. The band is `relative z-1 pb-0` (no `data-sticky`, no `focus-within:z-3`), so the button is flush on its bottom and spans 720–1440 at 1440. Below md it's full width.
  - `src/app/page.tsx`, featured tile: the bottom row is `flex items-end justify-between gap-stack`: the dek, then `ArrowRight` 48. The wrappers after the band are `relative z-1` (were z-2).
  - `src/components/PostTile.tsx`: `ArrowRight` 48 with `mt-auto` (bottom left) replaces the "Read more" row.
  - `src/components/ActionRow.tsx`: only "Track this bill" (Rail) and the styleguide use it now, so the `decorative` prop and its `<div>` branch are deleted and `href` is required. `src/app/styleguide/page.tsx` drops its "Read more" demo.
  - `src/components/Footer.tsx`: `<Mark width="var(--mark-footer)">` (mint) replaces the wordmark.
  - `src/app/globals.css`: `--spacing-48`; `--mark-footer` 20.0625rem, 17.5rem at ≤991, `min(60%, 17.5rem)` at ≤767; `--logo-footer` deleted (nothing else used it). Stale cascade comments updated (also in `Topbar.tsx`).
  - `tests/home.spec.ts`: "sticky cascade" → "single-stage scroll": "the amber band covers the topbar" (the topbar still at top 0), new "the featured band never overlaps the bill band" (scrolls 0–900: the gap is ≥ 0 and the band's visible top shows amber), the focused-nav test unchanged, and "only the topbar sticks, and only while it fits". The stage-2 test is gone. The reduced-motion and no-JS tests expect one sticky layer. The keyboard walk expects "Explore the bill tracker" and reads titles from `:is(h2, h3) a`. New "hover and focus flip the bill tracker button to mint". The featured selector is `[data-tile=ink]:has(h2)` (main has two ink tiles now).
  - `tests/scaling.spec.ts`: `mark-footer` replaces `logo-footer` in the token probe. The shell test runs on `/` (was `/tracker`) so it can also measure the bill tracker button's height; "footer logo" → "footer mark".
  - Docs: Part A A8 (two arrow rows), A9 (tile arrows are `aria-hidden`; Home is a single stage), the E4 sticky section, CLAUDE.md (§5 tile arrows; Progress line renamed and ticked), `docs/token-log.md` (2 lines; the old "Open the bill tracker" line is marked superseded).
- Decisions:
  - **The button's `<a>` is the label, stretched over the tile** (`link-stretched`), not an `<a>` that is itself the tile. The whole block is the hit area, the ring is the tiles' inset ring (2px, −8), and it's the same one-link-per-tile pattern as the other tiles. Tile has no `as="a"`, so the alternative was a second way to make a tile.
  - **Stats → button gap is `tile-md`** (80): band 463.5 at 1440 vs Figma 456 (+7.5). `tile-pad` (40) gives 423.5 (−32.5); nothing in between is a layout token. Figma's 54 is measured from 2-line labels; ours are 1 line at ≥768.
  - **Button height needs no new ≤991 value:** it's 2 × `tile-pad` + the label/arrow, so 112 / 98 at 992 / 80 at 991 / 80 at 390. It's in the scaling test.
  - **Mark position:** the tile inset (40, 40), since Figma's (28, 30) isn't on a token. The footer is 414 at 1440 (Figma 394).
  - **Mark below 768:** 60% of the footer, capped at its 991 size (205 at 390, 280 at 767). It keeps E6's 60% for the wordmark and doesn't grow at 767.
- Verified:
  - `npm run lint` clean; Prettier clean; `npx tsc --noEmit` clean; `npm run build` passes (placeholder warning for bill-stats.json); `npm run test:e2e`: **136 passed, 64 skipped** (1440-only checks). That covers axe 0 on `/` at 1440, 1280, 1024, 768 and 390, and on every article and /tracker at all 5; the Home keyboard walk at all 5 (skip → logo → Articles, Privacy Policy, Bill Tracker, Accessibility, Joey Holzman → Explore the bill tracker → featured → grid → email → Submit → footer in the same order), each stop with a 2px ring and uncovered (elementFromPoint).
  - **Mutation check:** without the ≤991 `--mark-footer` the scaling tests fail ("mark-footer: 280.88 at 992 → 321 at 991", "footer mark: … → 321 at 991"); file restored.
  - **Measured at 1440:** band 463.5; button 720–1440, 351.5–463.5 (112, flush); source line right edge 1400; h2 and source line share a baseline at 1440, 1024 and 768 (probe span). Featured arrow 632–680 (Figma 632–680). 1366: band 437, button 105.5. 991: band 355.9, button 80. 390: heading → source (16) → stats → button 0–390, flush.
  - **Button hover and focus** (scratch script): ink/paper → mint bg, ink label and arrow, 0.3s; 0s under reduced motion; focus ring solid 2px, offset −8, ink.
  - No horizontal scroll at 1440 → 390 (scrollWidth = clientWidth).
  - **Screenshots** in `screens/e6.1/`: home-{1440,1366,1024,768,390} (full page), scroll-1440-{0,150,300,466,700}, button-{hover,focus}-1440, footer-{1440,390}, figma-2089-10.
  - **Figma (2089:10) mismatches left:** band +7.5 (above); stats at the quarter lines + 40 (prompt: unchanged) vs Figma's 98 / 426 / 790 / 1154; button label sentence case; grid tiles pad 40 vs Figma 27 (unchanged); footer 414 vs 394 and the mark at 40, 40; newsletter label kept. The items the prompt said to ignore were ignored.
  - **Eclipse** (Chrome, same-origin iframes on the archive): its arrow icons are 66 (with h2) and 30 (with h4) at 1440, 1280 and 1024, 38 / 24 at 991 and 768, and 32 / 22 at 390. They step down at 991. No token changed for parity.
- Open for next prompt (E7):
  - **At ≤767 the ink button sits directly on the ink featured tile:** the two blocks merge, with no line between them (see home-390). Joey's call: a `tile-line` border, or another mode.
  - **The new arrows grow at the 991 root jump** (48: 42 → 48; 32: 28 → 32), like every existing `size-24` icon (21 → 24). Eclipse's step down there. If wanted, one icon-size hold covering all icons, not just these two.
  - Carried: "Joey Holzman ↗" wraps from 768 to about 900; the nav ends up to 10.5 short of the right inset near 991; grid tiles keep the 308 min-height on mobile (more empty space now that the arrow is smaller than the row was); the footer's mobile gaps; the `tests/article.spec.ts:132` TS error; in dev, Next's badge overlaps content at 390.
  - The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.2: Article image overlaps the header · 2026-10-03
- Built: nothing new.
- Changed:
  - `src/app/posts/[slug]/page.tsx`: the paper wrapper after the header is `flow-root pb-tile-lg` (was `pb-tile-lg`). One class.
  - `tests/article.spec.ts`: new "the header color shows beside the image's top edge" (1440 project only; it sets 1440, 991 and 390 itself and runs all 6 posts, one per header mode). It checks that the first `[data-tile]` under (image left − 8, image top + 8) is the header, that the overlap is 104 / 91 / 56, and that the paper wrapper's top is the header's bottom (±1).
  - `CLAUDE.md` (E6.2 added and ticked).
- Decisions:
  - **Cause confirmed before the fix:** at 1440 the paper wrapper's top was 812.5, the same as the image's top; the header's bottom is 916.5. The `-mt-image-overlap` collapsed through the wrapper (no top padding or border), so the wrapper moved up 104 and painted paper over the header's bottom 104. The rects still said "overlap 104", which is why E5's scratch check passed. With `flow-root` the wrapper starts at 916.5 and the image overflows up over the header.
  - **The test uses `elementsFromPoint`, not `elementFromPoint(...).closest('[data-tile]')` as the prompt said.** At that point the top hit is the image's transparent full-width `-mt-image-overlap px-tile` div, a child of the paper wrapper, so `closest` returns paper even when the header color is what shows. The first `[data-tile]` in the stack is the header after the fix and the paper wrapper before it. **Mutation check:** without `flow-root` the test fails ("slate at 1440"); with it, it passes.
  - **There was no overlap check in the spec.** E5 measured it with a scratch script. The 104 / 91 / 56 checks are now in the new test.
  - No token changes; `token-log.md` untouched.
- Verified:
  - `npm run lint` clean; Prettier clean on both files; `npx tsc --noEmit` clean; `npm run build` passes (the bill-stats placeholder warning); `npm run test:e2e`: **137 passed, 68 skipped** (+1 test, plus 4 skips for its non-1440 projects). That includes axe 0 on all 6 articles at 1440, 1280, 1024, 768 and 390 (so navy and volt at 1440 and 390), and the article keyboard walk (every stop outlined and uncovered).
  - **Nothing below the image moved:** image bottom → next block is 60 at 1440 and 52 at 991 and 390, the same as before the fix (next block 1261.3 / 926.2 / 954.5 before and after). No post has an image credit, so there's no figcaption to check; it sits inside the figure, so it moves with the image.
  - `/privacy` and `/accessibility` don't use the pattern: one paper `Tile`, no negative margins. The only `-mt-image-overlap` is the article's.
  - **Screenshots** in `screens/e6.2/`: `navy-{1440,991,768,390}`, `volt-{1440,991,768,390}` (cropped around the seam), and `figma-2075-1532`.
  - **Figma (2075:1532):** the image straddles the header edge with the header color on both sides of its top, as in the frame. No new mismatches.
  - **Eclipse parity:** not rerun; no token, type, spacing or layout value changed.
- Open for next prompt (E7): unchanged from E6.1 (revised). The `tests/article.spec.ts:132` TS error (`offsetHeight` on `HTMLElement | SVGElement`) is still there; `tsc` doesn't cover tests, so only the editor shows it. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.2 (completed): Amber divider under the tracker button · 2026-10-03
- Built: nothing new.
- Changed:
  - **This finishes the E6.2 above.** That pass (same day, uncommitted) had done items 1 and 2: `flow-root` on the article's paper wrapper and the "header color shows beside the image's top edge" test. I re-checked both and left them as they were. Item 3 is new here.
  - `src/app/page.tsx`: the bill band is `relative z-1 pb-0 max-md:pb-8` (was `pb-0`). The comment above the button row now mentions the strip.
  - `tests/home.spec.ts`: new "an amber strip under the tracker button, below md only" runs in every project. It scrolls the seam to mid-screen and checks the gap from the button's bottom to the featured band's top: 8 (±1) below 768, with `elementFromPoint` in the gap resolving to `amber`; 0 (±1) at 768 and up.
  - `CLAUDE.md`: the Progress line is renamed to "E6.2: article image overlap, amber divider under the tracker button" (it was already ticked).
  - The bill-band note in `docs/build-prompts.md` (E6.1 section) already said "with an 8px amber strip under it (E6.2)", so I left it alone.
- Decisions:
  - **`pb-8` resolves to `--spacing-8`** (0.5rem), so it scales with the fluid root. Measured: 8.0 at 390; 0 at 768.
  - No token changes; `token-log.md` untouched.
- Verified:
  - `npm run lint` clean; `npx tsc --noEmit` clean; Prettier clean; `npm run build` passes; `npm run test:e2e`: **142 passed, 68 skipped**. That includes axe 0 on all 6 articles at all 5 widths (navy and volt among them, at 1440 and 390), axe 0 on `/`, and the Home and article keyboard walks.
  - **Mutation check:** without `max-md:pb-8` the new test fails at 390 ("Expected: <= 1, Received: 8"). File restored.
  - **Screenshots:** `screens/e6.2/home-390.png` (amber strip between the button and the featured tile) and `home-768.png` (button flush on the featured image). The article seam shots and `figma-2075-1532` are from the earlier pass; the article didn't change here.
  - **Eclipse parity:** not rerun; no token, type or layout value changed.
- Open for next prompt (E7): E6.1's "ink button merges with the ink featured tile at ≤767" is resolved. Everything else from E6.1 (revised) and E6.2 still stands: the icon-size hold at 991; "Joey Holzman ↗" wrapping from 768 to about 900; the nav up to 10.5 short near 991; the grid tiles' 308 min-height on mobile; the footer's mobile gaps; the `tests/article.spec.ts:132` TS error; and the Next dev badge at 390. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.3: Color remap (tracker = signal, newsletter = amber, featured = navy) · 2026-10-03
- Built: nothing new. No modes or tokens added; only which mode each block uses.
- Changed:
  - `src/app/page.tsx`: the bill band is `mode="paper"`. "{congress} Congress" in the heading is a `<span className="text-signal">`. The stat items get a `signal` flag (only "Became law"), which puts `text-signal` on the number; the label stays ink. The tracker button stays ink with `[--tile-hover-bg:var(--color-signal)]`, so the shared hover/focus rule flips it to signal with ink text. The featured tile is `mode="navy"`. The strip comment now says paper, off the navy tile.
  - `src/components/NewsletterBand.tsx`: `mode="amber"`; the paper fg override and the "≥ 24px" comment are gone. The input and Submit both get `border border-ink` (see Decisions). Type sizes unchanged.
  - `src/app/posts/[slug]/Rail.tsx` (cap) and `src/app/tracker/page.tsx` (header): amber → signal.
  - Tests: `home.spec` has the featured selector `[data-tile=navy]`, the tracker button flips to signal, a new "signal text is never under 24px" (1440 project; sets 1440, 991 and 390 itself), and amber → paper in the strip and single-stage tests. `shell.spec` has a new "newsletter: an amber band, the input edged in 1px ink". `article.spec` has a new "rail: the cap is signal".
  - Docs: CLAUDE.md §4 (new mapping plus the 24px signal rule; Progress line added and ticked). Part A: A1 (the "2" in navy row is replaced by the label-stays-ink row, plus the input-border row), A2 (signal and amber roles, the 24px rule, no blue links on amber), A3 (signal as hover-bg, the paper override note removed, the hover line says it takes `--tile-hover-bg`), A9 (solid amber → solid paper).
- Decisions:
  - **Submit also gets the 1px ink border.** With only the input bordered, the input is 2px taller than Submit below md, where they stack and Submit doesn't stretch. On ink it's invisible; on hover (mint) it shows as an ink edge, matching the input. Measured: both 92.0 at 1440 and both 54.8 at 390 (the input was 52.8 at 390 before, so +2).
  - **The hover arbitrary property is on the one Tile** (utilities layer beats the `[data-tile]` base default). No globals.css change, so token-log.md is untouched.
  - **Figma 2089:10 shows the button in navy over an ink featured tile:** the reverse of this prompt (ink button, navy featured). I followed the prompt, which also keeps the phone paper strip meaningful.
  - The muted 72% ink in the shared hover rule would land on signal for the tracker button, but the button has no muted text, so it doesn't matter today.
- Verified:
  - `npm run lint` clean; `npx tsc --noEmit` clean; Prettier on touched files; `npm run build` passes; `npm run test:e2e`: **153 passed, 72 skipped** (1440-only checks). That includes axe 0 on `/`, `/tracker` and all 6 articles at 1440, 1280, 1024, 768 and 390, plus the Home, /tracker and article keyboard walks (each stop solid 2px and uncovered).
  - **Mutation check:** with `text-signal` on the stat labels, "signal text is never under 24px" fails ("signal text at 991, Received 20"). File restored.
  - **Measured at 1440 (production build, scratch script):** button at rest is ink with a white label; hover is bg `rgb(255, 67, 1)` with ink label and arrow, 0.3s; keyboard focus gives the same colors plus a solid 2px ink ring at −8. The featured tile is navy, its date at paper 72%. The rail cap is signal with an ink h2. The newsletter input border computes to `1px solid rgb(8, 8, 12)`.
  - **Screenshots** in `screens/e6.3/`: home-{1440,1024,768,390} (full page), button-hover-1440, button-focus-1440, newsletter-{1440,390} (from /tracker), article-rail-1440 (the child-safety post: the take-it-down post is a draft and isn't served in production), figma-2089-10.
  - **Figma (2089:10):** deliberate deviations are the ink "Became law" label (Figma: signal) and the input border. Also differs: button/featured colors swapped (above), plus E6.1's carried items (band +7.5, stat x positions, sentence-case label, grid pad, footer). Items the prompt said to ignore were ignored. At the frame's export scale the input may already have a thin dark edge; worth a look in Figma.
  - **Eclipse parity:** not rerun; no token, type, spacing or layout value changed.
- Open for next prompt (E7): On /tracker the signal header now sits directly on the amber newsletter band (no line between; both have ink text, so contrast is fine, but they're adjacent warm colors). A process on port 3100 (PID 18148) predates this session; I used 3117. Everything else from E6.2 stands: the icon-size hold at 991, "Joey Holzman ↗" wrapping from 768 to about 900, the nav up to 10.5 short near 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps, the `tests/article.spec.ts:132` TS error, and the dev badge at 390. The E3 TODO(joey) list is unchanged; no content file was touched.
- **Follow-up (same session): Trump.png as the placeholder image.** Joey's call. Moved `Trump.png` (640×640) from the repo root to `public/images/trump.png`. Next only serves images from `public/`. The two fallbacks (`src/app/page.tsx` featured image, `src/app/posts/[slug]/page.tsx` figure) point at it. `alt` stays `""` (still a decorative placeholder). `placeholder.svg` is kept for when it goes back; CLAUDE.md §3 notes both. This overrides E0's "no stock photo" rule for now. lint, build and test:e2e (153 passed, 72 skipped) pass. Screenshots: `screens/e6.3/trump-{home-1440,home-390,article-1440}.png`. At 1440 the 640px source fills a 720-wide cell, so it's slightly upscaled.

## E6.4: Smaller display headings (72/52/32 at 1440) · 2026-10-03
- Built: nothing new.
- Changed:
  - `src/app/globals.css`: `type-display-h1` 5.625rem → 4.5rem; `type-display-h2` 4.125rem → 3.25rem; `type-display-h3` 2.375rem → 2rem with line height 42/38 → 36/32, and at ≤991 2rem → 1.75rem (its line-height override is removed, so it keeps 36/32). ≤767 values, tracking, weights, the fluid root, its breakpoints and the 1920 cap are unchanged. Every other type style is unchanged.
  - `tests/scaling.spec.ts`: new "display headings compute to 72/52/32 at 1440 and 63/45.5/28 at 1220" (on /styleguide, 1440 project). The existing no-growth test had no hard-coded sizes, so it needed no changes.
  - Docs: Part A A5 (the table, the ≤991 note and a "Display sizes (E6.4)" paragraph), `docs/token-log.md` (3 carry-to-Figma lines marked as a taste call, not parity), and CLAUDE.md (E6.4 added and ticked). The /styleguide page reads computed sizes (`Computed.tsx`), so it needed no edit.
- Decisions:
  - **≤991 display-h3 is 28 / 31.5, not the prompt's 28 / 32.** With 28/32 the no-growth test failed ("display-h3 lh: 31.5 at 992 → 32 at 991"): at 992 the root is 14, so 2rem × 36/32 = 31.5. The prompt also required that test to pass, so I kept the desktop ratio. The difference is half a pixel. In Figma, Mobile/Tablet H3 is 28/31.5, or 28/32 if Joey accepts the 0.5px growth (that would mean loosening the test).
  - No layout or min-height token changed, as the prompt asked.
- Verified:
  - `npm run lint` clean; Prettier clean; `npx tsc --noEmit` clean; `npm run build` passes (bill-stats placeholder warning); `npm run test:e2e`: **154 passed, 76 skipped** (+1 test). This includes axe 0 on `/` and all 6 articles at 1440 and 390 (and at 1280, 1024 and 768), the no-growth test, and "signal text is never under 24px".
  - **Computed sizes** (scaling table): h1/h2/h3 are 99 / 71.5 / 44 at 1920+ (2560 too); 72 / 52 / 32 at 1440; 63 / 45.5 / 28 from 1280 down to 992 and at 1220; 60 / 40 / 28 at ≤991; 40 / 34 / 24 at ≤767. The h3 line height is 36 at 1440, 31.5 from 1280 to 768 and 27.6 at ≤767.
  - **Signal "119th Congress" span:** 32 at 1440, 28 at 1280 and 1024, 24 at 390. The "Became law" number is display-h1 (≥ 40).
  - **Before → after at 1440** (dev server, the same page with the old sizes injected as an override, scratch script):
    - topbar height 264.4 → 256.2 (−8.2). The statement stays 1 line. `--statement-top` follows by itself: margin 61.7 → 65.6. The trimmed cap top moves from 183.7 → 187.6 below the header top (Figma 182), because the smaller line box has less space above the cap.
    - Home bill band 463.5 → 443.2 (Figma 456: was +7.5, now −12.8).
    - featured band 807 → 807 (the `--band-featured` min-height binds both before and after). The empty space between the title and the dek row, with the longest real title, grows from 295.3 → 399.4.
    - grid tiles 354 → 354 (min-height binds; titles still 2,2,2,2,1 lines). The smallest empty space above the arrow grows from 93.5 → 103.9.
    - article header (the Bilirakis post) 819.5 → 711.5 (−108; 1024: 718.2 → 623.7; 390 unchanged at 550.7).
  - **Wrapping** (the longest real title, "Rep. Bilirakis Introduces Bill to Prohibit AI-Generated Child Pornography", put into the featured tile; and its article header):
    - featured tile: 4 → 3 lines at 1440, 5 → 4 at 1024, 4 → 4 at 390;
    - the real featured title (TAKE IT DOWN): 3 → 2 at 1440, 4 → 3 at 1024;
    - article h1: 4 → 3 at 1440 and 1024, 4 → 4 at 390.
    Nothing wraps worse.
  - **Screenshots:** `screens/e6.4/`, full page: home-{2560,1440,1220,1024,390} and article-{2560,1440,1220,1024,390} (the Bilirakis post).
  - **Not done:** a Figma compare (the frames still have the old sizes) and an Eclipse parity pass. This is a deliberate move away from Eclipse's 66 at 1440, logged as a taste decision.
- Open for next prompt (E7):
  - **Joey's call in Figma:** the featured band (807 min) now has about 100 more empty px at 1440, and the grid tiles about 10 more. The bill band is 12.8 under Figma's 456. The article header is 108 shorter. Update the Figma Display/H1–H3 styles (token-log lines) and the Tablet H3 to 28/31.5.
  - The newsletter field and Submit use display-h3 above 767, so they're slightly shorter now (32 text instead of 38 at 1440). The scaling test still passes.
  - Everything carried from E6.3 still stands: the icon-size hold at 991, "Joey Holzman ↗" wrapping from 768 to about 900, the nav up to 10.5 short near 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps, the `tests/article.spec.ts:132` TS error, the dev badge at 390, and the signal header next to the amber band on /tracker. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.5: Featured band ≤ viewport · 2026-10-03
- Built: nothing new.
- Changed:
  - `src/app/globals.css`: `--band-featured` is `min(50.4375rem, 100svh)` (≤991: `min(44rem, 100svh)`). It's still used as `md:min-h-`, so longer content grows the band. Nothing else in the file changed.
  - `src/app/page.tsx`: no net change. Mid-session Joey had the statement h1 switched to `type-display-h3` (the bill heading's style), then asked for it back; it's `type-display-h2` again, and the matching A5 and token-log edits were reverted too.
  - `tests/home.spec.ts`: new "the featured band is at most one screen tall" (1440 project; it sets 1440×790, 1536×730, 1920×950 and 2560×1305 itself). With the band's top scrolled to 0 it checks: the band height ≤ innerHeight + 1; the h2, the dek `p` and the arrow `svg` are within [0, innerHeight]; and at 2560 the band is 1109.6 (±1).
  - `src/components/NewsletterBand.tsx` (Joey's mid-session request): the "Email address" label → input gap is `mt-stack` (was `mt-stack-sm`). Measured: 24 at 1440, 21 at 992, 16 at 991 and 390 (was 8). The band is 330.7 at 1440 and 321.5 at 390. It's sitewide, since the band is in `SiteEnd`.
  - Docs: `docs/token-log.md` (2 lines: the band, the label gap), CLAUDE.md (E6.5 added and ticked).
- Decisions:
  - The band uses `svh`, as the prompt asked; on desktop Chrome it equals innerHeight.
- Verified:
  - `npm run lint` clean; Prettier clean on the touched files; `npm run build` passes (bill-stats placeholder warning); `npm run test:e2e`: **155 passed, 80 skipped**, 0 failed (+1 test, plus 4 skips). This includes axe 0 on `/` at 1440, 1280, 1024, 768 and 390, plus the keyboard walk.
  - **Mutation check:** with the old `--band-featured: 50.4375rem` the new test fails ("band at 1440×790: Expected ≤ 791, Received 807"). File restored.
  - **Band height and title → dek gap** (h2 bottom to dek top, band top at 0):
    - Production (featured = "States Taking the Lead…", 3 lines at ≤1920): 1440×790 band 790, gap 382.4; 1536×730 band 730, gap 292.0; 1920×950 band 950, gap 390.3; 2560×1305 band 1109.6, gap 621.4 (2 lines). Arrow bottom 750.5 / 687.1 / 895.1 / 1054.8, so it's always in view.
    - Dev (featured = the TAKE IT DOWN draft, 2 lines): gaps of 434.4 / 347.9 / 461.8 / 621.4.
    - Unchanged where the window is taller: 1440×900 is 807, 1024×768 is 706.1, 768×1024 is 704.
  - **Growth, no clipping** (scratch script, 1440): the longest real title (Bilirakis, 3 lines) at 790 → band 790, gap 382.4; plus a WCAG text-spacing override → still 790, no overflow; 1440×400 → the band grows to 435.6 (content), no overflow.
  - **Image crop** at 1440×790: the cell is 720×790 (object-cover), head and shoulders whole; it looks intentional.
  - **Screenshots** in `screens/e6.5/` (production build on :3117): home-{1440x790,1536x730,1920x950,2560x1305} (the band's top at the window top), newsletter-{1440,390} (from /tracker, after the label-gap change). The band numbers below were measured with the statement briefly at display-h3; it sits above the band, so they don't change.
  - **Not done:** a Figma compare and an Eclipse pass (no parity value changed).
- Open for next prompt (E7):
  - **The featured image never loads when the browser picks the 828w variant.** `/_next/image?url=/images/trump.png&w=828` never responds to a WebP/AVIF Accept header, in dev and in production (750, 1080 and 1200 respond in ms). `sharp` itself encodes it in 39ms. The browser picks 828 for `50vw` at about 1536–1656 wide, and **probably on 390-wide phones at DPR 2** (100vw × 2 = 780 → 828), so the featured cell shows plain stone there (see home-1536x730). Not caused by this change; not investigated further. Worth checking first in E7: clear `.next/cache/images` and retry, then the Next version.
  - **The empty navy is still large:** the band now fits the screen, but justify-between still puts 290–460 between the title and the dek on common windows (621 at 2560). If that's the real complaint, the band would need to be shorter, or the tile shouldn't be justify-between. Joey's call.
  - Everything carried from E6.4 still stands (the Figma updates, the icon-size hold at 991, "Joey Holzman ↗" wrapping, the nav short near 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps, the `tests/article.spec.ts:132` TS error, the dev badge at 390, the signal header next to amber on /tracker). The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.6: heading-h5 18/25.2 (nav links), signal tracker button · 2026-10-03
- Built: nothing new.
- Changed:
  - `src/app/globals.css`:
    * `type-heading-h5` 1.25rem / (28/20) → 1.125rem / 1.4, ≤991 1rem → 0.9375rem. ≤767 (14), weight, tracking unchanged.
    * the shared hover rule: `--tile-fg: var(--tile-hover-fg, var(--color-ink))`, and the muted and line mixes read the same value. Unset, it's ink, so every other tile is unchanged.
    * new `--spacing-target: max(1.5rem, 24px)` (see Decisions).
  - `src/app/page.tsx`: the tracker button is `mode="signal"` with `[--tile-hover-bg:var(--color-ink)] [--tile-hover-fg:var(--color-paper)]` (was ink with a signal hover-bg). The comment explains the ink label and the paper strip.
  - `src/components/Footer.tsx`: links `min-h-24` → `min-h-target`.
  - Tests: `home.spec` "the bill tracker button: signal at rest, ink on hover and focus" (rest signal/ink/ink; hover and focus ink/paper/paper), and the strip test selects `[data-tile=signal]`. `scaling.spec`: new "heading-h5 computes to 18 at 1440, 15.75 at 1220 and 15 at 991"; the button selector is `[data-tile=signal]`. `shell.spec`: "nav targets are at least 24px tall" covers the Footer nav too.
  - Docs: Part A A2 (signal and ink roles), A3 (`--tile-hover-fg` row; the tracker-button note replaces E6.3's; the hover line), A5 (h5 row 18 / 25.2, 15 / 21, plus an E6.6 note). CLAUDE.md §4 (signal and ink lines; E6.6 added and ticked). `docs/token-log.md`: 3 lines.
- Decisions:
  - **The button label is ink, not paper** (the prompt's call too): paper on signal is 3.47:1, and the heading-h4 label is under 24 below 1440.
  - **Footer targets:** with the smaller h5 (line box 22.05 at the 14px root), footer links were 22 tall from 992 to 1280, because `min-h-24` is rem and computes to 21 there. Before this change the 24.5 line box hid it. Spacing would probably pass 2.5.8 anyway, but E6 treats < 24 as a bug, so I added one token on the existing `max(rem, px)` floor pattern rather than a raw px class. Now 24 at 992–1280 and ≤991, 25.2 at 1440.
- Verified:
  - `npm run lint` clean; Prettier clean on touched files; `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:e2e`: **156 passed, 84 skipped**, 0 failed (+1 test, +4 skips). That includes axe 0 on `/` and all articles at all 5 widths, and the Home keyboard walk (every stop with a 2px ring, uncovered).
  - **Mutation checks** (restored): with h5 at 1rem at ≤991, the no-growth and h5 tests fail ("heading-h5: 15.75 at 992 → 16 at 991"). With `min-h-24` on footer links, the target test fails at 1280 and 1024 (22.05).
  - **Production (:3117, scratch scripts):** axe 0 on `/` and the Bilirakis post at 1440 and 390. Button: rest `rgb(255,67,1)` with ink label and arrow (1440 and 390); hover and Tab focus `rgb(8,8,12)` with paper label and arrow, focus ring solid 2px paper at −8; 0.3s, 0s under reduced motion.
  - **heading-h5 users, before → after** (1440; 390 is unchanged at 14/19.6 for all): Topbar nav link 20 → 18 (link 37 → 34.2 tall), footer link 20 → 18 (28 → 25.2), the Home source line, PostMeta date, editor-note label ("Update · …", Bilirakis), /accessibility and /privacy "Updated" lines 20/28 → 18/25.2, "Track this bill" ActionRow 20 → 18 (target 37 → 34.2; 33 at 390), skip link 20 → 18 (76 → 73.2 tall). Pill 38 → 35.2 tall at 1440, 33.5 → 31 at 1220, 32.4 → 31 at ≤991, 29.6 at 390; padding is still 4 × 24 from tokens, and the text's centre is within 1px of the pill's (−0.09 at 1440, −0.52 at 1220, 0 at 991, −0.8 at 390).
  - **Targets:** topbar nav links ≥ 28.6 at every width (30 at 992–1280); footer links ≥ 24.
  - **Topbar row** (`--topbar-row`): 82 → 80 at 1440 (the nav is 76.4 now, inside the 80 min, so the token binds), 112 → 110 at 2560, 72 → 70 at 992–1280, 72.4 → 71 at 850–991, 93.2 → 89 at 768–827, 185 at 390 unchanged. The header with the statement: 256.2 → 254.2 at 1440.
  - **"Joey Holzman ↗" in the Topbar:** it was 2 lines below 866; now below 828. Better, not fixed.
  - **Eclipse** (archive, Playwright): `.nav_link-text` is 18 at 1440 and 15.75 at 1024 (root 14), the same as ours. At 768 Eclipse is back to 18 (we hold 15, the no-growth rule) and 16 at 390 (ours 14, E6). No token changed for parity.
  - **Screenshots** in `screens/e6.6/`: topbar-{2560,1440,1220,1024,390}, footer-{same}, article-header-1440 (Bilirakis), button-{rest,hover,focus}-1440, button-rest-390.
  - **Not done:** a Figma compare (the frames still have the old H5 and the old button).
- Open for next prompt (E7):
  - The topbar row grows 70 → 71 at the 991 jump (the nav is 67.1 at 992, 71 at 991; before it was 72 → 72.4). The scaling test probes the token, not the row, so it doesn't catch it.
  - The footer's "Joey Holzman ↗" is 2 lines at 1024 (before and after this change).
  - On phones the button's pressed/focused ink state sits beside the navy featured tile (1.12:1); the paper strip still separates them.
  - Carried from E6.5: the 828w image variant that never loads, the empty navy in the featured band, the Figma updates, the icon-size hold at 991, the nav short near 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps, the `tests/article.spec.ts:132` TS error, the dev badge at 390, the signal header beside amber on /tracker. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.7: No Home statement, bill heading display-h2 · 2026-10-03
- Built: nothing new. `SITE_NAME` in `src/lib/site.ts` (used by `layout.tsx`'s metadata title and Home's h1).
- Changed:
  - `src/app/page.tsx`: the statement is gone. `<h1 className="sr-only">{SITE_NAME}</h1>` is the first child of `<main>`. The bill heading is `type-display-h2` with a top trim. The header row is `md:items-start` (was `md:items-baseline`, Joey mid-session: "aligned top"); the source line also trims its top from md, so both cap tops sit on the tile's top padding. The row gap is `md:gap-stack` (was `md:gap-x-stack`), so a wrapped source line sits 21 / 16 below the heading, like the stacked phone layout, instead of touching it.
  - `src/components/Topbar.tsx`: no `children` slot. One className on every page (`z-0 focus-within:z-3`; the z only matters where it's sticky). **No bottom line on any page** (Joey mid-session: "get rid of the navbar border"; the prompt had asked for a shared `border-b`). `variant` only switches `data-sticky`.
  - `src/app/globals.css`: `--statement-top` deleted. **display-h1/h2/h3 are back to their pre-E6.4 sizes** (Joey mid-session: "revert the three header typographies to their earlier larger size"): 90 / 66 / 38 (42 lh) at 1440, ≤991 h3 32/36. The three blocks are byte-identical to HEAD (E6).
  - Tests: `home.spec` adds "one h1, visually hidden, naming the site" (count 1, text, ≤1px² box, `clip-path: inset(50%)`) and "the topbar is as tall on / as on an article" (1440 and 390, ±1); the no-JS test checks `#bills-heading` instead of the h1. `scaling.spec`: the display test now expects 90/66/38 at 1440 and 78.75/57.75/33.25 at 1220. The keyboard walk needed no change (the statement wasn't a stop).
  - Docs: Part A A1 (3 rows: statement removed with an sr-only h1; topbar identical with no line; bill header top-aligned), A5 (the h1/h2/h3 rows and the ≤991 note; E6.4's paragraph marked as reverted), E2/E4/E6 statement notes annotated, `docs/token-log.md` (3 lines), CLAUDE.md (E6.7 added and ticked). CLAUDE.md didn't mention the statement.
- Decisions:
  - Home's h1 is "AI in Congress" (`SITE_NAME`). The other copies of that string (page `title`s, Logo `aria-label`, the footer disclaimer) are untouched.
  - Topbar padding is the tile's (40 / 24 ≤991) on every page, so Home's bottom padding went 24 → 40.
  - The Lawmakers post (volt header) now meets the mint topbar with no line: 1.0:1, but different hues, and it reads as an edge (`screens/e6.7/article-topbar-volt-1440.png`). A band edge isn't a UI component, so WCAG 1.4.11 doesn't apply.
- Verified:
  - `npm run lint` clean; `npx tsc --noEmit` clean (the old `tests/article.spec.ts:132` error is gone); Prettier clean on touched files; `npm run build` passes (bill-stats placeholder warning); `npm run test:e2e`: **163 passed, 87 skipped, 0 failed** (+7). Includes axe 0 on `/` at all 5 widths (1440 and 390 included) and the Home keyboard walk (skip → logo → nav → tracker button → … every stop 2px, uncovered).
  - **Before (session start: statement, E6.4 type) → after (final)**, dev server, scroll 0:

    | width | topbar | bill band | featured band top |
    |---|---|---|---|
    | 1440 | 254.2 → 160 | 442.4 → 485.8 | 696.6 → 645.8 (−50.8) |
    | 1220 | 222.8 → 140 | 388 → 425.3 | 610.8 → 565.3 (−45.5) |
    | 1024 | 222.8 → 140 | 415.1 → 490.9 | 637.9 → 630.9 (−7) |
    | 390 | 320.6 → 233 | 478 → 524.2 | 798.6 → 757.2 (−41.4) |

    Article topbar: 161/141/141/234 → 160/140/140/233 (line removed). With E6.4's smaller type (before the revert), the featured band top was 617.7 at 1440 and 541.1 at 1220.
  - **Bill header** (sweep 320–2560, step 4): heading and source cap tops equal wherever they sit side by side (40 at 1440, 35 at 1220). The source line wraps at 768–780 and 992–1036 (gap 16 / 21, no overlap). The heading is 1 line at every md width, 2 at 390. No horizontal overflow.
  - **Screenshots** in `screens/e6.7/` (first screen, final code): home-{2560,1440,1220,1024,768,390}, article-topbar-1440 (Bilirakis), article-topbar-volt-1440 (French Hill).
  - **Not done:** a Figma compare (the frames still have the statement), and a live Eclipse pass (display sizes are Figma's again; h2 66 at 1440 equals Eclipse's 66, per E6.4's note).
- Open for next prompt (E7):
  - **Figma:** delete the statement row; the bill heading is Display/H2, top-aligned with the source line; no topbar bottom line; the topbar is 160 at 1440 on every page. Ignore the E6.4 Display lines (reverted).
  - With 90/66/38 back, the featured TAKE IT DOWN title is 3 lines at 1440 (the featured-band test still passes), and E6.4's notes on wrapping and header heights are reversed.
  - Carried from E6.6: the 828w image variant that never loads, the topbar row 70 → 71 at 991, the footer "Joey Holzman ↗" wrapping at 1024, the icon-size hold at 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps, the dev badge at 390, and the signal header beside amber on /tracker. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.8: Paper text on signal, ≥ 24px · 2026-10-03
- Built: `type-heading-h4-24` in `src/app/globals.css`: heading-h4 with `max(…, 24px)` at every tier (1.5rem / 1.25rem ≤991 / 1rem ≤767).
- Changed:
  - `src/app/globals.css`: `[data-tile="signal"]` `--tile-fg` ink → paper (muted = fg, line 20% of fg, so both follow), with a why comment.
  - `src/app/page.tsx`: the tracker button label is `type-heading-h4-24`; the comment above it now says paper. The hover and focus classes are unchanged from E6.6.
  - `src/app/posts/[slug]/Rail.tsx`: the cap h2 is `type-heading-h4-24`.
  - `src/app/tracker/page.tsx`: the sentence is `type-display-h3` (was text-large).
  - `src/app/styleguide/page.tsx`: `type-heading-h4-24` is in the Type list (the scaling test reads it by id), and the signal mode demo block is `type-heading-h4-24`, so it no longer shows small paper text on signal.
  - Tests: `home.spec` "signal text is never under 24px" becomes "signal text, and all text on signal, is never under 24px". It covers /, /tracker and the Bilirakis article at 1440, 1280, 991 and 390, checking signal-colored elements plus every non-empty text node inside `[data-tile=signal]`. The button test at rest expects a paper label and arrow. `article.spec` "rail: the cap is signal, its heading paper". `scaling.spec`: `type-heading-h4-24` is in the no-growth table and asserted ≥ 24 at every width.
  - Docs: CLAUDE.md §4 (the button's paper label; the paper ≥ 24px rule for signal tiles), §5 (one sentence), Progress (E6.8 added and ticked). Part A: A2 (signal row; a "24px rule" bullet with the WCAG 2 vs APCA line), A3 (signal mode row is paper; the tracker-button and signal-tile notes), A5 (a `heading-h4-24` row; "rail cap" removed from heading-h4's uses). `docs/token-log.md`: 1 carry-to-Figma line.
- Decisions:
  - **The line height is 31/24 at every tier, not h4's ≤991 ratio (26/20 = 1.3).** The size is a constant 24 below 1440, so 1.3 would make the line grow 31 → 31.2 at 991 and fail the no-growth test. At the 24px size, 31/24 is h4's own ratio.
  - **Per-tier `max()` rather than one `max(1.5rem, 24px)`:** identical at the default 16px browser font. Under a larger default it keeps h4's step-down at 991, so it doesn't grow at the jump.
  - **Size changes from the 24px floor:** the tracker button is 112 at 1440 (unchanged), 98 → 101 at 1280 (label line 27.1 → 31) and 80 at 390. The rail cap is 95 at 1440 (unchanged) and 71 at 390. The /tracker sentence is 38/42 at 1440 and 24/27.6 at 390, still one line at both.
  - I didn't recompute the APCA figures (Lc 43 / 66); they're the prompt's.
- Verified:
  - `npm run lint` clean; `npx tsc --noEmit` clean; Prettier clean on `src` and `tests`; `npm run build` passes (bill-stats placeholder warning); `npm run test:e2e` (dev server on :3000): **163 passed, 87 skipped, 0 failed**. That includes axe 0 on `/` and `/tracker` at 1440, 1280, 1024, 768 and 390 and on all 6 articles at all 5 widths (paper on signal at 24px counts as large text), plus the Home, /tracker and article keyboard walks (every stop has a 2px ring and is uncovered).
  - **Mutation check:** with the button label back on `type-heading-h4`, the widened test fails ("/ at 1280: "Explore the bill tracker", Expected ≥ 24, Received 21"). File restored.
  - **Computed** (scratch script): `type-heading-h4-24` is 33/42.6 at 2560 and 1920, and 24/31 at 1440, 1280, 992, 991, 768, 767 and 390. Button at rest: bg `rgb(255,67,1)`, label and arrow `rgb(255,255,255)`, 24px (1440, 1280 and 390). On hover: bg `rgb(8,8,12)`, paper label and arrow. On keyboard focus: the same, with a solid 2px paper ring. Rail cap h2: paper, 24/31 at 1440 and 390. /tracker sentence: paper, 38px at 1440 and 24px at 390.
  - **Screenshots** in `screens/e6.8/`: button-rest-{1440,1280,390}, button-hover-1440, button-focus-1440, rail-cap-{1440,390} (the Bilirakis rail), tracker-{1440,390}.
  - **Not done:** a Figma compare (the frames still show the E6.3 button) and an Eclipse pass (no scale, spacing or layout value changed for parity).
- Open for next prompt (E7):
  - **Figma:** signal tiles have paper text; add the Heading/H4 24px floor for the button label and the rail cap; the /tracker sentence is Display/H3.
  - The /tracker signal header still sits directly on the amber newsletter band (now paper text above ink text on adjacent warm colors).
  - Carried from E6.7: the 828w image variant that never loads, the topbar row 70 → 71 at 991, the footer's "Joey Holzman ↗" wrapping at 1024, the icon-size hold at 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps and the dev badge at 390. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.9: Article topbar in the header color · 2026-10-03
- Built: `src/app/posts/[slug]/Title.tsx`, a small client component (the article h1). It counts the title's lines at display-h2 with a ResizeObserver (on width changes and font load) and sets `data-long` when there are more than 3; `data-long:type-display-h3` steps it down. Without JS it stays h2. Added mid-session at Joey's request ("if the title exceeds three lines, it should go down a typography"); he picked in-browser measurement over a character-length rule.
- Changed:
  - `src/components/Topbar.tsx`: optional `mode?: TileMode` (default "mint"). Off mint, `border-b border-tile-line` (a hairline). No hard-coded ink was there: the Logo is `currentColor` and the links are `border-tile-fg`, so the mode recolors everything. No second logo file.
  - `src/app/posts/[slug]/page.tsx`: `headerMode` const, passed to both the Topbar and the header Tile; the h1 is `<Title>`.
  - Tests: `article.spec`, per post (one per header mode, all 5 widths): "the topbar takes the header's color…" (topbar mode and bg = the header's; logo and all 5 nav links = the topbar fg; hairline solid 1px; tabbing through the logo and 5 nav links, each ring is solid 2px in the fg, ≥ 3:1 on the topbar, and uncovered); "over 3 lines at display-h2, the title steps down to display-h3" (data-long ⇔ h2 lines > 3; size and line height equal a display-h3 reference in the same header; text-box-trim stays none). `home.spec`: "the topbar is mint, with no bottom line". `shell.spec`: "the logo never sets the topbar's height (md and up)" (logo height < nav height and < row height).
  - Docs: CLAUDE.md §4 (mint and category-color lines; E6.9 added and ticked). Part A: A1 (2 rows: article topbar, long titles), A4 (topbar paragraph with the contrast figures), A5 (display-h2 "article title" note). `docs/token-log.md`: 2 carry-to-Figma lines.
- Decisions:
  - **The hairline went off, then back on (Joey mid-session):** "no bottom border on nav", then "add the bottom border back … but only on article pages". It's keyed on `mode !== "mint"`, so the post pages get it and Home, /tracker, /privacy and /accessibility (mint, same `variant="article"`) don't. The article topbar is 161 at 1440 and 234 at 390 (Home: 160 / 233); the E6.7 "as tall on / as on an article" test allows ±1.
  - **Logo size (Joey mid-session: "small enough so that it is not needlessly increasing the container padding of the navbar"):** measured, and no change needed. From md up the logo is always shorter than the nav and the row: at 1440 the logo is 72, the nav 76.4 and the row 80 (`--topbar-row`); 63 / 67.1 / 70 at 992–1280; 62.8 / 71 / 71 at 828–991; 62.8 / 89 / 89 at 768. The row height comes from `--topbar-row` (≥ 992) or the nav (≤ 991), never the logo. Below md the logo stacks above the nav (62.8 + 16 gap + 106.2 nav = 185 row), which is the layout, not padding. The new shell test guards it; a 192-wide logo fails it (83.8 > 76.4 at 1440).
  - **Title line counts at h2, before → after** (≥ 992 / 390): Comparing 4 → h3 2 / 4 → h3 3; House 4 → h3 2 / 3 (h2); Bilirakis 4 → h3 2 / 4 → h3 3; French Hill 2 / 2; States 3 / 3; TAKE IT DOWN 3 / 3 (all h2). At 768–991 every title is ≤ 3 lines at h2. At 320, Bilirakis is still 4 lines at h3 (there's no smaller step).
- Verified:
  - `npm run lint` clean; `npx tsc --noEmit` clean; Prettier clean on `src` and `tests`; `npm run build` passes (bill-stats placeholder warning); `npm run test:e2e`: **232 passed, 88 skipped, 0 failed**. That includes axe 0 on all 6 articles at 1440, 1280, 1024, 768 and 390, the new topbar keyboard walk on all 6 modes (navy and volt included) at all 5 widths, and the existing Deepfakes (navy) full-page keyboard walk.
  - **Mutation checks** (restored): without `mode={headerMode}` the topbar test fails on all 6 ("Expected navy, Received mint", etc.); with the title threshold at 30 the title test fails on the 3 long posts at 1440 ("4 lines at h2").
  - **Computed** (scratch script, dev): the topbar bg equals the header's on all 6; the hairline is `rgba(ink, 0.12)` on blush, volt and sand, `rgba(ink, 0.2)` on sage, and `rgba(paper, 0.2)` on navy and slate.
  - **Screenshots** in `screens/e6.9/`: article-top-{blush,navy,slate,volt,sand,sage}-1440, article-top-{navy,volt,blush}-390 (blush shows the stepped-down title), topbar-focus-{navy,volt}-1440 (ring on "Privacy Policy").
  - **Not done:** a Figma compare (the frame has a mint topbar and an H2 title) and an Eclipse pass (no scale, spacing or layout token changed).
- Open for next prompt (E7):
  - **Figma:** the article topbar takes the header color with the hairline; long titles use Display/H3 (token-log).
  - **The title steps down after hydration,** so on a slow load the 3 long posts render at h2 (4 lines) first and then shrink: a one-time layout shift. The header is 637 tall at 1440 with an h3 title vs 751 with a 3-line h2 title, so a 3-line title looks much larger than a 4-line one. A middle step would smooth that; it's Joey's call.
  - Carried from E6.8: the /tracker signal header against amber, the 828w image variant that never loads, the topbar row 70 → 71 at 991, the footer's "Joey Holzman ↗" wrapping at 1024, the icon-size hold at 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps and the dev badge at 390. The E3 TODO(joey) list is unchanged; no content file was touched.

## E6.10: Root above 1440 = max(1rem, 0.859vw), cap at 2560 · 2026-10-03
- Built: nothing new.
- Changed:
  - `src/app/globals.css`: the `(min-width: 1920px) { 1.375rem }` rule is replaced by `(min-width: 1440px) { max(1rem, 0.859375vw) }` and `(min-width: 2560px) { 1.375rem }`, with a why comment. The base, ≤1280 and ≤991 rules are untouched.
  - `tests/scaling.spec.ts`: widths now start 3440, 2560, 2048, 1920, 1862, 1600 (both no-growth tables run them). New "the root is 16 to 1862, 16.5 at 1920, 17.6 at 2048 and 22 from 2560" and "zoom up to 500% doubles the text at 1920 and 2560" (a context per zoom z: viewport width/z, `deviceScaleFactor` z; passes if some z in 2–5 gives root × z ≥ 2 × the 100% root). The display test adds 2560 and 1920 rows (rounded to 2 decimals).
  - Docs: Part A A6 (CSS block, an "Above 1440" note, the `max()` paragraph now says 1281–2559 and the 1.57× zoom headroom), `docs/token-log.md` (1 line), CLAUDE.md (E6.10 added and ticked). CLAUDE.md §6 didn't quote the 1920 cap. E6.4's history paragraph in A5 ("root capped at 1920") was left alone as history.
- Decisions:
  - **The prompt's display figures were stale.** "99/71.5/44 at 1920+" and "74.25/53.6/33 at 1920" are E6.4's sizes, which E6.7 reverted, and no test asserted them. With the current tokens (5.625/4.125/2.375rem) the test expects **92.81/68.06/39.19 at 1920** and **123.75/90.75/52.25 at 2560+**.
  - Between 1440 and 1862 the root is a flat 16, so those windows get exactly the 1440 type and spacing, with the %-based columns simply wider.
  - Zoom headroom, measured: at 1920 (root 16.5), 200% gives 32 device px (< 33), but 300% gives 48. At 2560 (22), 200% gives 28 (root 14 at 1280), but 300% gives 48. Both pass the 2× check by 300%.
- Verified:
  - `npm run lint` clean; `npx tsc --noEmit` clean; Prettier clean on `src` and `tests`; `npm run build` passes; `npm run test:e2e`: **234 passed, 96 skipped, 0 failed** (+2 tests, +8 skips).
  - **Mutation check:** with the old 1920 cap restored, the root test fails ("root at 1600: Expected 16, Received 18"). File restored.
  - **Roots (dev, scratch script):** 16 at 1440 and 1600, 16.0016 at 1862, 16.5 at 1920, 17.6 at 2048, 22 at 2560 and 3440.
  - **1920×950, before → after:** root 22 → 16.5; bill heading 90.75 → 68.06; topbar 220 → 165 (article 221 → 166), still sticky (fits); featured band 950 (svh-capped) → 832.2 (its min-height; fits); grid tiles 486.8 / 520.9 (two titles grew their tiles) → 365.1 all five; the Bilirakis rail 721.8 → 475.6, sticky either way (fits with its 80 margin). 1440×790 and 2560×1305 measure identical before and after.
  - **axe:** 0 violations on `/` and the Bilirakis article at 1920×950 and 2560×1305. Keyboard (scratch): 22 stops on `/`, 25 on the article, none covered, at both sizes.
  - **Screenshots** in `screens/e6.10/`: home and article at 1440x790, 1920x950 and 2560x1305 (first screen), the `-before` versions of each, and `{home,article}-1920x950-before-after.png` side by side.
  - **Not done:** a live Eclipse pass (this is a deliberate departure from Eclipse above 1440, logged as taste) and a Figma compare (the frame is 1440, which didn't change).
- Open for next prompt (E7):
  - **The 828w image variant still hangs** (E6.5): a 1600-wide window waiting for `networkidle` on `/` times out. The root change doesn't affect `sizes`, so it's not new.
  - Carried from E6.9: the title's post-hydration step-down, the /tracker signal header against amber, the topbar row 70 → 71 at 991, the footer's "Joey Holzman ↗" wrapping at 1024, the icon-size hold at 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps and the dev badge at 390. The E3 TODO(joey) list is unchanged; no content file was touched.
- **Follow-up (same session): the featured tile hovers to amber.** Joey's call. `src/app/page.tsx`: the featured Tile gets `[--tile-hover-bg:var(--color-amber)]`; `--tile-hover-fg` stays unset, so the title, dek, arrow and pill go ink and the date ink 72% (about 6.1:1 on amber), with the same 300ms fade and the ink focus ring. Grid tiles still hover to mint. `tests/home.spec.ts`: the hover test expects amber/ink on the featured tile on focus and on hover. Docs: CLAUDE.md §4 (mint line), Part A A3 (a featured-tile note; the hover line), token-log (1 carry-to-Figma line). This bends §4's "amber is the newsletter" mapping; recorded as an exception rather than changing the rule.
- **Follow-up (same session): the grid tiles are ink, hovering to paper.** Joey's call. `src/components/PostTile.tsx`: `mode="ink"` (was paper) plus `[--tile-hover-bg:var(--color-paper)]`; `--tile-hover-fg` unset, so hover and focus give ink text, ink 72% date, 12% lines and an ink focus ring (measured at 1440 and 390; axe 0 at rest and hovered). `tests/home.spec.ts`: the hover test checks the grid tile ink/paper at rest and paper/ink on hover. Docs: CLAUDE.md §4 (ink line; mint is now unused as a hover on Home), Part A A3, token-log (1 line). Screenshots: `screens/e6.10/grid-{rest,hover,focus}-{1440,390}.png`. **Seams to look at:** at md and up the ink grid sits directly under the navy featured tile (1.12:1, a band edge, no line); below md it sits under the placeholder image, whose dark bottom (the suit) nearly merges with ink. Neither is a WCAG issue (not UI components), but both read as weak edges; a `tile-line` top border would be the smallest fix if wanted.

## E6.11: Icon sizes from --icon-inline (1.25em) and --icon-tile · 2026-11-08
- Built: tokens `--icon-inline: 1.25em` and `--icon-tile: 3rem` (≤991 2.5rem, ≤767 2rem) in the layout-token block of `src/app/globals.css`, aliased as `--spacing-icon-inline` / `--spacing-icon-tile` (so `size-icon-inline` / `size-icon-tile` exist).
- Changed:
  - Inline → `size-icon-inline`: `Topbar.tsx` ↗, `Footer.tsx` ↗, the article's "All articles" ← and source ↗ (`posts/[slug]/page.tsx`), the tracker → (`page.tsx`), and `ActionRow.tsx` (Rail's "Track this bill" and the styleguide; it's a Carbon icon in src/, so it's in scope). Tile → `size-icon-tile`: the featured arrow (`page.tsx`) and `PostTile.tsx`.
  - Label type moved to the shared parent so 1em means the label: tracker button `type-heading-h4-24` from the `<Link>` to its `<Tile>`; ActionRow `type-heading-h5` from the `<span>` to the `<Link>`. The other labels already wrapped their icon. No visual change to the labels.
  - Every Carbon icon is `size={32}`. Checked in node_modules: `ArrowRight` ships separate 16/20/24 glyphs, `ArrowLeft` a separate 16, `ArrowUpRight` only the 32, so 32 is the one drawing everywhere. (The action-row → was the 24 glyph before, so its drawing changes slightly.)
  - Raw `size-24/32/48` removed from icons (the article's `size-24` reading-time dot isn't an icon; it stays). `--spacing-48` deleted: only the two arrows used it.
  - **Back link gets `min-h-target`:** with a 22.5 icon it was 23.39 tall at 390 (the old 24px icon had been holding it at 24). Now 24.
  - `tests/scaling.spec.ts`: new "icons never grow as the window narrows; inline = 1.25 × label, tile arrows 48/42/40/32" on `/` (topbar ↗, footer ↗, tracker →, featured and grid arrows) and the Bilirakis article (back ←, source ↗, rail ↗), over the full widths table.
  - Docs: Part A A8 (role/token/size table, why em, the size={32} note), CLAUDE.md §4 (icons size from the two tokens only) and Progress, `docs/token-log.md` (1 carry-to-Figma line).
- Decisions:
  - Eclipse's tile arrows are 66 beside a 66 h2; the prompt fixed ours at 48/40/32, so the featured arrow doesn't track the title. Followed the prompt.
  - The tracker button gets 1–2px shorter (label 31 now sets the row, not the 32 icon): 112 → 111 at 1440, 80 → 79 at ≤991.
- Verified:
  - `npm run lint` clean; Prettier clean; `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:e2e`: **235 passed, 100 skipped, 0 failed** (+1 test); after the back-link fix, article + scaling specs again: 133 passed.
  - **Mutation check:** without the ≤991 `--icon-tile` the new test fails ("featured arrow at 991: Expected 40, Received 48"). Restored.
  - **Computed** (test table): inline icons are exactly 1.25 × label at every width (topbar/footer/rail ↗ 22.5 / 19.69 / 18.75 / 17.5 at 1440 / 1280 / 991 / 390; tracker → 30 from 1440 down; back ← 30 / 26.25 / 25 / 22.5; source ↗ 25 / 22.5). Tile arrows 48 / 42 / 40 / 32 (66 at 2560). Nothing grows as the window narrows, 991 included.
  - **Targets** (scratch `screens/e6.11/check.mjs`, 1440 → 320): topbar Joey ≥ 28.6, footer Joey ≥ 24, back link ≥ 24, sources ≥ 30, rail row ≥ 28.6, tracker button ≥ 79.
  - **"Joey Holzman ↗" wrapping** (sweep 760–1100, step 2, old 1.5rem icon injected for "before"): topbar 768–826 → 768–796; footer 1024–1040 → 1024–1032. **Better, not fixed.**
  - **Featured row at 390:** dek bottom = arrow bottom (0 difference) at every width checked.
  - **axe:** 0 on `/` and the Bilirakis article at 1440 and 390 (scratch), plus the suite's axe tests at all 5 widths.
  - **Screenshots** in `screens/e6.11/`: topbar, footer, tracker-button, featured, grid-tile at 1440/991/390; article-back, article-sources, article-rail-row at 1440/390.
  - **Not done:** a Figma compare (the frames have the old fixed sizes; see token-log) and a live Eclipse pass (E6.1's Eclipse arrow measurements are the reference: 30 by a 24 h4 at 1440, stepping down at 991).
- Open for next prompt:
  - "Joey Holzman ↗" still wraps in the topbar at 768–796 and in the footer at 1024–1032.
  - `.claude-runs/` appeared untracked during the session (not created by me; T1 adds it to .gitignore).
  - Carried from E6.10: the 828w image variant that hangs, the title's post-hydration step-down, the /tracker signal header against amber, the topbar row 70 → 71 at 991, the grid tiles' 308 min-height on mobile, the footer's mobile gaps, the dev badge at 390, the weak seams around the ink grid. The icon-size hold at 991 is **resolved**. The E3 TODO(joey) list is unchanged; no content file was touched.

## T1: Congress.gov API verified, client, probe · 2026-11-08
- Built: `scripts/tracker/congress.mjs` (spec §2.3: `get(path, params, { cacheVersion, auth })` and `paginate(path, params, itemsKey)`; 750 ms spacing; 5 retries with backoff that honors `Retry-After`; disk cache in `.cache/congress/` used only when a `cacheVersion` is passed, so list sweeps are never cached; `stats` request counter; the key goes only in the `X-Api-Key` header, and errors carry the path plus the API's error code, never a URL). `scripts/tracker/probe.mjs` (spec §2.4 items 1–11, plus a 5b/6b sample of recent bills: AI-titled bills for the subject term, reported bills for the stage-2 codes and the CBO shape). Fixtures in `scripts/tracker/fixtures/`: `s146-actions.json`, `hr1283-actions.json`, `s146-detail.json` (the probe refuses to write any that contain the key). npm script `tracker:probe`.
- Changed: `.gitignore` (+ `.cache/`, `.claude-runs/`); `package.json` (the script); `docs/tracker-spec.md` (§2.1–2.2 every ⚠ resolved, §2.3 cache-version note, §2.4 T1 results, §3.1 subject note, §3.2 step 9 estimate, §3.3 table with the real codes, §4.7 copy flag); CLAUDE.md Progress. §0 step 2 already had the new "latest three entries…" wording (an earlier, aborted T1 run added it), and the §0 table row doesn't contradict it, so I left both.
- Decisions:
  - An earlier T1 run (log in `.claude-runs/T1-20261108-2315.md`) stopped on `API_KEY_INVALID`. The key works now; I reused its client and probe, extending the probe with 5b/6b and a `pagination.next` check.
  - The cache version should come from the **detail's** timestamps (the list's `updateDate` is a date only), at one uncached detail request per candidate. Written into §2.3.
  - A Senate roll call links to `{congressGovUrl}/all-actions`, since no probe bill had a Senate vote (per §2.4 #11).
- Verified:
  - `npm run lint` clean.
  - Probe, cold cache: **47 requests, 0 cache hits**. Warm: **22 requests, 25 cache hits**. All 22 are list queries, which are never cached by design: auth ×2, the `/bill` filter checks ×3, summaries ×1, the 5b list pages ×8 and the counts ×8.
  - Rate-limit headers: limit 20,000, remaining ~19,700.
  - Key scan (node; prints only file names): the probe output from both runs, every file in `scripts/tracker/`, the spec, `package.json` and `.gitignore` → no key and no `api_key=` value. `.cache/` is gitignored and absent from git status.
  - WebFetch: `clerk.house.gov/Votes/2025104` is S. 146's roll call 104 (409–2); `/Votes/20255` and `/Votes/2025005` both open roll 5.
  - Congress.gov web pages return 403 to WebFetch, so the CRS term list couldn't be read directly.
- Open for next prompt (every ❌ and how it was resolved):
  - **❌ No "Artificial intelligence" CRS subject on 119th bills** (§2.4 #5). It isn't on the 4 probe bills or on S. 2938 (the *Artificial Intelligence Risk Evaluation Act*, 8 terms, none AI-specific), and three AI-titled 2025 bills have no subjects at all. **Not redesigned:** the `subjects` rule stays in config (inert), inclusion runs on watchlist + title, and summary matches go to review as specced. **TODO(joey):** the §4.7 dek and empty-body copy claim CRS indexing; they need rewording before T6 (flagged in the spec). Don't widen `subjects` to "Advanced technology and technological innovations": far too broad.
  - **❌ `textVersions[].date` can be null** (S. 146's Enrolled Bill), and the array isn't in date order. Resolved in §2.2: take the latest non-null date. T2's normalizer must handle it (§3.4 `text.date` stays a string).
  - **❌ (minor) the `/^Reported/` fallback misses Senate reports** ("Committee on … Reported by Senator …"). Resolved in §3.3: `/^Reported\b|\. Reported by /`, plus `/discharged/i`. The LoC codes `5000`/`14000`/`14500` exist anyway.
  - **❌ (minor) rate limit:** the key's header says 20,000/h, not the README's 5,000. No change: the 750 ms spacing stays.
  - Not observable in T1 (left ⚠ in §3.3): veto `31000`, a House discharge, and a Senate roll-call URL pattern.
  - "Identical bill" never appeared; NO FAKES' Senate companion S. 1367 is just "Related bill". T5's "Companion bill" needs a rule (e.g. a related bill of the other chamber whose title matches).
  - `cboCostEstimates` is absent, not empty, when there's none. List items carry no sponsor.
  - Backfill estimate: 93 list pages + 8 × candidates ≈ 2,500–4,900 requests, 31–61 min (§3.2 step 9).
  - Carried from E6.11: unchanged (the "Joey Holzman ↗" wrap, the E6.10 list, the E3 TODO(joey) list). No content file was touched.

## T2: Tracker fetch pipeline, data files, stage logic · 2026-11-09
- Built:
  - `content/tracker/config.json`: spec §3.1 verbatim, plus `_note` TODO(joey).
  - `scripts/tracker/stage.mjs`: `stageOf(detail, actions)` and `milestonesOf(actions, congressGovUrl)`, per spec §3.3. A rule matches on its LoC code **or** its text pattern, on any action. `stage.test.mjs` has 14 tests: S. 146 = 5 (both with and without `detail.laws`), H.R. 1283 = 1, synthetic stage 2 (House report, Senate report by text, Senate discharge), 3 House, 3 Senate, 4 both, 4 presented, Vetoed, the S. 146 and H.R. 1283 milestones, and a Senate roll call that links to `/all-actions`.
  - `scripts/tracker/fetch.mjs` orchestrates (sweep window, candidates, classify, write, summary). `sweep.mjs` holds the API calls (list sweeps, `fetchBill`). `normalize.mjs` maps to the §3.4 shape (HTML to paragraphs, sponsor name, cosponsor counts, latest dated text version). `csv.mjs` writes the CSV (RFC 4180, CRLF, no BOM).
  - Outputs: `content/tracker/{bills,review,meta}.json`, `content/bill-stats.json` (`placeholder: false`), `public/data/ai-bills-119.csv`.
  - `src/lib/tracker.ts`: zod loader with `getTrackerBills`, `getTrackerMeta`, `getTrackerBill`.
  - npm scripts `tracker:fetch` and `tracker:backfill`.
- Changed: `vitest.config.mts` (+ `scripts/**/*.test.mjs`); `src/lib/content.test.ts` (+1 test: the tracker data validates and holds the watchlist); `package.json`; `docs/tracker-spec.md` (§3.1 topic first-paragraph note, §3.2 `--no-sweep` flag, §3.2 step 9 measured estimate); CLAUDE.md Progress.
- Decisions:
  - **The flag is `--no-sweep`, not `--watchlist-only`.** It refetches the watchlist plus every bill already in bills.json and review.json, so running it after a backfill can't wipe the data. It leaves `meta.lastRun` as it was (`null` now), so the next normal run does a full sweep anyway.
  - **Topics use the first summary paragraph ending in a period.** CRS summaries open with a title-only line ("…Act or the NO FAKES Act of 2025"), so the literal first paragraph tags almost nothing (NO FAKES missed deepfakes).
  - Cosponsors outside D/R count as `I`. `related[].relation` joins the distinct relationship types with "; ". The review excerpt is the first matching summary paragraph, capped at 300 characters.
  - `--only` and `--dry-run` compute everything but write nothing. "Changes" compares the bills and review entries, not the meta timestamps.
  - Removed a `process.exit(0)`: on Windows it trips a libuv assertion while fetch sockets are open.
- Verified:
  - `npm run lint` clean; `npm run build` passes, and the bill-stats placeholder warning no longer fires; `npm run test:content` gives 24 passed (14 stage + 10 content).
  - **Mutation check:** with `bills[0].stage = 7`, vitest fails on the zod parse. Restored, and the file is byte-identical.
  - **Runs:** `--only` on the 4 bills took 24 requests cold (8 cache hits) and 4 warm (28 hits), 2.4 s. A `--no-sweep` write run took 4 requests. A `--dry-run --no-sweep` straight after reported **added 0 · changed 0 · removed 0 · review +0 −0**.
  - **Full sweep only** (scratch `screens/t2/sweep-count.mjs`): 93 requests in 484 s, **286 candidates**, so a backfill is about 2,400 requests and 45–50 min.
  - **Stages:** Congress.gov returns 403 to WebFetch (as in T1), and GovTrack fetches were refused (no WebFetch permission this session), so there was **no independent web check**. Compared instead with the API's latestAction and the manual statuses in `content/bills.json`: S. 146 stage 5 "Became law" (P.L. 119-12, House roll 104) matches "Became law May 19, 2025". H.R. 1283, H.R. 1121 and H.R. 2794 are stage 1, latest action "Referred to the House Committee on …", which matches "Introduced, no committee action".
  - The CSV has 19 columns in the §3.2 order, 4 rows, the quoted "Science, Technology, Communications", no BOM.
  - **Key scan** (prints file names only, 27 files: content/tracker, scripts/tracker incl. fixtures, public/data, screens/t2, configs): no key. `.cache/` is not in git status.
- Open for next prompt:
  - **Full backfill:** `npm run tracker:backfill` (PowerShell-safe; same as `npm run tracker:fetch -- --full`). About 45–50 min. After it, review `content/tracker/review.json`.
  - **Until then, Home shows watchlist-only stats** (4 / 1 / 1 / 1, `placeholder: false`).
  - **`next build` doesn't validate the tracker data yet:** nothing in `src/app` imports `src/lib/tracker.ts`. test:content does. That changes once T3's page imports the loader.
  - **Data that looked wrong:**
    - (1) TODO(joey): the `research-compute` topic's `compute` matches "Computers…" subjects and "computer-generated", so all 4 bills get it except H.R. 1283. Suggest `\bcompute\b`.
    - (2) The API names H.R. 2794's sponsor "Rep. Maria Salazar"; `content/bills.json` has "María Elvira Salazar".
    - (3) S. 146's "Reported by committee" milestone is its Senate discharge (spec rule, but the label reads oddly).
    - (4) The `subjects` rule is still inert (T1 ❌).
  - Carried from T1: the §4.7 copy TODO(joey), the companion-bill rule for T5, and Senate roll-call URLs. Carried from E6.11 unchanged. No post was touched.

## T3: Tracker page shell and bill table · 2026-11-09
- Built:
  - `content/tracker/page.json`: spec §4.7 copy (h1, dek, source line, "Bill finder"), the column and row labels, the empty body, and the §4.4b pagination strings for T4; `_note` TODO(joey). Validated by zod in `src/lib/tracker.ts` (new `getTrackerPage()`, type `TrackerPage`).
  - `src/app/tracker/BillTable.tsx` (`.bill-table`: the aria-hidden column header plus the `<ol>`) and `BillRow.tsx` (`<li id>` > `<details>` > `<summary class="bill-row">` with phrasing-only cells, sr-only "Status:" / "Latest action:" / "cosponsors", a `{/* T5 */}` panel slot after the summary).
  - `src/app/tracker/page.tsx` rewritten (metadata and robots kept): mint Topbar, paper Tile (top `tile-md`, bottom `tile-lg`), header (display-h2 h1 with "119th Congress" in signal, h4 dek on `--measure`, h5 muted source line with `<time>` of `fetchedAt`), the "Bill finder" h2 (display-h3, `tile` below), marked slots for T4's controls and pagination. Every bill renders, in bills.json order (latest action, newest first).
  - `tests/tracker.spec.ts`: layout per viewport (grid track count 6/4/2), the text limits over every row, row symmetry and the step's clearance, Enter/Space + 2px ring, axe, no horizontal scroll at 320 and 400% of 1280, no-JS renders every bill in order. The 1440 project also runs 2560, 991 and 320.
- Changed:
  - `src/app/globals.css`: §4.4 layout tokens (`--bill-col`, `--title-min`, `--status-col-wide/-medium`, `--action-min`, `--cosponsors-col`, `--chevron-col`, `--table-gap-wide/-medium`, `--bar-height`, `--bar-max`, `--status-overhang`, `--table-row-pad`) and a `.bill-table` block in `@layer components`: stacked by default, `@container (width >= 38.5rem)` medium and `(width >= 66.5rem)` wide, each with its sum in a comment.
  - `tests/shell.spec.ts`: moved from /tracker to /privacy (/tracker now has 220 tab stops); the keyboard list adds the body's "Vercel" link. `tests/home.spec.ts`: the signal-24px test expects signal *text* on /tracker (its header is no longer a signal tile).
  - CLAUDE.md §3 icons + `ChevronDown`; Progress. `docs/token-log.md` (3 lines).
- Decisions:
  - **Medium/stacked latest action:** "Latest: {text}" clamps to 2 lines and the date sits on its own muted line below, not inline as "… · {date}": inline, a clamped action would cut the date off. Deviation from §4.4 wording.
  - Sponsor reads "Rep. Pat Harrigan (R-NC)" (the rail's format without "Sponsor:").
  - Wide/medium status cell takes `margin-block-end: −overhang`; stacked doesn't. Medium main column stacks `stack-sm` (8) apart (the spec gives no value); stacked uses `stack`.
  - No ≤991 step for the track tokens: they're rem and grow at the root jump, but the table switches layout by its own width, so nothing grows within a layout. Not added to scaling.spec's no-growth list.
  - Symmetry is checked on every row (a row's top padding = its last text line to the rule), not just one-line-title rows, since §4.4 says long text keeps the padding symmetric.
- Verified:
  - Full backfill had run: meta.json has 220 included (stages 211/3/5/0/1), 66 in review.
  - `npm run lint`, `npx tsc --noEmit`, `npm run build` pass (/tracker static). `npm run test:content` 24 passed.
  - `tests/tracker.spec.ts`: all 18 runnable tests passed in all 5 projects (first run, healthy server); the trimmed zoom test passed again later. **Mutation:** without the −overhang margin the symmetry check fails ("S. 146: padding 29.5 above, 40.5 below"). Restored.
  - Measured chars per line (the title's / action's box width in its own ch): 2560 wide 60 / 47.9 (both at their caps) · 1440 wide 44 / 33 · 1280 wide 45.3 / 33.9 · 1024 wide 25.7 / 24.3 · 991 medium 60 / 47.9 (clamped) · 768 medium title 39.8 · 390 stacked title 37.4 · 320 stacked 28.7 / 28.7. All titles share one box width per layout (block box capped at 60ch).
  - Longest title hr10502-119 (269 chars), longest action hr8516-119 (393 chars): both clamp, nothing overflows. Screenshots in `screens/t3/`: `top-`, `table-`, `longest-title-`, `longest-action-{2560,1440,1280,1024,991,768,390,320}.png`.
  - Built /tracker HTML: 1,170 KB raw, **66 KB gzipped** (RSC 35 KB gzip) before T5 panels.
  - **Full test:e2e NOT completed.** The shared dev server on :3000 (PID 14472, not started this session) became CPU-starved after a full run was killed at the tool's 10-min limit (~40% CPU busy with nothing of mine running; `/` 14 s, `/tracker` 21 s, article pages hang). Starting `next start` or inspecting/killing processes needed approval I didn't have. Serial 1440 run of home + shell + tracker: 28 passed; the 3 failures were timeouts (2 on article-page navigation, the known 828w image hang; 1 zoom test, since trimmed and passing).
  - Figma: the MCP permission was declined, so no BillFinder screenshot or compare. Known differences per spec §5 stand (Figma's action in H5, 4 segments for step 5, "S. 146 · House", dek, pagination copy), plus the medium date-line deviation above.
  - Eclipse parity not needed: no shared token changed.
- Open for next prompt:
  - **Rerun `npm run test:e2e` on a fresh dev server** (restart :3000 first) and confirm all green; the expected changes are only the shell move and the home signal tweak.
  - TODO(joey): approve `content/tracker/page.json` copy.
  - Stacked layout has no header and no top rule above the first row (per spec); looks fine in screenshots, but worth a look.
  - Carried from T2: the `compute` topic regex, H.R. 2794 sponsor name, S. 146 "Reported" milestone label, inert `subjects`, review.json triage, companion-bill rule, Senate roll-call URLs. Carried from E6.11 unchanged. No post was touched.

## T4: Tracker finder controls, pagination, empty state · 2026-11-09
- Built (all in `src/app/tracker/`):
  - `finder.ts`: pure `parseState`/`toSearch` (URL ⇄ state, defaults left out, unknown values fall back), `matchesQuery`, `filterBills`, `sortBills`, `topicCounts`, `paginate`, `fill` (page.json `{placeholders}`). `finder.test.ts`: 28 vitest tests.
  - `BillFinder.tsx` (`"use client"`): state, status count, empty state, wiring. `FinderControls.tsx` (search, chamber/status/sort selects, topic radio pills). `Pagination.tsx`. `Select.tsx` (native select + ChevronDown; `field` = bordered 3.5rem, else the borderless pager select, ≥ 2.5rem tall; 5 uses).
- Changed:
  - `page.tsx` renders `<BillFinder bills copy topics>` in place of `<BillTable>` (still a server component). `BillTable.tsx` takes `children`, shown under the column header instead of an empty `<ol>`.
  - `src/lib/tracker.ts`: page schema + `finder` (labels and select options as `{value,label}` arrays, validated against finder.ts's value lists, each value exactly once), `empty`, and `pagination.rangeOne/statusOne/statusEmpty`; new `getTrackerTopics()` (id + label from `config.json`).
  - `content/tracker/page.json`: those strings added (still TODO(joey)). No other content touched.
  - `globals.css`: `--finder-search` 24rem, `--pill-count` 1.375rem; `.finder-pill` (checked = ink/paper, ring via `:has(:focus-visible)`); `.bill-pager` container (< 38.5rem: the range takes its own first line). `docs/token-log.md` 1 line.
  - `tests/tracker.spec.ts`: the T3 limits tests now run with JS off (with JS only page 1 renders, so they'd cover 25 rows, not 220); 8 new tests (axe filtered / page 2 / empty, zzzz + Clear, topic URL round-trip, Next/Previous/last page, page-3 reset, 50 per page, names + targets, pager wrap at 390/320).
  - CLAUDE.md §3 icons (+ ChevronLeft/Right) and Progress.
- Decisions:
  - **URL is the state.** `useSyncExternalStore` over `location.search` (writes via `history.replaceState` then notify). The server snapshot is `null`, so SSR/no-JS = every bill, default sort, no pager; the URL applies right after hydration with no setState-in-effect. `useSearchParams` would have bailed the static page out to client rendering (no rows without JS).
  - **Search:** a query shaped like a bill number (`hr 2794`, `H.R.2794`, `2794`, `s146`, `sjres 12`) matches that number only (exact, not prefix: "s146" doesn't show S. 1460); otherwise every word must appear in label + title + sponsor, NFD-folded.
  - **URL values:** `chamber=house|senate`, `status=1…5` (the stage number), `sort=latest|introduced|cosponsors|number`. "Bill number" sorts by type (H.R., S., H.J.Res., S.J.Res.) then number.
  - **Status line:** "Showing 1–25 of 220 bills"; "Showing 1 bill"; "No bills match" (new strings). Before mount it reads 1–220. `mt-32` below Topics, `mb-16` above the table (spec gives none).
  - **Clear all filters** reuses the Newsletter Submit pattern (`data-tile="ink" data-interactive`, so it hovers to mint), as a pill with 16/24 padding and heading-h5.
  - **Pager selects use `htmlFor` labels, not wrapping ones:** wrapped, the selected value joins the name ("Page 2").
  - **Pager buttons are 2.5rem:** 40 at 1440 and ≤ 991, 35 at 1024–1280 (root 14). The test asserts 2.5 × root.
  - **Payload:** bills ship whole as client props (T5 needs the panel fields). Built /tracker HTML 879 KB raw / **93 KB gzip** (T3: 66), RSC 60 KB gzip.
- Verified:
  - `npm run lint`, `npx tsc --noEmit`, `npm run build` pass; `npm run test:content` 52 passed.
  - **Playwright against `next start` on :3100** (scratch config `screens/t4/playwright.prod.config.ts`), because the shared dev server on :3000 still hangs (every `goto` timed out; not started by me, no approval to kill it). tracker + home + shell: **151 passed, 44 skipped, 0 failed** at all 5 projects. The full suite on prod: 262 passed, 27 failed. Every failure is in `article.spec` / `scaling.spec` and visits a dev-only route (the draft TAKE IT DOWN post, `/styleguide`), which 404 in production. A second `next dev` on :3200 wouldn't start (likely Next's one-dev-server lock while :3000 runs), so **those two specs weren't rerun this session**. T4 touched nothing they use (new CSS selectors and tokens only).
  - **Mutation:** without the page-1 reset, "changing a filter on page 3" fails (`?chamber=house&page=3`). Restored and rebuilt.
  - **Screenshots** `screens/t4/{default,filtered,page2-focus,pagination,empty}-{1440,1024,768,390}.png` (via `screens/t4/shots.spec.ts`).
  - Figma: MCP permission declined again, so no compare against BillFinder `2209:2` / BillFinderNoMatch `2212:536`. Known differences per spec §5 #5–6 (the count, URL state, pagination copy and the 25 default).
  - Eclipse parity not needed: no shared token changed.
- Open for next prompt:
  - **Restart the dev server on :3000, then run the full `npm run test:e2e`** (article + scaling haven't run since T3).
  - Delete `screens/t4/shots.mjs` (a dead scratch file; the rm needed approval).
  - TODO(joey): approve the new finder, empty and pagination strings in `content/tracker/page.json`.
  - At 390 the pager takes three lines (range / per page / pager, right-aligned); at 320 the same. Clean, but it's tall.
  - The native search field's clear "×" is the browser's (blue in Chrome).
  - T5: hash links (§4.5) must clear filters and jump pages; `setSearch` and `paginate` in BillFinder/finder.ts are the hooks.
  - Carried from T3 unchanged (copy TODO, stacked layout's missing top rule, the T2 data list, E6.11 list). No post was touched.

## T5: Tracker expanded rows · 2026-11-09
- Built:
  - `src/app/tracker/BillPanel.tsx` (plain, no hooks): spec §4.5 in each `<details>` after the summary. Full title first (only when the row clamps it, `aria-hidden` since the summary already names it); "Summary" h3 + `version · <time>` + first 3 paragraphs + "Read the full CRS summary on Congress.gov ↗", or muted "No CRS summary yet."; a `<dl>` (Where it stands `<ol>` with "Roll call n ↗", Committees, Cosponsors "21: 11 D, 10 R · 18 original · Bipartisan", Companion bill, Subjects = policy area + ≤ 6 subjects, CBO cost estimate, Text, Law), terms with no data omitted; footer "View on Congress.gov ↗". External links use the existing sources pattern (sr-only " (external site)" + ArrowUpRight `size-icon-inline`); every date is a `<time>` via `formatDate`.
  - `finder.ts` `revealBill(bills, state, id)`: clears only the filters that hide the bill, keeps sort/per, and sets the page holding it; null for a non-bill hash (e.g. `#main`). 4 vitest tests.
  - `tests/tracker.spec.ts` T5 tests: axe with S. 146 open (all 5 projects = wide/medium/stacked), S. 146 content (Became law, milestones in date order, external link's name and href), `/tracker?chamber=house#s146-119` opens it on its page with the filter cleared, companion link H.R. 10567 → S. 5417, chevron transform flips and has 0s transition under reduced motion, every panel open at 320 (no JS, all 220) with no horizontal scroll.
- Changed:
  - `BillRow.tsx`: renders `<BillPanel>`; new `panelCopy` prop; exports `markClamped(details)` (title `scrollHeight > clientHeight` → `data-clamped`), called on summary click before the row opens. `BillTable.tsx` passes `copy.panel`.
  - `BillFinder.tsx`: hash effect (on mount after the URL state applies, and on `hashchange`) → `revealBill` → `setSearch` → `openTarget()` opens and scrolls the row (instant under reduced motion), now or after the re-render brings it onto the page. `instant()` shared with `goTo`.
  - `src/lib/tracker.ts`: `panel` copy schema; bills gain derived `companions` ({id, label, href}); `TrackerBill` is now that derived type.
  - `content/tracker/page.json`: `panel` strings (still under the file's TODO(joey)).
  - `globals.css`: `.bill-panel` (one column, `tile` row gap, `tile` bottom padding; in the wide @container it joins `.bill-head, .bill-row` for the tracks, summary in columns 2–3, facts 4 → end, the rest 2 → end), `.bill-prose` (min(--measure, 65ch)), `.bill-panel-title` (shown on `data-clamped`, or always under `@media (scripting: none)`), `.bill-panel a` shares `.prose-article a`'s link style. **Chevron uses `transform: rotate(180deg)` instead of `rotate:`** so the prompt's "computed transform" check is literal.
  - `tests/tracker.spec.ts`: row locators `.bill-table ol > li` → `.bill-table > ol > li` and empty `.bill-table h3` → `.bill-table > div > h3` (the panels add nested `<ol>`s and h3s).
  - `docs/tracker-spec.md` §4.5: the companion rule. CLAUDE.md Progress.
- Decisions:
  - **Companion rule:** "Identical bill", or a tracker bill from the other chamber with the same title (32 identical + 16 same-title links). NO FAKES' S. 1367 isn't in the tracker, so H.R. 2794 shows none. Non-tracker companions link to Congress.gov (URL built from the bill's own, same Congress); none occur in the current data.
  - **Wide panel columns:** the summary spans title + status, the facts span latest action → chevron (more balanced than the title column alone; the prompt's "starts at the title column, two columns" holds). Medium and stacked: one column, full width (the prompt's container-query wording over §4.5's "≥ 1280 / ≥ 1024").
  - "Read the full CRS summary" links to the bill page (its default tab is the summary); same URL as the footer link. Congress.gov couldn't be fetched to confirm a summary-tab path.
  - Cosponsors term omitted when the count is 0; independents appear in the split only when > 0. Committees read "{chamber} {name} · {latest}, {date}".
  - " (external site)" is hardcoded, as in Topbar, Footer, ActionRow and the article sources.
  - No new tokens; no shared token changed, so no Eclipse parity pass is needed and token-log.md has no entry.
- Verified:
  - `npm run lint` clean, `npx tsc --noEmit` clean, Prettier clean, `npm run build` passes, `npm run test:content` **56 passed**.
  - **Payload:** built `/tracker` HTML 1,500 KB raw / **127 KB gzip** (T4: 93), RSC 59 KB gzip. Under 300 KB, so no excerpt cut (one number; there was no second measurement).
  - **Playwright against `next start` on :3100** (`screens/t4/playwright.prod.config.ts`; :3000 still hangs, and a run against it stalled for 10 min). tracker + home + shell: **177 passed, 48 skipped, 0 failed**, all 5 projects. Full suite: **288 passed, 27 failed**: the same 27 as T4, all in `article.spec` / `scaling.spec` on dev-only routes (the draft TAKE IT DOWN post, `/styleguide`) that 404 in production.
  - Found while testing: a hash set on an already-loaded page *before hydration* doesn't open the row (`page.goto("/tracker")` then an immediate `goto("#…")`). Real loads with a hash work, and so do hashchanges after hydration. The companion test now waits for hydration first. Low real-world impact; not fixed.
  - **Screenshots** `screens/t5/s146-{1440,1024,768,390}.png` and `no-summary-1440.png` (H.R. 10502: the longest title with no summary, so the clamped-title line shows), via `screens/t5/probe.spec.ts` + `probe.config.ts`.
  - **Congress.gov spot check: not done.** Every congress.gov page returned 403 to WebFetch (S. 146 and H.R. 10502: all-actions, cosponsors, committees), and the GovTrack fallback was refused (no WebFetch permission). The panel only renders bills.json fields, which T2 compared with the API.
- Open for next prompt:
  - **Restart the dev server on :3000 and run the full `npm run test:e2e`.** article + scaling haven't passed on dev since T3.
  - **Hand spot-check** S. 146 and H.R. 10502 on Congress.gov (milestones, cosponsor split, committees).
  - TODO(joey): approve the `panel` strings in `content/tracker/page.json`.
  - CRS summaries split lists into paragraphs, so a 3-paragraph excerpt can end mid-sentence (S. 146's third ends "…intimate visual depictions of"). Options: stop at a paragraph ending in a period, or show 2. Not changed.
  - `BillFinder.tsx` is 192 lines (state, wiring, hash). Could split the hash effect into a colocated hook if it grows.
  - Delete the scratch files `screens/t4/shots.mjs` and `screens/t5/*` when done (screens/ is gitignored).
  - Carried from T4 unchanged (pager height at 390/320, the search field's native ×, the T3/T2/E6.11 lists). No post was touched.

## T6: Tracker wired to Home and the rail, methodology, docs · 2026-11-09
- Built:
  - `src/lib/bills.test.ts`: 2 vitest tests for `statusLine`: a tracker bill (S. 146) takes `stageLabel` + latest action + fetch date (the fetch date is read from meta.json, so a refresh doesn't break the test); a bill not in the tracker falls back to the manual status.
  - The "How this list is built" section on `/tracker` (`page.tsx`, after the finder, `mt-tile-lg`): an h2 in `type-display-h3`, the three paragraphs, "Download the data (CSV)" (`<a download>` to `/data/ai-bills-119.csv`, then muted "73 KB · 220 rows"), an h3 "How to cite" and the citation. It sits in `prose-article max-w-measure type-text-article`, as the article's Sources section does, so it gets the same link style and rhythm.
- Changed:
  - `src/lib/bills.ts` `statusLine`: when `getTrackerBill(id)` has the bill, it returns "{stageLabel}, latest action {date}, as of {fetch date}". Otherwise it returns the manual "{status} as of {asOf}". The rail's markup is unchanged.
  - `content/tracker/page.json` + `src/lib/tracker.ts`: a `methodology` copy block (heading, exactly 3 paragraphs, download, downloadMeta, cite, citation) with `{congress}`, `{date}`, `{url}`, `{size}` and `{rows}` placeholders, filled in by finder.ts `fill`. It falls under the file's existing TODO(joey).
  - `page.tsx`: the h1 span and source line now use the same `values`/`fetched` as the methodology (same output).
  - Docs: Part A **A11. Bill tracker** (points to the spec; a table of the T3/T4 tokens). CLAUDE.md §3 (the tracker bullet: content/tracker/, scripts/tracker/, never read `.env.local`; dropped "/tracker is a stub"), §4 (signal on /tracker = the h1 span and the status bar only; secondary text is `text-tile-muted`, never a raw gray), §9 (`test:content`, `tracker:probe`, `tracker:fetch` with its flags, `tracker:backfill`), and Progress. build-prompts "Open items": removed "Bill tracker page"; added the review.json triage and the Figma carry list (spec §5 #1, 2, 3, 6, 7). E7's gate now reads "If T6 isn't ticked", and its deferred list no longer has "the bill tracker page".
- Decisions:
  - **Home needed no change.** `content/bill-stats.json` is `placeholder: false` (220 / 9 / 6 / 1, asOf 2026-11-09), and Home already shows "Congress.gov, updated Nov 9, 2026" from `asOf`.
  - **Rail line wording** (the spec gives none): "Became law, latest action May 19, 2025, as of Nov 9, 2026". Like the old line, it's composed in bills.ts.
  - **Row count = `bills.length`** (fetch.mjs writes bills.json and the CSV in one run); the size comes from `statSync` at build time. Both were checked against the downloaded file.
  - **Citation URL** is `${SITE_URL}/tracker`. While SITE_URL is unset (the "#" fallback), it reads just "/tracker". It needs SITE_URL set before launch.
  - Methodology paragraph 3 says "we refresh it by hand" (no daily claim until T7 runs, spec §3.6).
  - **Deliberate addition to the Figma frame:** the methodology/CSV/cite section (already listed in spec §5 #5).
  - **The old /tracker signal-header open item (carried since E6.8) is gone:** the header is a paper tile since T3, and signal is only the h1 span and the bar.
  - No tokens added or changed, so no token-log entry and no Eclipse pass.
- Verified:
  - `npm run lint` clean, `npx tsc --noEmit` clean, Prettier clean, `npm run build` passes, `npm run test:content` **58 passed** (+2).
  - **Full e2e against `next start` on :3100** (`screens/t4/playwright.prod.config.ts`; log `screens/t6-e2e.log`): **288 passed, 120 skipped, 27 failed**. These are the same 27 as T4/T5: all in `article.spec`/`scaling.spec`, on the draft TAKE IT DOWN post and `/styleguide`, which 404 in production. tracker, home and shell are all green.
  - **The dev server on :3000 still hangs** (tracker `ERR_ABORTED`, the TAKE IT DOWN page timed out at 120 s). Starting a second dev server, curl and netstat all needed approval I didn't have. So **axe and the rail screenshot on the TAKE IT DOWN draft weren't run.** The Bilirakis post (H.R. 1283, also in the tracker) stood in.
  - **axe** (`screens/t6/check.spec.ts`, prod): 0 violations on `/`, `/tracker` and the Bilirakis article at 1440 and 390.
  - **Rail** (prod, Bilirakis): "Introduced, latest action Feb 13, 2025, as of Nov 9, 2026".
  - **CSV:** clicking the link fires a download, `ai-bills-119.csv`, 220 data rows (73,153 bytes on disk).
  - **Screenshots** `screens/t6/`: `home-bills-`, `rail-` (Bilirakis), `methodology-{1440,390}.png`.
  - Figma: no frame for the methodology (it's an addition); no compare.
- Open for next prompt:
  - **Restart the dev server on :3000, then run the full `npm run test:e2e`.** article and scaling haven't passed on dev since T3. Also run axe and take a rail screenshot on the TAKE IT DOWN draft (`npx playwright test --config screens/t6/check.dev.config.ts`).
  - Set `SITE_URL` before launch (the citation's URL).
  - Part A A9 still says "`/tracker` is a stub page" (not in this prompt's list; left alone).
  - `content/bills.json`'s `status`/`asOf` are now only the fallback for bills not in the tracker; all 4 current rail bills are in it.
  - **Every TODO(joey) the T-series added:**
    - `content/tracker/config.json` `_note` (review the patterns, topics and watchlist), including the `research-compute` topic's `compute` matching "Computers…" (suggest `\bcompute\b`) and the inert `subjects` rule (T1/T2);
    - `content/tracker/page.json` `_note` (approve all the copy: header, finder, panel, pagination, empty state and now the methodology);
    - triage `content/tracker/review.json` (66 bills);
    - the spec §4.7 copy flag (dek and empty body reworded to the real inclusion rule, T1);
    - H.R. 2794's sponsor name (the API says "Maria Salazar", bills.json says "María Elvira Salazar"; T2);
    - hand spot-check S. 146 and H.R. 10502 on Congress.gov (T5);
    - T7: add the `CONGRESS_API_KEY` repository secret.
  - Carried from T5 unchanged: the 3-paragraph summary cut mid-sentence, the pre-hydration hash, the pager height at 390/320, the search field's native ×, the S. 146 "Reported" label, Senate roll-call URLs, the E6.11 list (the "Joey Holzman ↗" wrap and the E6.10 items, minus the signal header). No post was touched.

## E7: QA pass · 2026-11-09
- Built: nothing in the repo. Scratch QA in `screens/e7/` (gitignored): `e7.config.ts` (`next start` on :3100 via Playwright's webServer), `e7.dev.config.ts` (a fresh `next dev` on :3200; it can't start, see Open), `qa.e7.ts` (items 1–7 and 9), `image.e7.ts`, `parity.e7.ts`, `probe.e7.ts`. Reports: `report-{1-axe,2-contrast,3-keyboard,4-zoom,5-reduced-motion,6-nojs,7-root,9-best-practices,10-parity}.md`, `e2e-prod.log`. The old `qa-axe-contrast.md` there is from an earlier, aborted E7 run (stale: it predates the signal/tracker changes).
- Changed: `CLAUDE.md` (E7 ticked). **No source, token or content change: no defect was found that needed one.** `content/bill-stats.json` was flipped to `placeholder: true` for one build and restored byte-identical (`cmp`).
- Decisions:
  - **Pages checked:** /, /tracker (with S. 146 expanded, and the empty state `?q=zzzz` for contrast), /privacy, /accessibility and the 5 published posts, on a production build. **The draft TAKE IT DOWN post wasn't checked** (dev only; see Open).
  - **Contrast script:** every visible text node (and input placeholders), its color composited over the real stacked backgrounds with a canvas, so the 72% muted blends are measured as painted. sr-only text is skipped. Hover states of every `[data-interactive]` tile are measured too (reduced motion, so no fade). Threshold 3:1 only at ≥ 24px, as the prompt says (600 isn't "bold" under WCAG).
  - **Lighthouse isn't installed** (adding it needs approval), so item 9 is the equivalent: axe's full rule set (Lighthouse's a11y audits are axe) plus its best-practices audits replicated in Playwright: doctype, charset, viewport meta, lang, console errors/warnings, page errors, 4xx/5xx and failed requests, DevTools (CDP Audits) issues, image aspect ratio and load, requests still pending.
  - **Claude in Chrome isn't available in this session,** so the Eclipse pass ran in Playwright against the archive, as E6.6 did.
- Verified:
  - `npm run lint` 0 errors (1 warning, in the scratch `screens/t6/check.dev.config.ts`); `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:content` 58 passed.
  - **Full e2e on `next start`** (`screens/t4/playwright.prod.config.ts`): **288 passed, 120 skipped, 27 failed**, identical to T6. All 27 are the draft post and `/styleguide` (dev-only routes, 404 in production).
  - **1 axe:** 0 violations on all 9 pages at 1440 and 390.
  - **2 contrast:** 1,811 text nodes, 112 distinct pairs, **0 failures**, min 3.47 (signal text on paper and paper on signal, all ≥ 24px). Lowest small-text pairs: slate/paper 5.16, link blue 6.05, navy hover date on amber 6.12.
  - **3 keyboard** (sticky live, no reduced motion) at 1440, 1024 and 390: Home 20 stops, Bilirakis article 24. Every stop has a ring ≥ 2px, is in the viewport, and is topmost at its center.
  - **4 zoom** (1280 at 200% = 640×400 @2x, at 400% = 320×200 @4x): 0px horizontal overflow on all 9 pages, no text off screen, nothing clipped horizontally. (My first run flagged sr-only "(external site)" text as off screen; a false positive, filtered out.) Screenshots: `zoom-{200,400}-{home,tracker,article}.png`.
  - **5 reduced motion** at 1440×900 and 1024×768, all pages, after a scroll: 0 sticky/fixed elements, 0 transitions or animations with a duration (pseudo-elements included).
  - **6 no-JS** at 1440 and 390: every page is 200 with one h1, `main#main`, the newsletter form (email + submit), no broken images, no overflow; /tracker renders all 220 rows. Screenshots: `nojs-{home,tracker,article}-1440.png`.
  - **7 fluid root** (root / body / article p): 1440 16 / 16 / 20 · 1366 15.08 / 15.08 / 18.84 · 1280 14 / 14 / 18 · 1024 14 / 14 / 18 · 991 16 / 14 / 18. **The article body is never below 18.** `<body>` computes 14 at 991 although the root is 16; I didn't trace why (no visible text uses the body's own size on the pages checked). Worth a look.
  - **8 placeholders:** no file is `placeholder: true`. `bill-stats.json` has real counts (220 / 9 / 6 / 1, asOf 2026-11-09, `placeholder: false` since T2), so the build warning correctly doesn't fire. **The warning still works:** with the flag flipped, `next build` printed "⚠ content/bill-stats.json holds Figma placeholder numbers…" (once per worker, 5×). Other placeholders still in place: the `public/images/trump.png` fallback image (every post); `[EMAIL]` (accessibility.mdx:59, privacy-policy.mdx:37); `[TEST DATE]` (accessibility.mdx:35) and both pages' BEFORE PUBLISHING blocks; the TODO(joey) list (E3 and T6, unchanged).
  - **9 best practices** (/ and Bilirakis at 1440 @1x and 390 @3x): clean on every audit: no console messages, no failed or pending requests, no DevTools issues.
  - **E6.5's "828w image never loads" doesn't reproduce:** on a fresh production build every `/_next/image` width (640–1920, 828 included) answers in ≤ 36 ms with WebP/AVIF and PNG Accept headers. The tiny `naturalWidth` values (208 at 390 @3x) are Chrome dividing by the srcset density, not small files.
  - **10 Eclipse parity** (archive vs ours at 1440 / 1366 / 1280 / 1024 / 991 / 768 / 390): the root (16 / 15.1 / 14 / 14 / 16 / 16 / 16), the h2 size and line height (66 / 62.2 / 57.8 / 57.8 / 40 / 40 / 34) and tile padding at ≥ 1024 (40 / 37.7 / 35 / 35) **match exactly**. Differences already on record: tile pad 24 vs 20 at ≤ 991 (Part A); hover 0.3s `ease-out` vs `ease`; Eclipse's sticky has no fit or motion guard (A9). Our topbar stays at top 0 after scrolling on desktop and scrolls away at 390. **Nothing was clearly off, so no token changed** (so no before/after pair; `parity-{eclipse,ours}-<width>.png` are the reference shots).
- Open for next prompt:
  - **The shared dev server on :3000 (PID 14472) is orphaned and broken:** its stdout pipe is gone, every log write throws `EPIPE`, and every article answers 500 ("Jest worker encountered 2 child process exceptions"). It also blocks a second `next dev`. Stopping it needed approval I didn't have. **Joey: `taskkill /PID 14472 /F`, then `npm run dev`,** then run `npm run test:e2e` (article and scaling haven't passed on dev since T3) and `npx playwright test --config screens/e7/e7.dev.config.ts qa` to cover the draft TAKE IT DOWN post (axe at 1440/390, contrast, its Chart table).
  - **Small finding, not fixed (no effect today):** the article figure's `sizes` is `(min-width: 768px) 50vw`, but at 1024–1279 the figure is the 560px measure (55vw). With real, larger images the browser may pick a slightly small variant there. A `sizes` that matches the measure would fix it; with the 640px placeholder there's no difference.
  - Both images lazy-load (Next's default), so the featured cell is stone for a moment on first paint at 1440×900. Adding `priority` to the Home featured image is Joey's call.
  - **Deferred, not built:** Copy article link, the Related tiles on the article, the chart treatment (`<D3Chart>` renders nothing), the newsletter design.
  - Carried unchanged: the T6 TODO(joey) list, SITE_URL before launch, Part A A9's stale "/tracker is a stub" line, and the T5/E6.11 list (summary cut mid-sentence, the pre-hydration hash, the pager height at 390/320, the search field's native ×, the "Joey Holzman ↗" wrap, the post-hydration title step-down, the grid tiles' 308 min-height on mobile, the weak seams around the ink grid). No post was touched.

## T8: Tracker data fixes, topics, excerpts, split files · 2026-11-09
- Built:
  - `scripts/tracker/config.test.mjs`: 8 vitest cases over config.json's title patterns (the 4 must-not-match and 4 must-match titles).
  - `content/tracker/index.json` (row fields only, one bill per line, sorted like bills.json) and `public/data/tracker/bills/{id}.json` (one compact panel file per bill; stale files deleted). Written by fetch.mjs.
  - `--rebuild` in fetch.mjs + npm `tracker:rebuild`: offline (no requests, no key needed), re-classifies every bill whose detail is cached, plus the watchlist and the bills in the files.
- Changed:
  - `content/tracker/config.json`: `\bgenerative\b`; A.I. pattern `(?!\/AN)`; the 17 topics from the prompt, in its order. `topicOverrides` kept (empty).
  - `scripts/tracker/congress.mjs`: offline mode (`goOffline()`; a cache miss throws), `getLatest()` (the detail is still fetched fresh online, but its latest copy is stored with version `"latest"`), `cachedLatest()`. The missing-key error now fires at the first request, not at import, so a rebuild runs without a key.
  - `sweep.mjs`: `fetchBill` uses `getLatest`; new `cachedBillIds()`.
  - `normalize.mjs`: `excerptOf()` and `summary.excerpt`; the policy area joins the topic text (the prompt's list); `companionsOf()` (moved from `src/lib/tracker.ts`, same rule).
  - `fetch.mjs`: `--rebuild`; topics and `topicOverrides` out of the config hash; companions computed after classification; the split files.
  - `stage.mjs`: discharge milestone → "Discharged from committee" (stage unchanged); `stage.test.mjs` S. 146 expectation + 1 new test (report vs discharge labels, discharge still stage 2 "Reported by committee").
  - `src/lib/tracker.ts`: `summary.excerpt`, `companions` in the bill schema (no longer derived here); `indexBillSchema` → `TrackerIndexBill` + `getTrackerIndex()`; exported `billDetailSchema` → `TrackerBillDetail`. `src/lib/content.test.ts`: +1 test (index ids = bills ids in order, the bills folder holds exactly those files, each parses).
  - Data: content/tracker/{bills,index,meta}.json, content/bill-stats.json (215 / 9 / 6 / 1), the CSV, the per-bill folder. `docs/tracker-spec.md` §3.1 (patterns, topic table with counts, hash note), §3.2 (`--rebuild`, index.json, the per-bill files), §3.4 (`excerpt`, `companions`, the discharge label). CLAUDE.md §9 (`tracker:rebuild`) and Progress. No UI file touched.
- Decisions:
  - **The cache had no bill details** (fetchBill never cached them), so a rebuild couldn't work from it as it stood. I ran **one `tracker:fetch -- --no-sweep`** (286 requests, 227 s, every sub-endpoint a cache hit, so no bill data changed) to seed the details, then `tracker:rebuild`: **0 requests, 2.0 s, 0 changes**, bills.json and meta.json byte-identical to the seeded run. fetchedAt is now 2026-11-09 (that run's time).
  - The per-bill summary carries `excerpt` only (not every paragraph): the panel shows the excerpt and links to the full summary on Congress.gov. `related` isn't in the per-bill file; `companions` is (all the panel uses). Title, sponsor party and stage come from the index row, so T9 merges row + file.
  - A rebuild keeps `fetchedAt`, `lastRun` and `requests` (nothing was fetched).
  - `summaryPatterns` still has a bare `generative` (it can match "Regenerative" in a summary). Not in the prompt; the 5 dropped bills didn't land in review (+0 −0). Joey may want `\bgenerative\b` there too.
- Verified:
  - `npm run lint` 0 errors (the old scratch warning in screens/t6), `npx tsc --noEmit` clean, `npm run build` passes, `npm run test:content` **68 passed**.
  - **False positives gone** from bills.json, index.json, the CSV and the per-bill folder: hr8048, s4179, hr6852, hr3729, hr3166 (`screens/t8/check.mjs`). 215 bills, 215 index rows, 215 files, 215 CSV rows. Stages 206 / 3 / 5 / 0 / 1.
  - **Topics** (215 bills): Deepfakes and likeness 11 · Chatbots and companions 7 · Children and teens 10 · Elections 9 · Disclosure and labeling 17 · Safety and risk 22 · Privacy and data 19 · Fraud and consumer protection 30 · Bias and civil rights 8 · Jobs and the economy 28 · Health care 12 · Education 17 · Government use of AI 49 · Federal and state roles **4** · National security 40 · Research and compute 44 · Energy and data centers 15. None under 4.
  - **No topic: 26 of 215 (12.1%, target < 15%):** S. 5518 Make AI Work for Americans Act; H.R. 10044 AI Tax and Work Protection Act; S. 5047 AI Physical Systems Coordination Act of 2026; S. 5051 AI AGENT Act of 2026; S. 4991 Homestake AI Act of 2026; H.R. 9686 and S. 4627 FARM AI Act of 2026; H.R. 9506 (NAII Act prize competition program); S. 4825 American A.I. Sovereign Wealth Fund Act; H.R. 9323 Department of Advanced Technology and AI Act; S. 4441 CREATE AI Act; H.R. 8516 American Leadership in AI Act; H.R. 8037 Protect American AI Act of 2026; H.R. 7968 Small AI Innovators Empowerment Act; H.R. 7783 AI-Ready Networks Act; H.R. 7158 Expanding AI Voices Act; H.R. 6304 AI for America Act; H.R. 6159 AI for ALL Act; S. 3150 and H.R. 5885 GAIN AI Act of 2025; S. 2937 AI LEAD Act; H.R. 5288 AI Sovereignty Act; S. 2615 VET Artificial Intelligence Act; S. 2528 Unleashing AI Innovation in Financial Services Act; H.R. 3303 America–Israel AI Cooperation Act; S. 1633 TEST AI Act of 2025.
  - **Excerpts:** every one ends in a period; 115–580 chars (median 332); none empty. S. 146's is its one sentence-paragraph ("This act generally prohibits … upon receiving notice of their existence."). S. 146 is the only bill with a "Discharged from committee" milestone.
  - **Sizes:** index.json **99.5 KB raw / 12.9 KB gzip**; bills.json 455 KB / 49 KB; per-bill files 177 KB total, median 0.7 KB, max 1.9 KB.
  - **Key scan** (`screens/t8/keyscan.mjs`, file names only, 302 files: content, public/data, scripts/tracker, docs, src, package.json): no key. The one regex hit is probe.mjs's own `api_key=REDACTED` code (checked: it doesn't contain the key).
  - No screenshots, Figma or Eclipse pass: no UI change.
- Open for next prompt:
  - **T9:** BillPanel still renders `summary.paragraphs.slice(0, 3)` (T8 doesn't touch UI); switch it to `summary.excerpt` with the per-bill files. Read panel data as index row + `/data/tracker/bills/{id}.json` (`TrackerBillDetail`).
  - TODO(joey): `summaryPatterns`' bare `generative`; S. 2615 "VET Artificial Intelligence Act" gets no topic (`veterans?` doesn't match "VET"); review the 26 untagged bills, and use `topicOverrides` where a topic is obvious.
  - Carried from E7 unchanged (the T6 TODO(joey) list, the orphaned :3000 dev server, SITE_URL, Part A A9's stub line, and the T5/E6.11 list minus the summary cut and the S. 146 "Reported" label, both fixed here). No post was touched.

## T9: Tracker load time, lazy panels, caching, 10 per page · 2026-11-09
- Built:
  - `tests/tracker.perf.spec.ts` (budgets: server HTML ≤ 120 KB, ≤ 10 rows, no panel content; one JSON request per opened row, none on reopening; LCP < 2.5 s and TBT < 200 ms at 390 under 4× CPU + Fast 3G). Runs in one project and skips itself on a dev server.
  - `playwright.prod.config.ts`: the whole suite (perf included) against `next start` on **:3300**, launched as `node node_modules/next/dist/bin/next start` so stopping it really stops it (see Open). `playwright.config.ts` now `testIgnore`s `*.perf.spec.ts`.
  - `src/lib/iso-date.ts`: `isoDate` moved out of `dates.ts` (see Decisions).
- Changed:
  - `BillFinder.tsx`: imports `content/tracker/index.json` itself (no bill props); renders only the current page on the server too (first 10 of the default sort), so the status reads "Showing 1–10 of 215 bills" before hydration.
  - `BillRow.tsx` (`"use client"` now): fetches `/data/tracker/bills/{id}.json` on the details' `toggle` (so hash-opened rows load too), prefetches on summary `pointerenter`/`focus`, keeps results in module-level Maps (a failure is forgotten, so the next open retries). Loading: `.bill-panel.bill-panel-loading` with `aria-busy="true"` "Loading details…"; failure: "Couldn't load the details" + "View on Congress.gov ↗" (URL built from the row's type and number); no JS: a `<noscript>` "View on Congress.gov ↗" (the loading block is hidden under `@media (scripting: none)`).
  - `BillPanel.tsx`: takes `TrackerIndexBill & TrackerBillDetail` and shows `summary.excerpt` (T8) instead of the first 3 paragraphs; exports `External`. Markup otherwise unchanged.
  - `BillTable.tsx`, `finder.ts` (`FinderBill` from the index type, `DEFAULTS.per` 10 and `parseState` falls back to it, `ordinal` moved here from page.tsx), `finder.test.ts` (fixtures in the index shape; +1 test: 10 is the default, 25 round-trips).
  - `page.tsx`: passes only copy + topics; `<noscript>` note "The full list needs JavaScript. Download every bill as CSV" under the finder. `page.json` + schema: `panel.loading`, `panel.failed`, `noscript.{text,link}` (under the file's TODO(joey)).
  - `next.config.ts`: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` on `/data/tracker/bills/:id*` and `/data/:file*.csv` (checked with curl on `next start`).
  - `globals.css`: `.bill-panel-loading` hidden without scripting. No token added.
  - Docs: CLAUDE.md §5 (the /tracker no-JS exception and why) and Progress; tracker-spec §4.1 (structure, server/client split, no-JS, caching, budgets), §4.4b (default 10), §4.5 (lazy panels, excerpt, companions from fetch.mjs), §5 #6; build-prompts Open items (#6 note).
- Decisions:
  - **The per-page bug didn't reproduce.** On a production build (and the T8 data), setting 10 changes only the page size: status, range, total, page count and all 18 pill counts stay put, and 50 per page survives a filter, a sort, Next, a reload and a hash link. I found no cause in the code (per is read and written only by parseState/toSearch and the pager). Most likely it was the broken dev server on :3000 (E7). The test from the prompt is kept as `10 per page changes only the page size…` in tracker.spec.ts.
  - **zod was in the client bundle** (the /tracker page chunk was 108.6 KB gzip): BillRow/BillPanel import `formatDate` from `src/lib/dates.ts`, which also built the zod `isoDate` at module level, and Turbopack wouldn't tree-shake it (a `/* @__PURE__ */` attempt didn't help). Moving `isoDate` into `src/lib/iso-date.ts` (4 server imports changed) took the chunk to 19.8 KB.
  - `index.json` ships inside the page's hashed chunk (Turbopack didn't split it out; it's 12.9 KB gzip of the 19.8).
  - The loading block takes the panel's own box (same padding), so the row never jumps; I didn't reserve the full panel height (it varies by bill).
  - No-JS rows open to a Congress.gov link rather than an empty panel.
- Verified (production `next start`):

  | /tracker | before (T8 data) | after |
  |---|---|---|
  | HTML raw / gzip | 1,495 KB / 128.5 KB | **113 KB / 30.9 KB** |
  | JS gzip (9 scripts) | 268.6 KB | **193.4 KB** |
  | DOM elements (after load) | 2,180 | **594** |
  | LCP 390 / 1440 (4× CPU, Fast 3G) | 2,072 / 1,972 ms | 1,772 / 1,672 ms |
  | TBT 390 / 1440 | 374 / 331 ms | **116 / 88 ms** (the perf test saw 104–190 ms across runs) |

  - HTML composition after: 46 KB RSC payload (page.json copy etc.), 32 KB inline SVG (logo, 10 chevrons), 10 rows.
  - `npm run lint` 0 errors; `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:content` **69 passed**.
  - `tracker.spec` + `tracker.perf.spec` on prod: **103 passed, 32 skipped** (single-project tests), 0 failed. Full suite on prod (`playwright.prod.config.ts`, log `screens/t9/e2e-prod.log`): **311 passed, 132 skipped, 27 failed**: the same 27 as T4–E7, all on the dev-only draft post and `/styleguide` (404 in production).
  - axe 0 violations at rest (all 5 projects), with S. 146 open after its fetch, and in the loading state (request held by `page.route`).
  - **Tests changed (expectations, not intent):** the two T3 "layout and text limits" tests now run with JS and page through every bill at `?per=100` (only one page is in the DOM); "without JavaScript…" now expects the first 10 bills in order, the noscript note and CSV link, and a Congress.gov link in an opened row; "zzzz…Clear" expects 10 rows and uses the T8 pill "Children and teens"; topic round-trip, Next/last page (11–20, last-page count) and page 3 (21–30) use 10 per page; "axe with one row open" waits for the fetched panel; "every panel open at 320" runs with JS at per=100 and waits for all panels. **New:** the per-page test, loading state + axe, failed fetch + retry, no refetch after paging back, and the perf spec.
  - Screenshots `screens/t9/`: `default-{1440,390}.png`, `row-loading-1440.png`, `row-loaded-1440.png`, `nojs-1440.png`.
  - Figma and Eclipse: no visual or token change apart from the loading line, so no compare.
- Open for next prompt:
  - **Orphaned servers I started and couldn't stop** (stopping `npx next start` left its child; `taskkill` needed approval): **:3100 PID 35252** (serves a stale T8 build) and **:3200 PID 12792** (an early T9 build). Joey: `taskkill /PID 35252 /F` and `taskkill /PID 12792 /F`. The old scratch `screens/t4/playwright.prod.config.ts` points at :3100 with reuseExistingServer, so **don't use it** until 35252 is gone; use `playwright.prod.config.ts` (:3300).
  - TBT at 390 sits at 104–190 ms against the 200 ms budget; machine load can push it close.
  - A filter change keeps the URL's `#hash`, so a reload re-reveals that bill and clears the filter that hid it (T11's URL round-trip hunt).
  - Carried from T8 unchanged (the T8 TODO(joey)s, the E7 list).

## T10: Tracker filters menu on phones, sticky column header · 2026-11-09
- Built: no new files in src. Scratch in `screens/t10/` (shots, before/after finder compare, a scroll-margin mutation check).
- Changed:
  - `FinderControls.tsx`: below md a full-width "Filters" toggle (3.5rem, 1px border, `type-text-regular`, ChevronDown `rotate-180` when open with a `motion-safe` 300ms ease-out transition, `aria-expanded`, `aria-controls="finder-filters"`, label "Filters ({n})" counting chamber/status/sort/topic ≠ default). The selects, pills and two new buttons ("Show {n} bills" ink pill / "Show 1 bill"; "Clear filters" text button) sit in `#finder-filters`: `hidden` or `flex flex-col gap-32` below md, `md:contents` at md and up. Escape inside it closes it and focuses the toggle. Starts closed. "Show" uses `flushSync` to close before scrolling, or the scroll lands where the count was.
  - `BillFinder.tsx`: `focusCount()` split out of `goTo` and passed as `showResults`; passes `total`.
  - `BillTable.tsx`: a ResizeObserver writes the header's height to `--bill-head-h` on `.bill-table`.
  - `globals.css`: under `@media (min-height: 640px)`, `.bill-head` sticky top 0, `z-index: 1`, `background-color: var(--tile-bg)`; `.bill-table :is(summary, a)` `scroll-margin-top: var(--bill-head-h, 0px)`. No reduced-motion guard (on purpose). No token added.
  - `page.json` + schema: `finder.filters`, `filtersActive`, `showResults`, `showResultsOne`, `clearFilters` (under the file's TODO(joey)).
  - `tests/tracker.spec.ts`: an `openFilters()` helper used before every select/pill interaction (they're hidden below md now); 8 new tests (below). `tests/tracker.perf.spec.ts`: TBT/LCP now the median of 3 cold loads. `playwright.prod.config.ts`: a `perf` project that depends on the others.
  - Docs: CLAUDE.md §5 (the sticky-header exception and why) + Progress; Part A A9 (same, next to the sticky rules); tracker-spec §4.3 (the menu) and §4.4 (the sticky header).
- Decisions:
  - **"Clear filters" keeps the search and per page** (per page isn't a filter); it resets chamber, status, topic and sort.
  - **scroll-margin from a measured variable**, not a token: the header's height changes with the ≤991 type step, so a token would duplicate the type scale.
  - **The header ignores the ≥ 768-wide sticky rule**: the table's own width decides whether there's a header (medium layout from a 38.5rem container). The 640-tall rule holds.
  - **Perf flakiness:** under the full parallel suite TBT reached 406 ms (CPU contention), and single loads ranged 63–216 ms even alone. So the perf spec runs in its own `perf` project after the others, and the budget applies to the median of 3 loads. Playwright skips a dependent project when any dependency fails, and the 27 known dev-route failures count, so **run it with `npx playwright test --config playwright.prod.config.ts --project perf --no-deps`** until those are fixed.
- Verified (production `next start` on :3300):
  - `npm run lint` 0 errors; `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:content` 69 passed.
  - **md+ unchanged:** the finder form's screenshots at 1440, 1024 and 768 are **byte-identical** before and after (`screens/t10/finder-*-{before,after}.png`).
  - tracker specs: **111 passed**, 0 failed. Full suite: **316 passed, 27 failed** (the same dev-only draft post + `/styleguide` 27), perf skipped as a dependent; perf alone, serial ×3: **9/9 passed**, median TBT 38–103 ms, LCP ~1.65 s.
  - New tests: at 390 the selects and pills are hidden until Filters opens, and the label reads "Filters (2)" (also after a reload, with the panel closed); "Show n bills" closes and focuses the in-viewport count, and "Clear filters" keeps it open; Escape returns focus; axe 0 with the menu closed and open; at 1440 halfway through a 100-row table the header is sticky at top 0 with all 5 labels visible; the same under reduced motion; at 1440×600 it's static; a Tab walk forward and back (≥ 80 summaries) never leaves a summary above the header's bottom. **Mutation:** with `scroll-margin-top: 0` injected, a Shift+Tab walk puts 12 of 49 summaries under the header; with it, 0.
  - Screenshots `screens/t10/`: `menu-closed-390`, `menu-open-390`, `menu-open-2-active-390`, `menu-closed-2-active-390`, `stuck-1440`, `stuck-1024`, `focus-under-header-1440`.
  - Figma: no frame for the phone menu (spec §5: the final mobile frames aren't designed); no compare. Eclipse: no token change.
- Open for next prompt:
  - The focus ring of a row scrolled to the header sits about 2px into the header's bottom rule (the outline's offset). The row itself is clear, so 2.4.11 passes; a `+ 0.25rem` on the margin would clear the ring too.
  - The orphaned :3100 (PID 35252) and :3200 (PID 12792) servers from T9 are still running.
  - Carried from T9 unchanged.

## T11: Tracker bug sweep · 2026-11-09
- **Dev server (item 9):** nothing is listening on :3000 (connection refused within 2 s), so it doesn't answer 200 on /tracker. The orphaned E7 server is gone; start a fresh `npm run dev` before trusting dev timing. Still orphaned from T9: **:3100 PID 35252** and **:3200 PID 12792** (`taskkill /PID <pid> /F`).
- Built: no new src files. Scratch in `screens/t11/` (before/after shots, the data and UI hunts, the hash probe, `aria-s146.md`, `pager-measure.spec.ts`).
- Changed (each fix with its file):
  1. **Bare bill type search** (`finder.ts` `matchesQuery`: LABEL's number is optional; a type alone matches the type): "hr", "H.R.", "s", "S.", "hjres", "sjres". `finder.test.ts` +6 cases (4 of 6 failed before the fix).
  2. **Pre-hydration hash** (`BillFinder.tsx`). Reproduced in about 2–4% of loads under parallel load (never serially): `framenavigated` showed `/tracker` → `#s146-119` → `/tracker`. Cause: React runs child effects before parent effects, so our first reveal ran before Next's App Router mount effect, which then replaced the URL with its canonical one (dropping our `?page` and the hash); Next's popstate handling can also drop a hash set mid-hydration before `hashchange` reads it. Fix: the first reveal runs a task later (`setTimeout`), and module-level `popstate`/`hashchange` listeners (registered before Next's) remember the hash. Test `a hash set right after load, before hydration…` (both `commit` and `load` forms): 0 failures in 300 parallel repeats plus 200 probe loads (before: 2/50, 1/100, 3/120).
  3. **Progress bar gap** (`globals.css` new `--progress-gap` 0.1875rem; `BillRow.tsx` `gap-(--progress-gap)`), logged in `docs/token-log.md`; spec §4.4 table updated. Test: the gap computes to 3/16 rem.
  4. **Stacked top rule** (`globals.css`): `.bill-table > ol` gets a 4px `tile-fg` top border below 38.5rem (removed in the medium/wide container query). **Chose the 4px rule:** the wide and medium tables open with the header's 4px rule, and the 1px tile-lines then read as row separators; a lone 1px line would look like a separator with nothing above it. Test: 4px stacked, 0 otherwise.
  5. **Search clear ×** (`FinderControls.tsx`): `[&::-webkit-search-cancel-button]:appearance-none`, plus our own button inside the field (Carbon `Close`, `size-icon-inline`, ink, a 2.5rem round target with stone hover, `aria-label` "Clear search", only with a query; clears and refocuses the input). `page.json` `finder.clearSearch` + schema. CLAUDE.md §3 adds `Close` to the icon list. Test: name, ≥ 24px, visibility, the CSS rule, clear + focus.
  6. **Pager on phones: left as is.** Per page (157.7px) + gap (16) + the widest range "1–100 of 215 bills" (108.5px) = 282px, but the nav is 272px wide at 320, so one line doesn't fit there (it would at 390). Per the prompt, unchanged.
  7. **Stale docs:** Part A A9's "`/tracker` is a stub page" now describes the working tracker. The other "stub" mentions are in historical prompts (E6.3, E6.8, T3, T6) and handoff entries; left as written.
  8. **Hunt fixes:**
     - `FinderControls.tsx`: **Escape didn't close the open Filters panel when focus was on the Filters button itself** (the handler was only on the panel). Now on both; the Escape test covers it.
     - `BillFinder.tsx`: **a filter change kept a stale `#hash`**, so a reload re-revealed that bill and cleared the filter (the URL didn't round-trip). `setSearch` keeps a hash only for a reveal. Test: hash link → chamber change → URL `?chamber=house`, and a reload keeps it.
  - Docs: tracker-spec §4.3 (bare type search, the clear button), §4.4 (the stacked rule), §4.5 (hash handling); CLAUDE.md §3 and Progress.
- Hunt results (production, 1440 / 1024 / 768 / 390 / 320, keyboard only, `screens/t11/hunt.spec.ts`, log `hunt.log`):
  - Focus after every action lands where it should: search → input; clear → input; Filters open/Escape → toggle; chamber via keyboard → select; topic via arrows → radio; "Show n bills" → count; Next page → count; Tab from the count → first summary; open/close row → summary; "Clear all filters" → input. Never `body`.
  - **0 console errors or warnings, 0 page errors, no hydration warnings** at every width.
  - The status count and the range always agree with the rendered rows. A full URL (`?q=ai&chamber=senate&status=1&topic=safety&sort=cosponsors&page=2&per=25`) round-trips on reload.
  - No horizontal overflow with the longest title (H.R. 10502, 269 chars), latest action (H.R. 8516, 393) and sponsor (H.R. 9757, 29), panels open.
  - Data (`data-hunt.mjs`, all 215 bills and panel files): stage and label always agree, and each stage ≥ 2 has its milestone; milestones in date order; no milestone after the latest action; no latest action before introduction; cosponsor splits sum and original ≤ count; no empty committee, excerpt or text version; stage 5 ⇔ law. **No defects.**
  - `ariaSnapshot` of S. 146 closed and open (`screens/t11/aria-s146.md`): the names read as sentences; the panel exposes a "Summary" region and terms/definitions, and every external link ends "(external site)".
  - **Not worth fixing:** the snapshot shows "S. 146 , Senate" (Playwright joins inline spans with a space; Chrome's accessible name has no space before the comma). The committee line reads "Discharged From, Feb 13, 2025": that's the API's activity name, verbatim. The hunt's "clipped sr-only" hits are visually hidden text, by design.
- Verified:
  - `npm run lint` 0 errors (the old scratch warning); `npx tsc --noEmit` clean; `npm run build` passes; `npm run test:content` **75 passed**.
  - Full suite on prod (`playwright.prod.config.ts`, log `screens/t11/e2e-prod.log`): **341 passed, 152 skipped, 27 failed**, all 27 the known dev-only draft post + `/styleguide`; **0 other failures**. `tracker.perf.spec.ts` (`--project perf --no-deps`): **3 passed**, LCP 1.66–1.68 s, TBT 69–100 ms (median 98).
  - axe 0 violations on /tracker at 1440 and 390 (in every project): at rest, filtered, with a row open (after its fetch), loading, in the empty state, and with the phone Filters menu open and closed.
  - Screenshots `screens/t11/`: `bar-1440-{before,after}`, `stacked-top-390-{before,after}`, `search-1440-{before,after}` (Chrome's blue × → our ink ×), `pager-{390,320}-before` (unchanged, item 6).
  - Figma/Eclipse: one new token (`--progress-gap`, already 3 in Figma); no Eclipse-relevant change.
- Open for next prompt:
  - Run a fresh `npm run dev` and `npm run test:e2e` on it (article and scaling haven't passed on dev since T3); kill the T9 orphans (:3100 PID 35252, :3200 PID 12792).
  - The 27 dev-only failures make Playwright skip the dependent `perf` project in a full prod run; run it with `--project perf --no-deps`.
  - **Every open TODO(joey) for the tracker:**
    - `content/tracker/config.json` `_note`: review the patterns, the 17 topics and the watchlist; `summaryPatterns` still has a bare `generative` (can match "Regenerative"); the inert `subjects` rule (T1/T2).
    - The 26 bills with no topic (T8 list), and S. 2615 "VET Artificial Intelligence Act" (`veterans?` misses "VET"); use `topicOverrides` where a topic is obvious.
    - `content/tracker/page.json` `_note`: approve all the copy, including T9's `panel.loading`/`panel.failed`/`noscript`, T10's Filters strings and T11's "Clear search".
    - Triage `content/tracker/review.json` (66 bills).
    - The spec §4.7 copy flag (the dek and empty body vs the real inclusion rule, T1).
    - H.R. 2794's sponsor name ("Maria Salazar" from the API vs "María Elvira Salazar" in bills.json, T2).
    - Hand spot-check S. 146 and H.R. 10502 on Congress.gov (T5).
    - T7: add the `CONGRESS_API_KEY` repository secret.
    - Set `SITE_URL` before launch (the tracker citation's URL).

## T7: Daily tracker refresh workflow · 2026-11-09
- Built: `.github/workflows/tracker.yml` ("Tracker refresh"): daily at 10:17 UTC (`17 10 * * *`) and `workflow_dispatch`. Steps: `actions/checkout@v7`, `actions/setup-node@v7` (`node-version-file: .nvmrc`, `cache: npm`), `npm ci`, `actions/cache@v6` on `.cache/congress` (key `congress-${run_id}`, restore-keys `congress-`, since cache keys are immutable), `npm run tracker:fetch` with `CONGRESS_API_KEY: ${{ secrets.CONGRESS_API_KEY }}`, then a commit step: `git add content/tracker content/bill-stats.json public/data`, exit if `git diff --cached --quiet`, else commit "data: tracker refresh YYYY-MM-DD" as github-actions[bot] and push. `permissions: contents: write` only; `concurrency: tracker-refresh` with `cancel-in-progress: false`; `timeout-minutes: 90`. `.nvmrc` = `24.19.0` (the local Node; neither `.nvmrc` nor `engines` existed).
- Changed: `content/tracker/page.json`: the dek's clause is now "Status updated daily from Congress.gov." and `_note` adds a TODO(joey) (true only once the Action has run green). `docs/tracker-spec.md`: §3.6 (commit paths now `public/data/`, which includes T8's per-bill files; .nvmrc, permissions, concurrency, fail-before-commit) and §6 (the steps to add the secret, push, first run, check, branch protection). CLAUDE.md Progress.
- Decisions:
  - **Commits all of `public/data/`**, not only `*.csv` as the old §3.6 said: T8's `public/data/tracker/bills/*.json` change with each fetch and must ship with index.json.
  - **A failed fetch never commits:** fetch.mjs builds everything in memory and writes last, and a top-level throw exits non-zero; the step fails, so the commit step doesn't run (and actions/cache only saves on success).
  - Action majors from the READMEs (checkout v7, setup-node v7, cache v6), not the docs' older v4 examples.
  - `congress.mjs` already falls back to the `CONGRESS_API_KEY` env var when `.env.local` is absent (T1), so no script change was needed.
- Verified:
  - `npm run lint` 0 errors (the old scratch warning in screens/t6); `npm run build` passes; `npm run test:content` 75 passed.
  - The YAML parses (js-yaml via gray-matter): triggers, permissions, concurrency and the 6 steps as intended. `package-lock.json`'s root matches package.json, so `npm ci` won't fail on a mismatch (npm ci itself wasn't run locally; it would wipe node_modules).
  - Checked against docs.github.com (workflow syntax, events that trigger workflows, using secrets, GITHUB_TOKEN, caching, manually running a workflow) and the three action READMEs: schedule is POSIX cron in UTC on the default branch's latest commit, and an off-the-hour minute avoids load delays; `workflow_dispatch` needs the file on the default branch; the secret goes in a step's `env:` from `secrets.*`; keys are immutable and restore-keys prefix-match the newest; the commit identity and plain `git push` follow the checkout README (`persist-credentials` defaults to true). **Not confirmed in the pages fetched:** that `contents: write` covers `git push` (the syntax table only mentions releases); it's the standard scope for pushing, but the first run is the real check.
  - The workflow was not run (no push, per the prompt).
- Open for next prompt:
  - **Joey:** add the secret, push, and run the workflow once (spec §6 steps). Then resolve page.json's "updated daily" TODO(joey).
  - **Methodology paragraph 3 still says "we refresh it by hand"** (page.json `methodology`), which now contradicts the dek. Not in this prompt's list; change it with the dek once the Action is green.
  - Pushes made with GITHUB_TOKEN don't trigger other workflows (none exist). A Vercel Git deploy isn't a workflow, so it should still deploy on the bot's commit; confirm after the first run.
  - In a public repo, GitHub disables scheduled workflows after 60 days without repository activity. If `main` is protected against direct pushes, the commit step fails (see spec §6.5).
  - Carried from T11 unchanged (the TODO(joey) list, the T9 orphan servers, the dev-server e2e run, perf `--no-deps`).
