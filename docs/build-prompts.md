# AI in Congress: Eclipse rebuild, Claude Code prompts E0–E7

These prompts build the **HomeNew** and **Article** frames from Figma in an **empty repository**.

- **Figma file key:** `9DKYbMDVJ43Kt1IDcf0XJS`
- **Frames:** HomeNew `2076:2212`, Article `2075:1532`

---

## How to use this file

1. **The repo is `C:\dev\ai-in-congress-master`.** It already has, in its root:
   - `Switzer-Variable.ttf` and `Switzer-VariableItalic.ttf`;
   - `AIinCongressLogo.svg` and `AIInCongressIcon.svg`;
   - **`CLAUDE.md`**: the project rules (Karpathy's four principles and the "lazy senior engineer" standard);
   - **this file**, at `docs/build-prompts.md`;
   - **`docs/eclipse-audit.md`**: the Eclipse audit and design history (the baseline for parity checks);
   - **`content/posts/*.mdx`** (6 real articles, one per category) and **`content/bills.json`**, imported from the old site (`C:\\dev\\ai-blog`, branch `refresh-2026`, including uncommitted edits).

   The prompts refer back to Part A of this file, so it has to stay in the repo.
2. **Run the prompts in order, each in a fresh (cleared) Claude Code session.**
   - Every prompt starts by rebuilding context from files: CLAUDE.md, `docs/progress.md` (the handoff log), git status, and this spec. Nothing depends on chat memory.
   - Each prompt ends by ticking its box in CLAUDE.md and writing a handoff entry.
   - Review the report and commit before you clear the session and run the next prompt.
3. **If the Figma MCP server is connected in Claude Code,** the prompts tell it to screenshot the frames and compare. If it isn't connected, Part A has every value it needs.
4. **All text in the Figma frames is placeholder.** Build the layout, type, color and components. The real copy comes from the imported content files, and never goes into components.

---

# PART A: Design spec (the source of truth for every prompt)

## A1. Things that differ from the Figma file on purpose

| Figma | Build | Why |
|---|---|---|
| `Heading/H5` uses **Inter** Semi Bold | Use **Switzer Variable** at weight 600, same size and tracking | Every other style is Switzer. Inter appears to be an accidental default. If Inter was intentional, add its files and change one token. |
| `cobalt` `#1F3FE0` for links | **blue `#0060C4`** | Joey judged cobalt to read as purple. Blue is 6.1:1 on Paper and 5.1:1 on Stone. Update the Figma variable to match. |
| Rail floats at x 1103–1414 | **Docked:** from the 1080 quarter line to the window's right edge, with 40 padding inside | Puts the rail on the quarter grid with an 80px gap to the text. Decided Oct 2. |
| Article text column 360–1081 (721 wide) | **400–1040 (640 wide)**, controlled by one token, `--measure` | About 65 characters per line, down from about 77. Change the token if Joey prefers 721. |
| "← All articles" in dark text on the navy header | Uses `tile-fg` (white on dark headers) | The Figma version fails contrast. |
| Footer "Accessability" | "Accessibility" | Typo. |
| Bill band: the last stat ("2") in navy | All stats in `tile-fg` (ink) | Navy and ink are 1.1:1 apart, so the emphasis doesn't show. |
| Hardcoded `#0d0c2b` text in the rail | `ink` | Old palette value. |

## A2. Color primitives

Name each color exactly as shown.

| Token | Hex | Notes |
|---|---|---|
| `paper` | `#FFFFFF` | |
| `stone` | `#EDEBE6` | |
| `ink` | `#08080C` | |
| `navy` | `#10133A` | |
| `signal` | `#FF4301` | Newsletter only. Never small white text on it. |
| `mint` | `#C2FCD3` | Site chrome and hover |
| `blush` | `#EFCFC8` | |
| `volt` | `#E4FA5B` | |
| `amber` | `#FFAE3D` | Bill tracker |
| `sand` | `#DDD6BE` | |
| `slate` | `#5B6AA8` | |
| `sage` | `#6F9C86` | |
| `blue` | `#0060C4` | Links on Paper, Stone and Mint only |
| `muted` | 72% | Opacity of `tile-fg` for secondary text (Figma `MutedAgainstLight`) |

**Color means destination:**
- **mint** is site chrome: the topbar, the footer logo and links, and the hover state.
- **amber** is the bill tracker: the Home stats band and the "Bills in this article" rail cap.
- **signal** is the newsletter band.
- **ink** is the featured tile and the footer.
- **Category colors** apply to article headers only.

## A3. Tile modes

Every colored block is a **tile** with a mode. Mode variables:

| Variable | Meaning |
|---|---|
| `--tile-bg` | Background |
| `--tile-fg` | Text color |
| `--tile-fg-muted` | Secondary text color |
| `--tile-line` | Line color |
| `--tile-hover-bg` | Background on hover |

| Mode | bg | fg | fg-muted | line | hover-bg |
|---|---|---|---|---|---|
| paper | paper | ink | ink 72% | ink 12% | mint |
| stone | stone | ink | ink 72% | ink 12% | mint |
| mint | mint | ink | ink 72% | ink 12% | (none) |
| amber | amber | ink | ink 72% | ink 12% | mint |
| blush | blush | ink | ink 72% | ink 12% | mint |
| volt | volt | ink | ink 72% | ink 12% | mint |
| sand | sand | ink | ink 72% | ink 12% | mint |
| sage | sage | ink | **ink** (no muted: 72% is 4.3:1) | ink 20% | mint |
| signal | signal | ink | **ink** (no muted) | ink 20% | (none) |
| ink | ink | paper | paper 72% | paper 20% | mint |
| navy | navy | paper | paper 72% | paper 20% | mint |
| slate | slate | paper | **paper** (no muted: 72% is 3.5:1) | paper 20% | mint |

- **The newsletter band overrides fg to paper.** White on signal is 3.5:1, which is only allowed for text 24px and up. Every text element inside that band must be at least 24px.
- **Hover and focus switch the whole mode,** not just the background: `bg`, `fg`, `fg-muted` and `line` all take Mint's values, and all four fade together over 300ms (0ms under reduced motion).
- **Mint is never a category color.**

## A4. Category → article header mode

| Category | Header mode | Header text |
|---|---|---|
| Child safety | blush | ink |
| Deepfakes | navy | white |
| Executive branch | slate | white, no muted |
| Lawmakers | volt | ink |
| National security | sand | ink |
| States | sage | ink, no muted |

**Pills are always neutral:** outlined, with no fill (or a fill matching the tile background), the border and text in `tile-fg`. Category color appears only on the article header.

## A5. Type

Font: **Switzer Variable**, loaded locally. Letter spacing is in **em**, converted from Figma's percentages. Sizes are in **rem**, where 1rem = 16px at 1440.

**Tablet step (≤ 991):** the root jumps from 14px to 16px at 991 (A6), so every style steps down there. Without the step, type would grow as the window narrows. The ≤ 991 column is in px at the 16px root. Display, h4, h5 and text-large follow Eclipse's live ≤ 991 values (h3's line height is 36, not Eclipse's 36.8, to stay under its 1024 size). The other styles hold at their 1024 size, rounded down to a whole px. Tracking (em) and weights don't change. `text-article` has an 18px floor at every width (`max(1.25rem, 18px)`), so it reads 18 between 992 and 1280 instead of 17.5. `text-small` and `ui-label` have a 13px floor the same way (`max(…, 13px)`), so they read 13 from about 1350 down instead of 12.25 (992–1280) and 12 (≤ 991). `tests/scaling.spec.ts` fails if any style or layout token grows as the width shrinks.

| Token | Size / line height | ≤ 991 | Weight | Letter spacing | Source | Used for |
|---|---|---|---|---|---|---|
| `display-h1` | 90 / 90 | 60 / 60 | 600 | −0.04em | Figma | Bill stat numbers |
| `display-h2` | 66 / 66 | 40 / 40 | 600 | −0.035em | Figma | Home statement, featured title, article title, newsletter heading |
| `display-h3` | 38 / 42 | 32 / 36 | 600 | −0.03em | Figma | Bill band heading, grid tile titles, article h2, "Sources", newsletter field and button text |
| `heading-h4` | 24 / 31 | 20 / 26 | 600 | −0.02em | Figma | Stat labels, action-row labels, featured dek, article dek, rail cap, rail bill title |
| `heading-h5` | 20 / 28 | 16 / 22.4 | 600 | −0.015em | Figma (Inter → Switzer) | Nav links, pills (uppercase), dates, source line, footer links, "Track this bill" |
| `text-large` | 24 / 31 | 20 / 26 | 400 | −0.015em | Figma | "All articles" back link |
| `text-medium` | 22 / 29 | 18 / 23.7 | 400 | −0.01em | Spec | (reserved) |
| `text-article` | 20 / 32 | 18 / 28.8 | 400 | 0 | Figma | Article body, rail status lines, source list items |
| `text-regular` | 16 / 22 | 14 / 19.25 | 400 | 0 | Figma | Footer disclaimer, rail bill number |
| `text-small` | 14 / 20 | 13 / 18.6 | 400 | +0.005em | Spec | Figure captions |
| `ui-nav` | 18 / 20 | 15 / 16.7 | 500 | −0.005em | Figma | Article meta row |
| `ui-label` | 14 / 20 | 13 / 18.6 | 500 | +0.005em | Spec | (reserved) |

**Article body (spec):**
- Paragraph spacing 24.
- Body h2 uses `display-h3`, with 24 below it. Sections are 32 apart, matching Figma.
- Lists use `text-article`: 24 indent, 12 between items, markers in `tile-fg-muted`.
- Block quote: a 2px `tile-fg` left rule and 24 padding, upright (not italic).
- `strong` is weight 600; `em` is Switzer Italic 400.
- Links are `blue` with a 1px underline at a 3px offset. On hover, the link turns navy and the underline goes to 2px.
- No justified text and no hyphenation.

**Display text:** apply `text-box: trim-both cap alphabetic` (where supported) to `display-*` styles.

## A6. Fluid root (Eclipse's model)

```css
html { font-size: max(0.875rem, calc(-0.125rem + 1.25vw)); } /* 16px at 1440 */
@media (max-width: 1280px) { html { font-size: 0.875rem; } }
@media (max-width: 991px)  { html { font-size: 1rem; } }
@media (min-width: 1920px) { html { font-size: 1.375rem; } } /* cap */
```

Every size, space and layout token is in rem, so the whole layout scales together.

The `max()` floor changes nothing at the default 16px browser font size. With a larger default, it lets the user's setting win over `vw` between 1281 and 1919 (WCAG 1.4.4). At a 20px default, the root at 1366 is 17.5px, up from 15.075.

## A7. Spacing primitives and layout tokens

- **Primitives (px at 1440, written in rem):** `space-4, 8, 16, 24, 32, 40, 56, 80, 140`.

| Layout token | Desktop | ≤ 991 |
|---|---|---|
| `layout-tile-pad` | 40 | 24 |
| `layout-tile-top-md` | 80 | 56 |
| `layout-tile-top-lg` | 140 | 80 |
| `layout-stack` | 24 | 16 |
| `layout-stack-sm` | 8 | 8 |

The layout tokens step down at 991, with the type (A5): the root jumps 14 → 16px there, so a token that held its desktop rem would grow as the window narrows (tile-top-md 70 → 80). Eclipse has the same flaw (`top-padding-5` 70 → 80 at 991; `pad-top-large` has no ≤ 991 rule), so its values aren't used; these are the former ≤ 767 values. The `space-*` primitives are rem and still step up at 991 (for example, `space-40` 35 → 40); use a layout token where a value must not grow.

- **Grid:** quarters at 0 / 360 / 720 / 1080 / 1440 (so 25%, 50% and 75%). There is no column gutter; the 40 inset lives inside each tile.
- **Reading measure:** `--measure` = 640 (40rem), from 400 to 1040, which is quarters 2–3 inset by 40.
- **Lines:** 1px. Tile dividers use `tile-line`. Action-row lines use `tile-fg` at full strength.
- **Pills:** padding 4 × 24, fully rounded, 1px border.

## A8. Icons

Use `@carbon/icons-react`:

| Icon | Where | Size |
|---|---|---|
| `ArrowRight` | Action rows | 24 |
| `ArrowLeft` | "All articles" | 24 |
| `ArrowUpRight` | External links: nav "Joey Holzman", "Track this bill", sources | 24 |

Icons inherit `currentColor` and are `aria-hidden`. The link text carries the meaning.

## A9. Accessibility rules (non-negotiable)

- **WCAG 2.2 AA.** Every text and background pair must come from the tables above.
- **Structure:**
  - a skip link as the first focusable element;
  - landmarks: `header`, `nav`, `main` and `footer`;
  - one `h1` per page, and no skipped heading levels.
- **Focus:** a visible 2px outline in `tile-fg`, inset 8px on tiles and offset 3px on inline links.
- **Hover equals focus:** anything that changes on hover also changes on `:focus-visible` or `:focus-within`.
- **One link per tile:** the title is the link, stretched over the tile with `::after`. "Read more" rows are `aria-hidden`.
- **Targets:** at least 24×24px.
- **External links:** the visible ↗ plus visually hidden text, "(external site)".
- **Motion:** respect `prefers-reduced-motion`. Transitions are 300ms ease-out, and drop to 0ms when reduced motion is on.
- **Sticky elements:**
  - never on screens under 768 wide or under 640 tall, or under reduced motion;
  - `:focus-within` raises the sticky element's z-index so focus is never hidden (WCAG 2.4.11).
- **Images:** `alt` is required in content frontmatter, and the build fails without it.
- **Without JavaScript,** every page and all its content render.
- **Pre-launch:**
  - the whole site sends `noindex` until `SITE_LIVE=true`;
  - the newsletter form doesn't submit anywhere yet;
  - `/tracker` is a stub page.

## A10. Eclipse parity

The reference site is https://web.archive.org/web/20240524202822/https://www.eclipse.xyz/. Its measured values, and the reasoning behind our decisions, are in `docs/eclipse-audit.md`. See CLAUDE.md, section 6.
- **Use Claude in Chrome** to compare against it at 1440, 1366, 1280, 1024, 991, 768 and 390, reading computed styles in both tabs.
- **You may retune tokens** (values, which token a component uses, breakpoints, the fluid root) when the scaling or rendering is clearly off.
- **Accessibility and contrast always win,** and the palette and content stay ours.
- **Log every change** in `docs/token-log.md`.

---

# PART B: The prompts

## E0: Scaffold, assets and project memory

```
Read CLAUDE.md, docs/build-prompts.md Part A and docs/eclipse-audit.md in full before doing anything. Part A is the source of truth for values. The audit gives Eclipse's measurements and the reasoning behind the design.

Set up a new project in this (empty) repository:

1) STACK
   - The latest stable Next.js (App Router), TypeScript in strict mode, and Tailwind CSS v4 (CSS-first config, with @theme and @utility in src/app/globals.css).
   - MDX via @next/mdx, gray-matter for frontmatter, and zod for validating content.
   - @carbon/icons-react for icons.
   - Playwright and @axe-core/playwright for checks.
   - ESLint (the Next config) and Prettier.
   - Use the src/ directory and the "@/*" import alias.

2) ASSETS: they're in the repo root. Move them; don't copy them.
   - Fonts: Switzer-Variable.ttf and Switzer-VariableItalic.ttf → src/fonts/. Load them with next/font/local as one family (the roman file as style "normal", the italic file as style "italic"), with the weight range "100 900", display: "swap", exposed as the CSS variable --font-switzer. If either file turns out not to be a variable font, stop and tell me.
   - Logo: AIinCongressLogo.svg (165×72, three paths filled #08080C) → src/assets/brand/. Make a <Logo> component that renders it inline with the fills replaced by currentColor, so it can be ink in the topbar and mint in the footer. Accept a width prop; the height follows the viewBox. Give it role="img" and aria-label="AI in Congress".
   - Icon: AIInCongressIcon.svg (the mint quarter-circle mark) → src/app/icon.svg, so Next uses it as the favicon.
   - Placeholder images: don't use any stock photo. Create public/images/placeholder.svg: a flat stone (#EDEBE6) rectangle in a 1440×900 viewBox, with a 1px ink 12% diagonal from corner to corner and nothing else.

3) PROJECT MEMORY: CLAUDE.md already exists in the root. Read it in full and follow it. Don't rewrite it. Only fill in the Commands section once the scripts exist, and tick E0 under Progress.

4) HANDOFF LOG: create docs/progress.md with the heading "# Progress log" and the entry format from CLAUDE.md ("Handoff log"). Write the E0 entry when you finish.

5) PRE-LAUNCH:
   - In src/lib/site.ts, export SITE_LIVE (from the env var, default false), SITE_URL and PORTFOLIO_URL (from env, default "#").
   - In the root layout's metadata, set robots to noindex and nofollow when SITE_LIVE is false.

6) CHECKS:
   - playwright.config.ts with projects at 1440×900, 1280×800, 1024×768, 768×1024 and 390×844.
   - Add a test:e2e script.

Verify that `npm run build` passes and that the dev server renders a blank page with Switzer applied (check the computed font-family in Playwright). Then stop, tell me every file you moved or changed, tick E0 in CLAUDE.md, and write the E0 entry in docs/progress.md.
```

## E1: Tokens (color, tile modes, type, spacing, layout)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E0 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A (sections A2–A7), CLAUDE.md, and the type, fluid-root and spacing sections of docs/eclipse-audit.md.

Implement the design tokens in src/app/globals.css. Use Tailwind v4 @theme where Tailwind should generate utilities, and plain CSS custom properties where it shouldn't.

1) COLOR PRIMITIVES (A2) in @theme as --color-<name>.
   - Add the muted ratio as --muted: 0.72.
   - Don't create any utilities for semantic meanings like "link". Use a separate token, --color-link: var(--color-blue), plus --color-link-hover: var(--color-navy).

2) TILE MODES (A3)
   - Define --tile-bg, --tile-fg, --tile-fg-muted, --tile-line and --tile-hover-bg on [data-tile="<mode>"] for all 12 modes.
   - Build fg-muted with color-mix(in srgb, var(--tile-fg) 72%, transparent). For sage, signal and slate, set fg-muted equal to fg.
   - Build line with color-mix at 12% (light tiles) or 20% (dark tiles, plus sage and signal).
   - Add utilities that read the variables:
     bg-tile, text-tile, text-tile-muted, border-tile-line, border-tile-fg
   - Add a hover/focus flip:
     [data-tile][data-interactive]:is(:hover, :focus-within)
     sets the four variables to mint's values, with a 300ms ease-out transition on background-color and color. Under prefers-reduced-motion: reduce, the transition is 0ms.

3) TYPE (A5): one @utility per token.
   - Utilities: type-display-h1, type-display-h2, type-display-h3, type-heading-h4, type-heading-h5, type-text-large, type-text-medium, type-text-article, type-text-regular, type-text-small, type-ui-nav, type-ui-label.
   - Each sets font-family (var(--font-switzer)), font-size (rem), line-height (unitless ratio), font-weight and letter-spacing (em).
   - The display-* utilities also set text-box: trim-both cap alphabetic.
   - Add font-variant-numeric: lining-nums tabular-nums to type-display-h1 only (for the stat numbers).

4) FLUID ROOT (A6) exactly as written.

5) SPACING AND LAYOUT (A7)
   - Spacing primitives in @theme as --spacing-<n> (rem), so p-40, gap-24 and so on work.
   - Layout tokens as custom properties:
     --layout-tile-pad, --layout-tile-top-md, --layout-tile-top-lg, --layout-stack, --layout-stack-sm, --measure
     with the mobile values in @media (max-width: 767px).
   - Expose utilities: p-tile, px-tile, py-tile, pt-tile-md, pt-tile-lg, gap-stack, gap-stack-sm, max-w-measure.

6) BASE STYLES
   - body: paper bg, ink text, type-text-regular, -webkit-font-smoothing antialiased.
   - :focus-visible: 2px solid var(--tile-fg, var(--color-ink)) outline, with a 3px offset.
   - A .sr-only utility, if Tailwind's isn't present.
   - Links inside .prose-article use the link tokens from A5.

7) STYLEGUIDE ROUTE: src/app/styleguide/page.tsx. It renders only when NODE_ENV !== "production" and calls notFound() in production. It shows:
   - every color swatch with its hex;
   - one tile per mode, with sample fg and muted text, a line, and a "Hover me" interactive tile;
   - every type token, with its name and computed size at the current width;
   - the spacing scale as bars.

Verify:
- the build passes;
- at 1440, getComputedStyle shows type-display-h2 at 66px and 0.035em tracking, and type-text-article at 20px with a 32px line height;
- at 1280, the root is 14px;
- at 390, the tile padding is 24px.

- Eclipse parity (CLAUDE.md, section 6): compare with Claude in Chrome at the listed widths, retune tokens if something is clearly off, and log any changes to docs/token-log.md.

Save a screenshot of /styleguide at 1440 to screens/e1/. Then stop and report. Tick E1 in CLAUDE.md, then append the E1 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E2: Shell components (Tile, ActionRow, Pill, Topbar, Footer, NewsletterBand, layout)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E1 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A and CLAUDE.md. If the Figma MCP server is available, screenshot nodes 2076:2213 (topbar and statement), 2076:2344 (footer) and 2076:2358 (newsletter) in file 9DKYbMDVJ43Kt1IDcf0XJS, and use them as the visual target. Tokens only; no raw values.

Build these in src/components/:

1) <Tile mode as="section" interactive? className>
   - Sets data-tile={mode}, and data-interactive when interactive.
   - Applies bg-tile and text-tile, with padding p-tile by default.
   - Props for top padding: "none" | "md" | "lg".

2) <ActionRow label href? external? decorative?>
   - A full-width row: a 1px top line in border-tile-fg, then layout-stack-sm (8) gap, then the label in type-heading-h4 on the left and Carbon ArrowRight (24) on the right. Use ArrowUpRight when external.
   - With href: render a link whose accessible name is the label (plus "(external site)" when external).
   - With decorative: aria-hidden="true", no link. This is for "Read more" inside tiles.

3) <Pill>{children}</Pill>
   - A span with type-heading-h5, uppercase, a 1px border in border-tile-fg, text-tile, padding 4 × 24, fully rounded, and a transparent background. It inherits the tile's mode, so it's white on Ink and ink on Paper.

4) <Topbar variant="home" | "article">: a mint Tile.
   - Inner row: tile padding (40), height 80, with the Logo (165 wide) on the left and the nav on the right.
   - Nav: a <nav aria-label="Main"> holding a 631-wide grid of two rows:
     * row 1: Articles, Privacy Policy, Joey Holzman ↗ (external, PORTFOLIO_URL);
     * row 2: Bill Tracker, Accessibility.
     Columns are 192 / 199 / 192 wide with layout-stack (24) between them, and layout-stack-sm (8) between the rows.
   - Each nav item: a 1px top line in tile-fg, then an 8 gap, then the label in type-heading-h5. The external item puts ArrowUpRight (24) at the far right of its 192 column.
   - Mark the current page with aria-current="page" and an underline.
   - variant="article" adds a 1px ink 12% bottom border to the topbar, because a volt header next to mint is 1.0:1.
   - variant="home" renders children below the nav row (for the statement in E4).

5) <Footer>: an Ink tile.
   - Left: the Logo in mint, 648 wide at 1440 (40.5rem), at the tile's top-left padding.
   - Right, starting at x = 832 (use grid placement: the right column starts at quarter 2 + 112, about 58% of the width):
     * a link grid in type-heading-h5 mint: Articles, Bill Tracker (column 1, rows 61 apart); Privacy Policy, Accessibility (column 2, at +182); Joey Holzman ↗ (column 3, at +371);
     * below it, the disclaimer in type-text-regular paper, max-width 35rem: "AI in Congress is an independent blog and is not affiliated with, endorsed by, or sponsored by the United States Congress or any government entity. All views and opinions expressed are solely those of the author, Joey Holzman."
   - No top border. Use <nav aria-label="Footer"> around the links.
   - If the exact x positions fight the layout, put the right group on the 50% line plus 112 and tell me what you did.

6) <NewsletterBand>: a signal Tile with the fg override to paper (A3 note: every text element here is 24px or larger).
   - Heading: <h2> "Get new analysis by email" in type-display-h2, paper.
   - Form at layout-tile-top-md below the heading: an input (flex 1) and a button, side by side with a 21px gap. Both fully rounded, with padding 24 × 40, in type-display-h3.
     * Input: paper background, ink text. Placeholder "name@domain.com" in ink 72%.
     * A VISIBLE label above it: "Email address" in type-heading-h4 paper. This isn't in Figma yet, but a placeholder isn't a label (WCAG 1.3.1, 3.3.2).
     * Button: "Submit", ink background, paper text. Hover and focus: mint background, ink text.
   - Pre-launch behavior:
     * the form has no action;
     * on submit, preventDefault and write "Signups open soon." into an aria-live="polite" region below the form (type-heading-h4, paper);
     * without JavaScript, the form posts to "#" and nothing breaks.

7) src/app/layout.tsx
   - <html lang="en">, the Switzer variable, and a skip link "Skip to content" as the first element. It's visually hidden until focused, then shows as an ink tile at top left.
   - <main id="main" tabIndex={-1}>.
   - The footer and the newsletter band come from a shared <SiteEnd> component (NewsletterBand then Footer). Pages render it themselves, so nothing sits between them.

Add src/app/tracker/page.tsx:
- the Topbar (article variant);
- an amber Tile with an h1 "Bill tracker" in type-display-h2 and one sentence in type-text-large: "The bill tracker is in progress.";
- SiteEnd;
- metadata robots noindex.

Verify:
- the shell renders on /tracker at 1440 and 390;
- the keyboard order is: skip link, logo, nav items in reading order, the tracker content, the email field, Submit, footer links;
- focus is visible on every stop;
- axe reports no violations on /tracker;
- the nav targets are at least 24px tall.

Save screenshots to screens/e2/. Stop and report. Tick E2 in CLAUDE.md, then append the E2 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E3: Content model (built around the imported articles)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E2 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A (A4) and CLAUDE.md.

The real articles have already been imported from the old site:
- content/posts/*.mdx: 6 posts, one per category;
- content/bills.json: 4 bills.

Build the content layer AROUND these files. Don't rename their frontmatter fields, and don't edit their prose. Lines marked TODO(joey) are Joey's to resolve: leave them, and list them in your report.

1) CATEGORIES: src/lib/categories.ts
   - The six categories from A4, keyed by the exact label strings used in the frontmatter ("Child safety", "Deepfakes", "Executive branch", "Lawmakers", "National security", "States"), each with { label, slug, headerMode }.
   - Header modes: Child safety → blush, Deepfakes → navy, Executive branch → slate, Lawmakers → volt, National security → sand, States → sage.

2) POSTS: src/lib/posts.ts, with a zod schema that matches the imported frontmatter exactly:
   - title, description (the dek), date, category (one of the six labels), author;
   - updated? (date), featured? (boolean), draft? (boolean);
   - bills? (string[] of bill ids, default []);
   - editorNotes? ({ type: "update" | "correction", date, text }[]);
   - sources? ({ label, href: https URL }[]);
   - image? ({ src, alt (required when image is present, min 1 char), credit? }).
     None of the posts have an image yet. When it's absent, the UI uses /images/placeholder.svg as a DECORATIVE image (alt="") and shows no credit.

   gray-matter may parse dates as Date objects (strip any "# TODO" comments safely, since YAML already ignores them). Normalize every date to a YYYY-MM-DD string.

   If validation fails, the build fails with the file name and field.

   Loader functions:
   - getAllPosts(): drafts excluded in production, newest first;
   - getPost(slug): the slug is the file name;
   - getFeaturedPost(): featured: true, or else the newest non-draft post;
   - readingMinutes: computed from the body at 230 words per minute, rounded up.

   Note: the TAKE IT DOWN post is draft: true, so it's the featured post in dev and absent in production. That's expected. Don't change it.

3) BILLS: src/lib/bills.ts reads content/bills.json as it is.
   - The shape is { bills: [{ id, label, title, sponsor: { name, party, state }, introduced, status, asOf, url }] }.
   - Export getBills(ids).
   - Formatting helpers:
     * sponsor line: "Sponsor: <name> (<party>-<state>)";
     * status line: "<status> as of <Mon D, YYYY from asOf>".
   - Unknown ids fail the build.

4) BILL STATS: create content/bill-stats.json
   - { placeholder: true, congress: "119th", asOf: "2026-10-01", source: "Congress.gov", introduced: 123, reported: 16, passedOneChamber: 4, becameLaw: 2 }
   - These are Figma placeholder numbers. While placeholder is true, the build prints a warning.

5) CHARTS: the TAKE IT DOWN post uses <Chart title summary source={{label, href}} table={{columns, rows}} />.
   - The chart treatment isn't designed yet. Build the simplest accessible version:
     * a <figure> with the title in type-heading-h4;
     * the summary in type-text-regular;
     * a real <table> of the data (type-text-regular, a <caption> equal to the title, ink 12% row lines, numeric columns right-aligned with tabular numerals);
     * a figcaption source link, styled as a link.
   - No D3 and no chart library.

6) MDX COMPONENTS: mdx-components.tsx maps the elements to the A5 article styles, and registers Chart.
   - Elements: p, h2, h3, ul, ol, li, blockquote, a, strong, em.
   - External hrefs get rel="noopener" (no ↗ in body links).
   - Wrap the body in a .prose-article container. Don't use @tailwindcss/typography.
   - Delete content/_fixtures if it exists. Nothing else is fixture content.

7) STATIC PAGES: content/pages/accessibility.mdx and privacy-policy.mdx were imported from the old site. The nav already links to /accessibility and /privacy (both 404 today).
   - A tiny loader, getPage(slug), that reuses the post loader's MDX handling. Frontmatter: title, description, updated.
   - Routes src/app/accessibility/page.tsx and src/app/privacy/page.tsx. Each one:
     * Topbar (article variant, with the matching `current`);
     * a paper Tile with the <h1> in type-display-h2 on the measure and "Updated <date>" in type-heading-h5, text-tile-muted;
     * the MDX body in .prose-article on the measure;
     * <SiteEnd />.
   - The same <main> structure as /tracker.
   - Leave the [EMAIL] and [TEST DATE] placeholders and the TODO(joey) comments exactly as they are, and list them in your report.

Add a small check script (vitest or node, your choice) that:
- all 6 posts validate;
- every bill id they reference exists;
- a post missing a category fails.

Verify:
- the build passes and prints the bill-stats warning;
- all 6 posts compile;
- report a table of each post's slug, category, header mode, bill count, editorNotes count, source count and reading minutes, plus every TODO(joey) line, with file and line.

Stop. Tick E3 in CLAUDE.md, then append the E3 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E4: Home (HomeNew `2076:2212`)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E3 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A and CLAUDE.md. If the Figma MCP server is available, screenshot node 2076:2212 in file 9DKYbMDVJ43Kt1IDcf0XJS and use it as the visual target at 1440. Use only components from E2 and tokens from E1.

Build src/app/page.tsx. The bands, top to bottom:

1) TOPBAR (home variant), mint, total height 266 at 1440.
   - Below the nav row, the statement: <h1> "See how Congress is handling AI policy." in type-display-h2, ink, at the tile padding.
   - It starts 53px below the nav row (top 173 in Figma). Use layout-tile-top-md minus the trim. Get the 173 optically and tell me which tokens you used.
   - Bottom padding: layout-stack (24).

2) BILL BAND: an amber Tile, about 519 tall at 1440. Data from bill-stats.json.
   - Header row, with the items aligned on their first baseline:
     * left: <h2> "AI bills in the 119th Congress" in type-display-h3;
     * right: "Congress.gov, updated Oct 1, 2026" in type-heading-h5 with text-tile-muted, built from the data.
   - Stats: a 4-column grid with no dividers. Each stat's left edge sits on its quarter line plus the tile inset (40, 400, 760, 1120 at 1440), so they line up with the grid below. Each stat is a <div> with:
     * the number in type-display-h1;
     * the label in type-heading-h4, 8 below it.
     Labels: Introduced, Reported by committee, Passed one chamber, Became law.
     Mark it up as a <dl>, with each <dt> as the label and each <dd> as the number, using CSS order so the number shows first. The stats start layout-tile-top-lg (140) below the header.
   - All stats use text-tile (ink). Don't color the last one (see A1).
   - Bottom: <ActionRow label="Open the bill tracker" href="/tracker" />.

3) FEATURED: a two-column band, 807 tall at 1440 (50.4375rem).
   - Left half: an ink Tile, padding 40, flex column, space-between. It holds two groups:
     * top: the Pill (category label) and the date (type-heading-h5, text-tile-muted) in a row with a 24 gap; then, 24 below, the <h2> title in type-display-h2, paper, holding the link that's stretched over the whole tile;
     * bottom: the dek in type-heading-h4, paper, max-width 30.625rem (490); then, 24 below, <ActionRow label="Read more" decorative />.
     The tile is interactive, so hover and focus flip it to mint.
   - Right half: the post image, cropped to fill (object-fit: cover), height equal to the left half. It never sets the height.
   - Below 768, the image follows the text (see E6).

4) MORE ANALYSIS GRID: Paper, two columns of half tiles, each about 354 tall at 1440.
   - Every post except the featured one, newest first.
   - Each tile is interactive, with padding 40. Top group: the Pill and date row; 24 below, the <h3> title in type-display-h3 (holding the stretched link). Bottom: <ActionRow label="Read more" decorative />, pinned to the bottom with mt-auto.
   - Lines: the left column has a 1px border-right in border-tile-line; every tile has a 1px border-bottom in border-tile-line. No outer borders.
   - Odd count: the last tile spans both columns.
   - Give the grid an <h2 class="sr-only">More analysis</h2> so the tile <h3>s have a parent.

5) <SiteEnd /> (the newsletter band, then the footer).

STICKY SLIDE-OVER (Eclipse's scroll behavior)
- Wrap bands 1 and 2 in a container. With
  @media (min-width: 768px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)
  the container is position: sticky, top: 0, z-index: 0.
- Every band after it is position: relative, z-index: 1, with a solid background, so the featured band slides over the top section as you scroll.
- :focus-within on the sticky container raises its z-index to 2.
- If the combined height of bands 1 and 2 is taller than the viewport, the container is not sticky (use a tiny client hook with ResizeObserver; without JavaScript the default is not sticky).

Verify:
- Screenshots at 1440 and 1280 in screens/e4/, compared against the Figma frame. List every visible mismatch you couldn't resolve.
- The keyboard order: skip link, nav, "Open the bill tracker", the featured link, the grid links, the newsletter, the footer.
- Tabbing never lands on a focused element that's hidden under the sticky band.
- axe has no violations.
- Each tile has exactly one link (count the <a> elements per tile).
- Hover and focus each flip a tile to mint, with the text staying ink.
- Under reduced motion, the top section isn't sticky.

- Eclipse parity (CLAUDE.md, section 6): compare with Claude in Chrome at the listed widths, retune tokens if something is clearly off, and log any changes to docs/token-log.md.

Stop and report. Tick E4 in CLAUDE.md, then append the E4 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E5: Article (Article `2075:1532`)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E4 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A (especially A1, A3, A4 and A5) and CLAUDE.md. If the Figma MCP server is available, screenshot node 2075:1532 in file 9DKYbMDVJ43Kt1IDcf0XJS (and the header 2075:1858 and the rail 2075:1905) as the visual target at 1440. Apply the A1 deviations; they override the frame.

Build src/app/posts/[slug]/page.tsx with generateStaticParams and generateMetadata (the title, plus the dek as the description).

1) TOPBAR, article variant (with its bottom line).

2) HEADER: a Tile whose mode comes from the category (A4). Height about 702 at 1440, including the overlap below.
   - "All articles": a link to "/" at the top left, at the tile inset. Carbon ArrowLeft (24), then a 12 gap, then the label in type-text-large. Its color is text-tile, so it turns white on navy and slate (A1 contrast fix).
   - The reading block sits on the measure (400–1040 at 1440, centered on the page):
     * the Pill (category);
     * 29 below it, the <h1> title in type-display-h2, text-tile;
     * 42 below that, the dek in type-heading-h4, text-tile;
     * layout-tile-top-md below that, the meta row in type-ui-nav, text-tile: on the left, a 23px dot in the tile fg (decorative, aria-hidden) and "N min read"; on the right, "By Joey Holzman, Published <date>", plus " · Updated <date>" when there's an update. Use <time> elements.
   - Map the Figma gaps (pill → title 29, title → dek 42) to the nearest layout tokens (24 and 40), and tell me which you used.

3) IMAGE: the post image straddles the edge of the header.
   - It's the full width of the measure, at an aspect ratio of 721 / 438.
   - It overlaps the header by 104px (the header gets that much extra bottom padding, and the image a negative top margin).
   - Use a <figure>. When there's a credit, add a <figcaption> in type-text-small with text-tile-muted, 12 below the image.

4) EDITOR'S NOTES (only when present; not in Figma yet, so follow the spec):
   - a full-width stone Tile with its content on the measure;
   - each note is a <div role="note" aria-label="Update, <date>">, with the label "Update · <date>" (or "Correction · …") in type-heading-h5, then the text in type-text-regular.

5) BODY + RAIL: a two-column layout starting 60 below the image.
   - Body: <article> on the measure, using the .prose-article styles from E3.
   - Rail: <aside aria-labelledby="rail-heading">, DOCKED (A1):
     * it starts on the 1080 quarter line (75%) and runs to the right edge of the viewport;
     * its top lines up with the first paragraph;
     * its height hugs its content.
     Inside:
     * Cap: an amber Tile, padding 40 on the sides, about 100 tall, with the text sitting at the bottom. <h2 id="rail-heading"> "Bills in this article" in type-heading-h4.
     * Body: a stone Tile, padding 40. For each bill:
       - the number in type-text-regular, text-tile-muted;
       - the title in type-heading-h4, 0 gap;
       - then a <ul> of two items (the sponsor, and the status line from E3) in type-text-article, each with a decorative 16px ink dot bullet (CSS marker, aria-hidden), with 8 between items;
       - then 40 below, an ActionRow-style link "Track this bill" in type-heading-h5 with ArrowUpRight (24), opening the bill URL. It has a 1px top line in tile-fg and an "(external site)" suffix for screen readers.
       - Separate bills with a 1px border-tile-line and 24 of space on each side.
     * Sticky: top 0, only under the A9 sticky guards, AND only when the rail fits the viewport minus 80. Measure it with ResizeObserver; without JavaScript, it isn't sticky. :focus-within raises its z-index.
     * Below 1280: the rail moves before the body, as a full-width block (cap plus body), with its content on the measure. Keep one DOM position: put the aside before the article in the DOM and use grid placement at 1280+ to move it into column 4. Confirm the reading order is still sensible.
     * If a post has no bills, there's no aside at all.

6) SOURCES (only when present):
   - After the body: a 1px border-tile-line across the measure.
   - 41 below the line: an <h2> "Sources" in type-display-h3, ink.
   - 30 below the heading: an <ol> in type-text-article with a 12 gap between items. The markers are text-tile-muted, hanging outside the text edge (a 30 indent).
   - Each <li> is ONE link: the whole citation, in the link color (blue), with a 1px underline. Carbon ArrowUpRight (24) sits inline at the end, inside the link, with "(external site)" for screen readers.
   - Hover: navy, with a 2px underline.

7) END: 140 of space (layout-tile-top-lg) after the sources (or after the body, when there are none), then <SiteEnd />.

Not in Figma yet. Don't build these; list them in your report:
- Copy article link
- Related / More analysis tiles
- The chart treatment

Verify:
- Screenshots of the Deepfakes (navy) post and the Lawmakers (volt) post at 1440, 1280 and 1024, in screens/e5/.
- The Executive branch (slate) and States (sage) headers have no muted text.
- "All articles" passes contrast on every header color. Run axe on all 6 posts.
- The rail: it's docked to the right edge, an 80px gap from the text at 1440, sticky while it fits, and not sticky for the 2-bill post if that doesn't fit. Focus is never hidden.
- The heading outline: h1 → body h2s → rail h2 → Sources h2.
- With JavaScript disabled, everything renders.

- Eclipse parity (CLAUDE.md, section 6): compare with Claude in Chrome at the listed widths, retune tokens if something is clearly off, and log any changes to docs/token-log.md.

Stop and report. Tick E5 in CLAUDE.md, then append the E5 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E6: Mobile first pass (≤767), plus tablet sanity checks

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E5 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A and CLAUDE.md. Joey will refine mobile in Figma. This is a sensible first pass, not final. Keep every change inside @media (max-width: 767px) unless it's a bug, and add a type scale for mobile only.

1) MOBILE TYPE (revised after E1.1): start from the ≤991 tablet values in Part A (A5); don't use the old desktop → mobile table.
   - At ≤767 (and ≤479 if Eclipse has a step there), use Eclipse's live measurements at 767 and 390 wherever they're SMALLER than our ≤991 values. Where Eclipse doesn't shrink, keep the ≤991 value.
   - text-article stays 18 / 28.8.
   - tests/scaling.spec.ts must still pass, covering both font size AND line height. Nothing grows as the width shrinks. Don't loosen the test to make a value fit.
   - Log the new values in docs/token-log.md, marked "carry to Figma".

2) LAYOUT (tile-pad is already 24 from E1):
   - Topbar:
     * the logo on its own row;
     * the nav becomes a 2-column grid below it (Articles, Privacy Policy / Bill Tracker, Accessibility / Joey Holzman ↗), with the lines above each item kept;
     * the statement follows, 32 below.
   - Bill band:
     * the header stacks, with the source line under the heading;
     * the stats become a 2 × 2 grid with 32 between rows;
     * the action row stays.
   - Featured: one column. The text tile first (with min-height removed, and a 56 gap instead of space-between), then the image at an aspect ratio of 4/3.
   - Grid: one column. Each tile has only a border-bottom.
   - Newsletter:
     * the input and button stack full width, 16 apart;
     * the field and button text use type-heading-h4;
     * the button is full width.
   - Footer:
     * the logo is 60% of the width;
     * the links form a 2-column grid below it, and the disclaimer follows;
     * every link has a 24px-plus target.
   - Article:
     * the header uses tile-pad 24, the reading block is full width, and "All articles" sits above the pill;
     * the meta row wraps onto two lines;
     * the image is full width inside the padding, still overlapping the header by 56;
     * the rail sits before the body, full width;
     * Sources is full width.
   - No sticky elements below 768 (that's already a guard; confirm it).

2b) HOLD COMPONENT SIZES AT THE 991 JUMP (carried over from the E2 handoff): these still grow at 992 → 991:
    * the topbar logo (144 → 165);
    * the nav width (552 → 615);
    * the newsletter input and button (78.7 → 84 tall);
    * the footer logo (567 → 648).

    - Give --logo-topbar, --nav-cols and --logo-footer ≤991 values that are no larger than their 992 values.
    - Switch the input and button padding from the space-* primitives to the layout tokens (tile-pad horizontally, stack vertically), which already step down.
    - Add all four to tests/scaling.spec.ts.

3) TABLET SANITY (768–1279): the rail is inline (from E5), the measure centers, and the grid stays at two columns. Fix any overflow.

Verify:
- Screenshots of Home and of the navy and volt articles at 390, 768 and 1024, in screens/e6/.
- No horizontal scroll at 320 wide, or at 400% zoom of a 1280 window (WCAG 1.4.10).
- With text spacing overrides (line-height 1.5, paragraph spacing 2×, letter spacing 0.12em, word spacing 0.16em), nothing clips (WCAG 1.4.12).
- Every target is at least 24px.

- Eclipse parity (CLAUDE.md, section 6): compare with Claude in Chrome at the listed widths, retune tokens if something is clearly off, and log any changes to docs/token-log.md.

List anything that looked wrong but that you left alone because it's a design call. Stop and report. Tick E6 in CLAUDE.md, then append the E6 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E7: QA pass

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A (A9) and CLAUDE.md. Don't add features. Only find and fix defects, and report.

Run and fix:
1) axe-core on /, /tracker and all 6 posts, at 1440 and 390: zero violations.
2) A contrast audit script: for every [data-tile] element on every page, compute the contrast of each text node's color against the tile background (including the 72% muted blends). Fail on anything below 4.5:1, or below 3:1 for text 24px and up. Print a table.
3) Keyboard: script a Tab walk on Home and on one article. Assert that every focused element is visible (inside the viewport and not covered by a sticky element: use elementFromPoint at its center) and that its outline width is 2px or more.
4) Zoom: emulate 1280 at 200% and 400%. No horizontal scroll, and no content lost.
5) Reduced motion: nothing is sticky and no transitions run.
6) JavaScript disabled: every page renders, the newsletter form is present, and nothing is broken.
7) Fluid root check: at 1366, 1280, 1024 and 991, report the computed root and the body text size. Confirm the article body is never below 17px on desktop widths.
8) Placeholders: list every placeholder: true file, and confirm the build warning for bill-stats.json.
9) Lighthouse (or the equivalent) accessibility and best-practices scores for / and one article.
10) A final Eclipse parity pass with Claude in Chrome (CLAUDE.md, section 6) at all seven widths, covering type scaling, tile padding, band rhythm, hover timing and the sticky slide-over. Retune tokens where something is clearly off, log the changes, and include before and after screenshots.

Save all screenshots and reports to screens/e7/. Report:
- every defect fixed, with its file;
- everything still open (with the deferred items: Copy article link, Related, charts, the newsletter design, the bill tracker page).

Tick E7 in CLAUDE.md, then append the E7 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

---

## Open items (design, not code)

- **Newsletter form:** Joey is designing the final version. The build adds a visible label and keeps the Figma shapes for now.
- **Bill tracker page:** a stub exists at `/tracker`.
- **Figma file updates:**
  * set `Heading/H5` to Switzer;
  * change the `cobalt` variable to blue `#0060C4`;
  * move the article rail to x 1080 with width 360;
  * fix "Accessability".
- **Not designed yet:** Copy article link, the Related tiles on the article, the chart treatment, the final mobile frames.
- **Before launch:**
  * resolve the TODO(joey) lines in the posts;
  * add a real image (with alt text) to each post;
  * replace the bill-stats placeholder numbers;
  * then set `SITE_LIVE=true`.
