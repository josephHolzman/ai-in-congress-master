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
