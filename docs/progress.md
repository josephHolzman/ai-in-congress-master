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
