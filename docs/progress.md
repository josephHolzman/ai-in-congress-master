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
