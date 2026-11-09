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
| Bill band: "Bills Enacted" label in signal, like its number | The "Became law" number is signal; its **label stays ink** | Signal on paper is 3.47:1, only allowed for text ≥ 24px. The heading-h4 label is 21px at 1280, 20 at 991 and 16 at 390. |
| Newsletter input with no border | **1px solid ink border** on the input (Submit gets the same, invisible on ink, so the two stay the same height) | White on amber is 1.85:1, so the input's edge fails WCAG 1.4.11 (a component boundary needs 3:1). Carry to Figma. |
| Hardcoded `#0d0c2b` text in the rail | `ink` | Old palette value. |
| Home statement "See how Congress is handling AI policy." (Display/H2) below the nav row | **Removed** (E6.7). Home's one `h1` is visually hidden (`sr-only`), reads `SITE_NAME` ("AI in Congress") and is the first child of `<main>`. The bill band heading is an `h2` in display-h2 | Joey: the statement cost a full row on every first render and said what the page already shows. The band heading names one section, not the page, so it stays an `h2`. |
| Topbar: Home 24 bottom padding with no line; articles a 1px line | **Identical on every page:** logo + nav, the tile's 40 padding (24 ≤991), **no bottom line** (E6.7) | Plain site chrome. Joey removed the line; the Lawmakers (volt) header now meets mint with no line (1.0:1). That edge isn't a UI component, so 1.4.11 doesn't apply. |
| Article topbar mint, above the category header | **The topbar takes the header mode** (E6.9), with a 1px `--tile-line` hairline under it on article pages only. Same layout and padding as every other page; mint elsewhere, with no line (E6.7) | Joey: mint above a colored header read as two unrelated blocks. One field, with the hairline keeping the nav reading as navigation. |
| Article title always Display/H2 | **Display/H3 when the title runs past 3 lines at H2** (E6.9), counted in the browser at the current width (`Title.tsx`). Without JS it stays H2 | Joey's call. At ≥ 992 that's Comparing, House and Bilirakis (4 lines → 2); at 390, Comparing and Bilirakis (4 → 3). |
| Bill band header row aligned on its first baseline | **Top-aligned** (E6.7): heading and source line both trim to their cap tops, so the caps sit on the tile's top padding | Joey's call. Below md the source line stacks under the heading. |

## A2. Color primitives

Name each color exactly as shown.

| Token | Hex | Notes |
|---|---|---|
| `paper` | `#FFFFFF` | |
| `stone` | `#EDEBE6` | |
| `ink` | `#08080C` | |
| `navy` | `#10133A` | |
| `signal` | `#FF4301` | Bill tracker. Paper text on it, and signal text on paper, are both ≥ 24px computed at every width (3.47:1). |
| `mint` | `#C2FCD3` | Site chrome and hover |
| `blush` | `#EFCFC8` | |
| `volt` | `#E4FA5B` | |
| `amber` | `#FFAE3D` | Newsletter. Never a blue link on it (3.28:1). |
| `sand` | `#DDD6BE` | |
| `slate` | `#5B6AA8` | |
| `sage` | `#6F9C86` | |
| `blue` | `#0060C4` | Links on Paper, Stone and Mint only |
| `muted` | 72% | Opacity of `tile-fg` for secondary text (Figma `MutedAgainstLight`) |

**Color means destination:**
- **mint** is site chrome: the topbar, the footer mark and links, and the default hover state.
- **signal** is the bill tracker: "119th Congress" and the "Became law" number on Home (text ≥ 24px only), the "Explore the bill tracker" button at rest (E6.6), the "Bills in this article" rail cap and the /tracker header. The Home bill band itself is paper.
- **The 24px rule (E6.8):** signal is 3.47:1 against paper, so signal text on paper and paper text on signal tiles are both large text only: ≥ 24px computed at every width (WCAG large text, 18pt). Labels on signal use `heading-h4-24` (A5). **Why paper, not ink, on signal:** WCAG 2 rates ink on signal 5.76:1 but it reads poorly (APCA Lc 43); paper is 3.47:1 under WCAG 2 but Lc 66 under APCA, so paper at ≥ 24px passes both models.
- **amber** is the newsletter band, with ink text. No links on it (blue on amber is 3.28:1).
- **navy** is the Home featured tile (and the Deepfakes article header).
- **ink** is the footer and the "Explore the bill tracker" button's hover and focus (E6.6).
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
| `--tile-hover-fg` | Text color on hover (unset: ink) |

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
| signal | signal | **paper** (E6.8; ≥ 24px only) | **paper** (no muted) | paper 20% | (none) |
| ink | ink | paper | paper 72% | paper 20% | mint |
| navy | navy | paper | paper 72% | paper 20% | mint |
| slate | slate | paper | **paper** (no muted: 72% is 3.5:1) | paper 20% | mint |

- **The tracker button, signal → ink (E6.6; paper label since E6.8):** the "Explore the bill tracker" button is a signal tile (paper label and arrow, the mode's default; the label is `heading-h4-24`) with `--tile-hover-bg` set to ink and `--tile-hover-fg` to paper, so hover and focus flip it to ink with paper text (19.8:1) and a paper focus ring.
- **The Home featured tile, navy → amber (E6.10 follow-up, Joey's call):** `--tile-hover-bg` is amber, `--tile-hover-fg` unset, so hover and focus flip it to amber with ink text (15.6:1) and ink-72% muted text (about 6.1:1), as on the newsletter band.
- **The Home grid tiles, ink → paper (E6.10 follow-up, Joey's call):** `PostTile` is `mode="ink"` (paper title, arrow and pill; paper 72% date; 20% lines) with `--tile-hover-bg` set to paper and `--tile-hover-fg` unset, so hover and focus flip it to paper with ink text, ink 72% date, 12% lines and an ink focus ring. Every other interactive tile hovers to mint with ink.
- **Signal tiles have paper text, and all of it is ≥ 24px (E6.8):** the button label and the rail cap use `heading-h4-24`; the /tracker header is display-h2 plus a display-h3 sentence (24 on phones). **Amber tiles keep ink text** (ink on amber is 10.8:1).
- **Hover and focus switch the whole mode,** not just the background: `bg` takes `--tile-hover-bg` (mint; ink on the tracker button, amber on the featured tile, paper on the grid tiles) and `fg`, `fg-muted` and `line` derive from `--tile-hover-fg` (ink unless set; paper on the tracker button), and all four fade together over 300ms (0ms under reduced motion).
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

**The article topbar takes the header mode (E6.9),** so the top of an article is one colored field: the logo, nav text, nav rules and focus rings follow the mode's fg (paper on navy and slate, ink on the rest). A 1px hairline in the mode's `--tile-line` (fg at 12%, or 20% on sage, navy and slate) runs under the topbar on article pages only. It's decorative and keeps the nav reading as navigation. Nav text (heading-h5) on the topbar: blush 13.7, navy 17.9, slate 5.2, volt 17.3, sand 13.7, sage 6.5 (all ≥ 4.5:1). Home, /tracker, /privacy and /accessibility keep the mint topbar with no line.

**Pills are always neutral:** outlined, with no fill (or a fill matching the tile background), the border and text in `tile-fg`. Category color appears only on the article header.

## A5. Type

Font: **Switzer Variable**, loaded locally. Letter spacing is in **em**, converted from Figma's percentages. Sizes are in **rem**, where 1rem = 16px at 1440.

**Tablet step (≤ 991):** the root jumps from 14px to 16px at 991 (A6), so every style steps down there. Without the step, type would grow as the window narrows. The ≤ 991 column is in px at the 16px root. h4, h5 and text-large follow Eclipse's live ≤ 991 values; display-h1 and h2 keep them too (60, 40). display-h3 is 32 / 36 at ≤ 991 (E6.7 restored this; E6.4 had made it 28 / 31.5). The other styles hold at their 1024 size, rounded down to a whole px. Tracking (em) and weights don't change. `text-article` has an 18px floor at every width (`max(1.25rem, 18px)`), so it reads 18 between 992 and 1280 instead of 17.5. `text-small` and `ui-label` have a 13px floor the same way (`max(…, 13px)`), so they read 13 from about 1350 down instead of 12.25 (992–1280) and 12 (≤ 991). `tests/scaling.spec.ts` fails if any style or layout token grows as the width shrinks.

| Token | Size / line height | ≤ 991 | Weight | Letter spacing | Source | Used for |
|---|---|---|---|---|---|---|
| `display-h1` | 90 / 90 | 60 / 60 | 600 | −0.04em | Figma | Bill stat numbers |
| `display-h2` | 66 / 66 | 40 / 40 | 600 | −0.035em | Figma | Bill band heading (E6.7), featured title, article title (display-h3 when it runs past 3 lines at h2, E6.9), newsletter heading |
| `display-h3` | 38 / 42 | 32 / 36 | 600 | −0.03em | Figma | Grid tile titles, article h2, "Sources", newsletter field and button text |
| `heading-h4` | 24 / 31 | 20 / 26 | 600 | −0.02em | Figma | Stat labels, featured dek, article dek, rail bill title |
| `heading-h4-24` | 24 / 31 | 24 / 31 | 600 | −0.02em | E6.8 | Text on signal: the tracker button label, the rail cap. heading-h4 with a 24px floor (`max(…, 24px)`) at every tier, so 24 from 1440 down (33 at 2560); the line height stays 31/24 at every tier so it never grows at 991 |
| `heading-h5` | 18 / 25.2 | 15 / 21 | 600 | −0.015em | Figma (Inter → Switzer) | Nav links, pills (uppercase), dates, source line, footer links, "Track this bill", ALL action-row labels (Joey, E5.1: same type as the nav links) |
| `text-large` | 24 / 31 | 20 / 26 | 400 | −0.015em | Figma | "All articles" back link |
| `text-medium` | 22 / 29 | 18 / 23.7 | 400 | −0.01em | Spec | (reserved) |
| `text-article` | 20 / 32 | 18 / 28.8 | 400 | 0 | Figma | Article body, rail status lines, source list items |
| `text-regular` | 16 / 22 | 14 / 19.25 | 400 | 0 | Figma | Footer disclaimer, rail bill number |
| `text-small` | 14 / 20 | 13 / 18.6 | 400 | +0.005em | Spec | Figure captions |
| `ui-nav` | 18 / 20 | 15 / 16.7 | 500 | −0.005em | Figma | Article meta row |
| `ui-label` | 14 / 20 | 13 / 18.6 | 500 | +0.005em | Spec | (reserved) |

**Display sizes: reverted in E6.7.** Joey asked for the earlier, larger sizes back, so display-h1/h2/h3 are Figma's 90/90, 66/66 and 38/42 again (78.75, 57.75 and 33.25 at 1220), and ≤ 991 display-h3 is 32/36. The note below is history. **Was (E6.4, Joey's taste call, not Eclipse parity):** display-h1/h2/h3 went from Figma's 90/90, 66/66 and 38/42 to 72/72, 52/52 and 32/36 at 1440, so a laptop reads them the way a 2560 monitor (root capped at 1920) did. At 1220 (root 14) they're 63, 45.5 and 28. The fluid root, its breakpoints and the cap didn't change. Until the Figma styles are updated, the file shows the old sizes.

**heading-h5 (E6.6, Joey's taste call):** 20/28 → 18/25.2 at 1440 (line height 1.4), ≤ 991 16 → 15, ≤ 767 14 unchanged, so the nav links sit right beside the smaller display headings. 18 is also Eclipse's nav size at 1440 (E5.1). It computes to 15.75 at 1220 (root 14), so the ≤ 991 value is 15, not 16 (no growth at the jump), and equals `ui-nav` there.

**Article body (spec):**
- Paragraph spacing 24.
- Body h2 uses `display-h3`, with 24 below it. Sections are 32 apart, matching Figma.
- Lists use `text-article`: 24 indent, 12 between items, markers in `tile-fg-muted`.
- Block quote: a 2px `tile-fg` left rule and 24 padding, upright (not italic).
- `strong` is weight 600; `em` is Switzer Italic 400.
- Links are `blue` with a 1px underline at a 3px offset. On hover, the link turns navy and the underline goes to 2px.
- No justified text and no hyphenation.

**Mobile step (≤ 767, E6):** Eclipse's live ≤ 767 sizes where they're smaller than the ≤ 991 column: display-h1 40/40, display-h2 34/34, display-h3 24/27.6, heading-h4 16/20.8, heading-h5 14/19.6, text-large 18/23.4. The other styles keep their ≤ 991 values. The query is Tailwind's `md` condition (`width < 48rem`), so it switches with the `max-md:` utilities.

**Display text:** apply `text-box: trim-both cap alphabetic` (where supported) to `display-*` styles.

## A6. Fluid root (Eclipse's model)

```css
html { font-size: max(0.875rem, calc(-0.125rem + 1.25vw)); } /* 16px at 1440 */
@media (max-width: 1280px) { html { font-size: 0.875rem; } }
@media (max-width: 991px)  { html { font-size: 1rem; } }
@media (min-width: 1440px) { html { font-size: max(1rem, 0.859375vw); } } /* E6.10 */
@media (min-width: 2560px) { html { font-size: 1.375rem; } } /* cap */
```

**Above 1440 (E6.10, Joey's taste, not Eclipse):** the root follows 22/2560 = 0.859375vw instead of Eclipse's 1.25vw, so text is the same physical size on a 27" 1080p and a 27" 1440p monitor (16.5px at 1920 ≈ 22px at 2560 ≈ 5.1mm). Roots: 16 from 1440 to 1862, 16.5 at 1920, 17.6 at 2048, 22 from 2560. It's continuous at 1440 and 2560 and never shrinks as the window widens.

Every size, space and layout token is in rem, so the whole layout scales together.

The `max()` floor changes nothing at the default 16px browser font size. With a larger default, it lets the user's setting win over `vw` between 1281 and 2559 (WCAG 1.4.4). The largest root (22) is 1.57× the smallest (14), so zoom up to 500% still doubles the text. At a 20px default, the root at 1366 is 17.5px, up from 15.075.

## A7. Spacing primitives and layout tokens

- **Primitives (px at 1440, written in rem):** `space-4, 8, 16, 24, 32, 40, 56, 80, 140`.

| Layout token | Desktop | ≤ 991 |
|---|---|---|
| `layout-tile-pad` | 40 | 24 |
| `layout-tile-top-md` | 80 | 56 |
| `layout-tile-top-lg` | 140 | 80 |
| `layout-stack` | 24 | 16 |
| `layout-stack-sm` | 8 | 8 |

`layout-image-overlap` (E5) is 104 / 91, and 56 at ≤ 767 (E6).

The layout tokens step down at 991, with the type (A5): the root jumps 14 → 16px there, so a token that held its desktop rem would grow as the window narrows (tile-top-md 70 → 80). Eclipse has the same flaw (`top-padding-5` 70 → 80 at 991; `pad-top-large` has no ≤ 991 rule), so its values aren't used; these are the former ≤ 767 values. The `space-*` primitives are rem and still step up at 991 (for example, `space-40` 35 → 40); use a layout token where a value must not grow.

- **Grid:** quarters at 0 / 360 / 720 / 1080 / 1440 (so 25%, 50% and 75%). There is no column gutter; the 40 inset lives inside each tile.
- **Reading measure:** `--measure` = 640 (40rem), from 400 to 1040, which is quarters 2–3 inset by 40. At ≤ 991 it's 35rem (560), its 992 size, so it doesn't widen at the root jump.
- **Lines:** 1px. Tile dividers use `tile-line`. Action-row lines use `tile-fg` at full strength.
- **Pills:** padding 4 × 24, fully rounded, 1px border.

## A8. Icons

Use `@carbon/icons-react`. Two roles, two tokens (E6.11); nothing else sets an icon's size:

| Role | Icons | Token | Size |
|---|---|---|---|
| Inline (beside a label) | Topbar and footer "Joey Holzman" ↗, "All articles" ←, "Explore the bill tracker" →, article sources ↗, action rows ("Track this bill") | `--icon-inline` (`size-icon-inline`) | 1.25em of the label: 22.5 by the 18 nav link, 17.5 by 14 on phones, 30 by the 24 tracker label, 25 by 20 source text |
| Tile (standalone) | Featured and grid tile arrows | `--icon-tile` (`size-icon-tile`) | 48 at 1440 (3rem; 42 at 992–1280), 40 at ≤991, 32 at ≤767 |

**Why em for inline icons:** an icon beside a label should follow the label's size, so every type step, breakpoint and floor carries over by itself, and it can never grow at the 991 root jump unless the label does. 1.25 is Eclipse's ratio (a 30 arrow by a 24 h4). The em resolves on the `<svg>`, so its label's type utility must sit on the icon's parent (on the tracker button, the Tile; on action rows, the link). **Tile arrows** have no label, so they're rem with steps at 991 and 767 (no growth at the jump; close to Eclipse's 38 / 32).

Every icon renders `size={32}`: `ArrowRight` and `ArrowLeft` ship separate 16 (and 20/24) glyphs, `ArrowUpRight` only the 32, so 32 keeps one drawing everywhere; CSS sets the rendered size. Icons inherit `currentColor` and are `aria-hidden`. The link text carries the meaning.

## A9. Accessibility rules (non-negotiable)

- **WCAG 2.2 AA.** Every text and background pair must come from the tables above.
- **Structure:**
  - a skip link as the first focusable element;
  - landmarks: `header`, `nav`, `main` and `footer`;
  - one `h1` per page, and no skipped heading levels.
- **Focus:** a visible 2px outline in `tile-fg`, inset 8px on tiles and offset 3px on inline links.
- **Hover equals focus:** anything that changes on hover also changes on `:focus-visible` or `:focus-within`.
- **One link per tile:** the title is the link, stretched over the tile with `::after`. The tile arrows (E6.1) are `aria-hidden`.
- **Targets:** at least 24×24px.
- **External links:** the visible ↗ plus visually hidden text, "(external site)".
- **Motion:** respect `prefers-reduced-motion`. Transitions are 300ms ease-out, and drop to 0ms when reduced motion is on.
- **Sticky elements:**
  - never on screens under 768 wide or under 640 tall, or under reduced motion;
  - `:focus-within` raises the sticky element's z-index so focus is never hidden (WCAG 2.4.11).
  - **Home is a single stage (E6.1):** only the topbar sticks (top 0, z 0, and only while it fits the viewport, via StickyFit). The bill band is `relative`, z 1, solid paper, and slides up over it; the featured band and everything after it scroll normally (`relative`, z 1) and never cover the bill band. The article rail is the only other sticky element, apart from the tracker's column header.
  - **The /tracker column header (T10)** sticks at top 0 inside `.bill-table` (wide and medium layouts) on screens 640 tall and up, **including under reduced motion**: it's a reading aid that never moves or animates, so the motion rule doesn't apply. It isn't limited to ≥ 768 wide, because the table's own width decides whether a header exists. Rows and links in the table take `scroll-margin-top` of its measured height (WCAG 2.4.11).
- **Images:** `alt` is required in content frontmatter, and the build fails without it.
- **Without JavaScript,** every page and all its content render.
- **Pre-launch:**
  - the whole site sends `noindex` until `SITE_LIVE=true`;
  - the newsletter form doesn't submit anywhere yet;
  - `/tracker` is the working bill tracker (A11, `docs/tracker-spec.md`); its data is refreshed by hand until T7's daily Action runs.

## A10. Eclipse parity

The reference site is https://web.archive.org/web/20240524202822/https://www.eclipse.xyz/. Its measured values, and the reasoning behind our decisions, are in `docs/eclipse-audit.md`. See CLAUDE.md, section 6.
- **Use Claude in Chrome** to compare against it at 1440, 1366, 1280, 1024, 991, 768 and 390, reading computed styles in both tabs.
- **You may retune tokens** (values, which token a component uses, breakpoints, the fluid root) when the scaling or rendering is clearly off.
- **Accessibility and contrast always win,** and the palette and content stay ours.
- **Log every change** in `docs/token-log.md`.

## A11. Bill tracker

`/tracker` is specified in `docs/tracker-spec.md`: the data pipeline (§3), the page and the bill table (§4), and where it departs from Figma (§5). The spec is the source of truth for the tracker; this section only lists the tokens it added to `src/app/globals.css` (all rem, none with a ≤991 step: the table changes layout at its own width instead). Each is also in `docs/token-log.md`.

| Token | Value (at 16px) | Added | Use |
|---|---|---|---|
| `--bill-col` | 7.5rem (120) | T3 | bill number column |
| `--title-min` | 15rem (240) | T3 | title column minimum |
| `--status-col-wide` / `--status-col-medium` | 13rem (208) / 12rem (192) | T3 | status column |
| `--action-min` | 14rem (224) | T3 | latest-action column minimum |
| `--cosponsors-col` | 5.5rem (88) | T3 | cosponsors column |
| `--chevron-col` | 1.5rem (24) | T3 | chevron column |
| `--table-gap-wide` / `--table-gap-medium` | 2rem (32) / 1.5rem (24) | T3 | column gaps |
| `--bar-height` / `--bar-max` | 0.4375rem (7) / 16rem (256) | T3 | the five-segment status bar |
| `--status-overhang` | `spacing-4` + `--bar-height` | T3 | the status step's overflow below the row |
| `--table-row-pad` | `--layout-stack` + overhang / 2 | T3 | row padding, symmetric around the overhang |
| `--finder-search` | 24rem (384) | T4 | search field width |
| `--pill-count` | 1.375rem (22) | T4 | topic pill count badge (min-width) |

The track tokens' sums set the `.bill-table` container breakpoints: wide ≥ 66.5rem, medium ≥ 38.5rem.

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
   - variant="article" adds a 1px ink 12% bottom border to the topbar, because a volt header next to mint is 1.0:1. (E6.7: no line on any page.)
   - variant="home" renders children below the nav row (for the statement in E4). (E6.7: removed; the topbar takes no children.)

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
   - (Removed in E6.7: no statement; Home's h1 is sr-only in <main>, and the topbar matches the article one. See A1.) Below the nav row, the statement: <h1> "See how Congress is handling AI policy." in type-display-h2, ink, at the tile padding.
   - It starts 53px below the nav row (top 173 in Figma). Use layout-tile-top-md minus the trim. Get the 173 optically and tell me which tokens you used.
   - Bottom padding: layout-stack (24).

2) BILL BAND: an amber Tile, about 519 tall at 1440. Data from bill-stats.json.
   - Header row, with the items aligned on their first baseline:
     * left: <h2> "AI bills in the 119th Congress" in type-display-h3 (display-h2 and top-aligned since E6.7);
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

STICKY SLIDE-OVER: a single stage (Joey's decision in E6.1; it replaced E4's two-stage cascade)
- Only the topbar gets covered: the AI bills band slides up over the topbar and statement (no statement since E6.7), then scrolls on.
- The layers:
  * the Topbar (home variant only): sticky, top 0, z-index 0;
  * the bill band: position relative, z-index 1, solid amber (not sticky);
  * the featured band and every later band: position relative, z-index 1, solid backgrounds. They scroll normally and never cover the bill band.
- The landmarks stay as they are (header outside <main>, the bill band inside <main>). No wrapper.
- Guards: sticky only within @media (min-width: 768px) and (min-height: 640px) and (prefers-reduced-motion: no-preference), and only if the topbar's height fits the viewport (the ResizeObserver hook). Without JavaScript, nothing is sticky.
- Focus is never hidden: :focus-within on the topbar raises it to z-index 3, so a focused nav link shows even while the bill band covers it.
- Article pages: the topbar is never sticky.

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

0) CARRY-OVER FROM E3 (do these first):
   - ONE MDX PIPELINE: posts and pages compile through the gray-matter + @mdx-js/mdx function in src/lib/posts.ts. Use that same function for the article body.
     * If nothing imports .mdx files directly, remove @next/mdx (package.json, and the createMDX wrapper in next.config.ts).
     * Keep mdx-components.tsx only if the compile function uses it.
     * Remove @mdx-js/react if nothing uses it.
     Report what you removed.
   - PROSE SPACING IN em, NOT space-* primitives: the article paragraph and heading gaps currently grow at 992 → 991 (21 → 24 and 28 → 32), because they use rem primitives while the body text holds at 18px.
     * In .prose-article, express the vertical rhythm in em relative to type-text-article: paragraph spacing 1.2em (24 at 20px), the gap above an h2 1.6em, list items 0.6em.
     * The spacing then tracks the text and never grows as the width shrinks.
     * Add the paragraph gap to tests/scaling.spec.ts.

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
   - It overlaps the header by 104px (the header gets that much extra bottom padding, and the image a negative top margin). The paper wrapper below the header must be a block formatting context (`flow-root`), or the negative margin collapses through it and the wrapper's paper background covers the overlap.
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

## E5.1: Home refinements (nav parity + bill band layout)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E5 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A and docs/eclipse-audit.md. This is a small refinement pass on the shell and Home, run after E5.
If the E5 handoff shows the nav parity work was already done (an earlier draft of E5 included it as step 0b), skip step 1, verify it still holds, and say so.

1) NAV PARITY WITH ECLIPSE (Joey's request, Oct 2). This applies to the Topbar nav on every page.
   - MEASURE FIRST: open https://web.archive.org/web/20240524202822/https://www.eclipse.xyz/ in Claude in Chrome. Read the computed styles of the header nav links at 1440, 1280 and 1024:
     * font size, line height, weight and letter spacing;
     * each link's vertical padding;
     * the line above each link (thickness, color and opacity);
     * the column count, column gap and row gap;
     * the ↗ icon size and position;
     * the hover and focus behavior.

     Compare them with docs/eclipse-audit.md (it records the nav at 18px with 10px vertical link padding, a 1px line above, a 2-column grid of link columns with a 40px gap, and 2 rows per column). Where the two disagree, trust the live measurement.
   - SPAN THE RIGHT HALF: the nav block runs from the 50% line (720 at 1440) to the right tile inset (1400 at 1440), so it occupies exactly the right column of the two-column grid. Its left edge lines up with the right column of the Home grid, the featured image's left edge, and the stats at 760 − 40.
     * The link columns divide that half equally.
     * Keep our five links and their order (Articles, Privacy Policy, Joey Holzman ↗ / Bill Tracker, Accessibility).
     * If Eclipse uses fewer columns than we need, keep three equal columns, and note it.
   - USE TOKENS, NOT NEW VALUES: switch the nav to whichever existing type and spacing tokens match Eclipse best (type-ui-nav is Eclipse's nav size; the link padding, gaps and line come from the existing space/layout tokens). Add a token only if nothing fits, and log every change in docs/token-log.md, marked "carry to Figma".
   - KEEP WHAT WORKS:
     * nav targets at least 24px tall;
     * aria-current on the current page;
     * the external ↗ plus "(external site)";
     * the logo on the left;
     * the nav dropping below the logo when it doesn't fit;
     * nothing growing as the window shrinks (add the nav width and link font size to tests/scaling.spec.ts);
     * the focus ring and the sticky focus-within behavior on Home.
   - Leave the footer nav as it is. Note in your report whether it should follow, for consistency.
   - VERIFY: side-by-side screenshots of the Eclipse header and ours at 1440 and 1024 in screens/e5/nav/. Measure the nav's left edge at 720 (1440) and at the 50% line at the other widths. Re-run tests/home.spec.ts and tests/shell.spec.ts, since the tab order and nav targets are covered there.

2) BILL BAND LAYOUT (Joey's redesign, Oct 2). Goals:
   - the "Open the bill tracker" row is the LAST thing the featured band covers on scroll;
   - the band is shorter, so more of the featured band shows on first load.

   New layout, top to bottom (the DOM order matches the visual order):
   - Header row, two columns on the half grid:
     * left: the <h2> "AI bills in the 119th Congress" (type-display-h3);
     * right: the ActionRow "Open the bill tracker" → /tracker, exactly as wide as TWO nav link columns plus the gap between them, aligned to the LAST two nav columns. Its left edge lines up with the left edge of the second nav column above it, and its right edge with the right tile inset (1400 at 1440). It has its top line and arrow, and aligns to the top of the header row.
     * Implementation: put the header row's right side on the same column template as the nav (reuse the nav's grid tokens, e.g. --nav-cols, over the same right-half span), and place the ActionRow across the last two columns. That way the edges line up at every width, including when the nav's column count or gap changes in step 1.
   - Stats row: the existing <dl>, still on the quarter lines (40 / 400 / 760 / 1120 at 1440), directly below the header row, with layout-tile-top-md between them. Number in type-display-h1, label in type-heading-h4, as now.
   - Source line: "Congress.gov, updated <date>" moves to the bottom left, below the stats (type-heading-h5, text-tile-muted), with layout-tile-top-md above it and the tile's normal bottom padding below.
   - Remove the old min-height header row and the bottom ActionRow.

   Keep the current copy and colors. The Figma mock still shows old placeholder labels and a navy "2"; ignore those.

   Below 768: the header stacks (heading, then a full-width action row), then the 2×2 stats, then the source line. Same DOM order, no visual reordering.

   Sticky: the band is still sticky at top 0, z 1 (two-stage cascade); the fit check now has an easier job. Confirm on scroll at 1440×900 that the featured band covers the source line and stats first, and the "Open the bill tracker" row last.

   Measure and report that the ActionRow's left and right edges match the second nav column's left edge and the third column's right edge at 1440, 1280 and 1024. Report the band's new height at 1440 (it was 517) and how much of the featured band shows on first load at 1440×900 and 1366×768.

3) VERIFY:
   - lint, build and the full test:e2e suite (update tests/home.spec.ts for the new order: the tab order is now nav → "Open the bill tracker" → featured → grid);
   - axe at 1440, 1024, 768 and 390;
   - tests/scaling.spec.ts passes;
   - an Eclipse parity check for the nav;
   - screenshots in screens/e5.1/: home-{1440,1366,1024,768,390}, plus cascade frames at 1440.

Tick E5.1 under Progress in CLAUDE.md and append the E5.1 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E6: Mobile first pass (≤767), plus tablet sanity checks

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E5.1 isn't ticked under Progress in CLAUDE.md, stop and tell me.
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
     * the statement follows, 32 below (removed in E6.7).
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
    - --measure also grows at the 991 jump (560 → 640, so the article text column and image widen as the window narrows; see the E5 handoff). Give it a ≤991 value of 35rem (560), so it holds.
    - The nav is now w-1/2 (E5.1). Check whether its width still grows at 991; if it does, hold it the same way.
    - Add all of them to tests/scaling.spec.ts.

3) TABLET SANITY (768–1279): the rail is inline (from E5), the measure centers, and the grid stays at two columns. Fix any overflow.

Verify:
- Screenshots of Home and of the navy and volt articles at 390, 768 and 1024, in screens/e6/.
- No horizontal scroll at 320 wide, or at 400% zoom of a 1280 window (WCAG 1.4.10).
- With text spacing overrides (line-height 1.5, paragraph spacing 2×, letter spacing 0.12em, word spacing 0.16em), nothing clips (WCAG 1.4.12).
- Every target is at least 24px.

- Eclipse parity (CLAUDE.md, section 6): compare with Claude in Chrome at the listed widths, retune tokens if something is clearly off, and log any changes to docs/token-log.md.

List anything that looked wrong but that you left alone because it's a design call. Stop and report. Tick E6 in CLAUDE.md, then append the E6 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

## E6.1: New buttons, single-stage scroll, nav focus order (Figma frame HomeNewWithNewButtons `2089:10`)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

Read docs/build-prompts.md Part A. If the Figma MCP server is available, screenshot node 2089:10 in file 9DKYbMDVJ43Kt1IDcf0XJS (HomeNewWithNewButtons) and its bill band 2089:138 as the visual target at 1440.

Ignore these things in that frame (they're out of date or placeholder):
- the nav position and widths (keep E5.1's right-half nav);
- "Accessability";
- the newsletter with no label (keep ours);
- the stat labels, "Bills Enacted" and the navy "2";
- the lowercase "congress".

1) BILL BAND (2089:138; 456 tall at 1440). It replaces E5.1's layout. DOM order = visual order: heading, source line, stats, button.
   - Header row: the <h2> on the left. The source line "Congress.gov, updated <date>" (type-heading-h5, text-tile-muted) moves back to the TOP RIGHT, right-aligned to the inset, aligned to the heading's first baseline. Remove the E5.1 ActionRow from the header row.
   - Stats: unchanged (the <dl> on the quarter lines), layout-tile-md below the header row.
   - "Explore the bill tracker" (sentence case, per our UI convention) → /tracker:
     * a solid INK block docked to the band's BOTTOM-RIGHT: it spans the right half exactly (from the 50% line to the viewport's right edge, full bleed, no inset) and sits flush on the band's bottom edge. The left half of that row stays amber.
     * It's a Tile mode="ink" with data-interactive, padding layout-tile-pad (40), so it's 112 tall at 1440. The whole block is one <a>: the label in type-heading-h4, paper, on the left, and Carbon ArrowRight (32, aria-hidden) on the right inset.
     * Hover and focus flip it to mint with ink text and arrow (the existing 300ms fade, 0 under reduced motion). The focus ring is inset like the other tiles.
     * Below 768: full width, after the stats, with an 8px amber strip under it (E6.2) so it never sits directly on the ink featured tile.
   - The stats → button gap comes from layout tokens; match Figma's 456 band height at 1440 as closely as the tokens allow, and report the difference.

2) SCROLL: SINGLE STAGE (Joey's decision; it replaces the two-stage cascade).
   - Only the topbar gets covered: the Home topbar stays sticky at top 0, z 0 (same guards: ≥768 wide, ≥640 tall, no reduced motion, fits the viewport, JS on).
   - The bill band is no longer sticky. It's position relative, z 1, with its solid amber background, so it slides up over the topbar. The featured band and everything after it scroll normally (relative, z 1, solid backgrounds) and never cover the bill band.
   - Keep focus-within:z-3 on the topbar, so a focused nav link is never hidden. Remove data-sticky and StickyFit from the bill band. Keep StickyFit if the topbar or the article rail still uses it.
   - Update tests/home.spec.ts:
     * remove the stage-2 cascade assertions ("ink covers the source and stats first, the tracker row last");
     * keep "the amber band covers the topbar" and the covered-nav focus test;
     * add "the featured band never overlaps the bill band".
   - Update Part A (A9) and the E4 sticky section in this file to describe the single stage.

3) TILE ARROWS replace the "Read more" rows (the Figma frame):
   - Featured tile: remove the decorative ActionRow. The dek and a Carbon ArrowRight (48, aria-hidden, currentColor) share the bottom row: the dek on the left, the arrow on the right inset, both bottom-aligned (Figma 2089:48: flex, justify-between, items-end).
   - Grid tiles (PostTile): remove the decorative ActionRow. A Carbon ArrowRight (48, aria-hidden, currentColor) is pinned to the bottom LEFT (mt-auto).
   - Joey chose these two different positions on purpose (Eclipse does the same). Keep them.
   - The title stays the only link (link-stretched). Hover and focus still flip the whole tile to mint, and the arrow follows via currentColor.
   - Keep the ActionRow component only if something still uses it (the article rail's "Track this bill"). Delete it if nothing does.

4) FOOTER MARK: the footer shows the mint quarter-circle mark (AIInCongressIcon, 321 × 334 at 1440) instead of the wordmark.
   - Make it a <Mark> component next to <Logo> in src/assets/brand/: the same SVG as src/app/icon.svg, with its fill replaced by currentColor. It's decorative (aria-hidden), since the footer's disclaimer names the site.
   - Its width is a token (--mark-footer: 321 at 1440) with a ≤991 value no larger than its 992 value. Use Figma's position (28, 30) only if it lands on tokens; otherwise use the tile inset (40) and say so.
   - Delete --logo-footer if nothing else uses it.

5) NAV FOCUS ORDER (WCAG 2.4.3): on mobile, "Joey Holzman ↗" shows last but is reached third with Tab (E6 used CSS order). Fix the DOM order in both Topbar and Footer: Articles, Privacy Policy, Bill Tracker, Accessibility, Joey Holzman ↗.
   - On desktop, put Joey Holzman ↗ back in column 3, row 1 with grid placement, so the desktop look doesn't change.
   - Remove the `order` rules.
   - Update the tab-order expectations in tests/home.spec.ts and tests/shell.spec.ts.

6) HOLD AT 991: --disclaimer (490 → 560), the topbar row's min-h-80 (70 → 80), --mark-footer and the new button's height. Give each a ≤991 value no larger than its 992 value, and add them all to tests/scaling.spec.ts.

VERIFY:
- lint, build and the full test:e2e suite;
- axe on / at 1440, 1024, 768 and 390, and on one article;
- the keyboard walk on Home: skip → logo → nav (new DOM order) → "Explore the bill tracker" → featured → grid → email → Submit → footer (new order). Every stop is visible and uncovered;
- hover and focus on the ink button flip it to mint;
- screenshots in screens/e6.1/: home-{1440,1366,1024,768,390}, scroll frames at 1440 showing the amber band over the topbar and the featured band NOT covering the amber band, and the footer at 1440 and 390;
- the Figma comparison against 2089:10.

Add "E6.1: new buttons, single-stage scroll, nav focus order, 991 holds" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.2: Article image overlap + amber divider under the tracker button on phones

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.1 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

If the Figma MCP server is available, screenshot node 2075:1532 in file 9DKYbMDVJ43Kt1IDcf0XJS (Article) as the visual target. In it, the image's top 104px sit ON the category-colored header: the header color shows on both sides of the image's top edge.

THE BUG: on /posts/[slug] the image looks like it starts exactly where the header ends. The rects say it overlaps by 104 (that's why E5's check passed), but nothing of the header shows beside it.
- Cause: in src/app/posts/[slug]/page.tsx, the image's `-mt-image-overlap` sits on a child of `<div data-tile="paper" className="pb-tile-lg">`. That wrapper has no top padding or border, so the negative margin collapses through it. The wrapper itself moves up 104px, and since it comes later in the DOM, its paper background paints over the bottom 104px of the header.
- Confirm it before you fix it: at 1440, the paper wrapper's getBoundingClientRect().top equals the image's top, not the header's bottom.

1) FIX (one class): add `flow-root` to that paper wrapper (`flow-root pb-tile-lg`). It becomes a block formatting context, so the margin no longer collapses: the wrapper starts at the header's bottom edge, and the image overflows 104px up over the header. Don't move the margin, add z-index, or restructure. The image's `relative` container already paints above the header's background.
   - Check that the figcaption, the editor-notes tile (`mt-article-gap`) and the body below don't shift. The gap from the image's bottom to the next block must be unchanged.
   - Check /privacy and /accessibility don't use the same pattern. If they do, report it; don't change them.

2) TEST: add to the article spec (tests/article.spec.ts, or wherever E5 put the overlap check):
   - "the header color shows beside the image's top edge": at 1440, 991 and 390, on one post per header mode (blush, navy, slate, volt, sand, sage), take `document.elementFromPoint(img.left - 8, img.top + 8)`. Its `closest('[data-tile]')` must be the header tile, not the paper wrapper.
   - Also check that the paper wrapper's top equals the header's bottom (±1).
   - Keep the existing overlap check: 104 at 1440, 91 at 991 and 56 at 390.

3) HOME, BELOW 768: AMBER DIVIDER BETWEEN THE TRACKER BUTTON AND THE FEATURED TILE (Joey's decision).
   - The bug: below md the ink "Explore the bill tracker" block sits flush on the band's bottom, directly on top of the ink featured tile. The two merge into one black block, and the button reads as the featured article's kicker.
   - The fix: below md only, the amber bill band gets a strip of its own color under the button. In src/app/page.tsx, change the band's `pb-0` to `pb-0 max-md:pb-8` (--spacing-8). It's the band's padding, not a border on the featured tile, so the divider belongs to the bill band and amber keeps meaning "bill tracker".
   - From md up, nothing changes: the button stays flush on the band's bottom (at md+ it sits over the featured image, not the ink text).
   - Test (tests/home.spec.ts): at 390, the featured band's top minus the button's bottom is 8 (±1), and `elementFromPoint` in that gap resolves to the amber band. At 768 and 1440, the gap is 0.
   - Update the E6.1 bill-band note in this file ("Below 768: full width, flush to the band's bottom") to say there's an 8px amber strip under it below 768.

VERIFY:
- lint, build and the full test:e2e suite;
- axe on two articles (one dark header, e.g. navy; one light, e.g. volt) at 1440 and 390;
- screenshots in screens/e6.2/: one article at 1440, 991, 768 and 390, cropped or scrolled so the header/image seam is visible; Home at 390 and 768 showing the button and the featured tile;
- the Figma comparison: the image straddles the header edge as it does in 2075:1532.

Add "E6.2: article image overlap, amber divider under the tracker button" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.3: Color remap (Figma HomeNewWithNewButtons `2089:10`, Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.2 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

If the Figma MCP server is available, screenshot node 2089:10 in file 9DKYbMDVJ43Kt1IDcf0XJS as the visual target. Ignore its placeholder copy, the photo, "Accessability", and the stat label wording.

Joey changed what the colors mean. The new mapping (it replaces CLAUDE.md section 4 "Color means destination" and Part A A2/A3):
- signal (orange) = the bill tracker;
- amber = the newsletter;
- navy = the Home featured tile (and still the Deepfakes article header);
- ink = the footer and the "Explore the bill tracker" button;
- mint = site chrome and the default hover.
No modes or tokens are added: this is which existing mode each block uses. No raw hex.

1) HOME BILL BAND: amber → PAPER.
   - The band is a paper Tile (still relative z-1 and sliding over the topbar). The source line keeps text-tile-muted.
   - "119th Congress" in the heading is signal text: wrap that part of the string in a <span className="text-signal">. Build the heading from stats.congress as now; no hardcoded copy.
   - The "Became law" NUMBER is signal text. Its LABEL stays ink (deviation from Figma: signal on paper is 3.47:1, which is only allowed for text ≥ 24px, and the heading-h4 label is 21px at 1280, 20 at 991 and 16 at 390). Add this to A1.
   - Rule for A2: signal is never text below 24px computed, at any width.

2) "EXPLORE THE BILL TRACKER" BUTTON: stays ink. Hover AND focus-within flip it to SIGNAL, with the label and arrow flipping to ink (ink on signal is 5.76:1; white on signal would fail at this size).
   - Use the existing mechanism: set --tile-hover-bg to the signal color on that one Tile (an arbitrary property class, or a data attribute rule in globals.css; pick whichever is one line). The shared hover rule already sets fg to ink and the 300ms fade (0 under reduced motion) applies.
   - Every other interactive tile still flips to mint.
   - The phone divider from E6.2 (pb-8 under the button below md) stays: it's now a paper strip, which still separates the ink button from the navy featured tile (ink vs navy is 1.12:1). Update the comment that says "amber strip".

3) HOME FEATURED TILE: ink → NAVY. Hover and focus still flip it to mint. The pill, date (muted 72% on navy is 9.6:1) and arrow follow tile-fg.

4) NEWSLETTER BAND: signal → AMBER, with ink text.
   - Remove the paper fg override and the "every text element ≥ 24px" comment (ink on amber is 10.8:1); keep the current type sizes so nothing visually shifts except color.
   - The input is white on amber, 1.85:1: its edge fails WCAG 1.4.11 (a component's boundary needs 3:1). Give the input a 1px solid ink border. Figma has none; add it to A1 so Joey carries it to Figma. The 2px focus outline is unchanged.
   - Never put a blue link on amber (3.28:1). Note that in A2.
   - Submit stays ink, hover mint.

5) TRACKER EVERYWHERE ELSE = SIGNAL:
   - The article rail cap "Bills in this article" (Rail.tsx): amber → signal (ink text, 5.76:1).
   - The /tracker stub's header Tile: amber → signal. Its type-text-large line is ink, so it passes at any size.

6) DOCS: update CLAUDE.md section 4 (the mapping above and "no muted text on Signal" stays), Part A A1 (replace the "'2' in navy" row with the label-stays-ink row; add the input border row), A2 (signal and amber roles, the 24px rule, no links on amber), A3 (signal's hover-bg note), and A9's single-stage note ("solid amber" → "solid paper"). Log nothing in token-log.md unless a token value changes.

TESTS:
- home.spec: at 1440, 991 and 390, every element whose computed color is signal has a computed font-size ≥ 24px.
- home.spec: hover the tracker button → its background computes to signal and the label to ink; same on keyboard focus. The featured tile still hovers to mint.
- home.spec: the band covers the topbar (existing test; update any amber color assertion to paper). The 390 gap under the button is still 8 and now resolves to the paper band.
- newsletter (wherever its test lives): the band is amber, the input has a 1px ink border.
- article spec: the rail cap is signal.

VERIFY:
- lint, build and the full test:e2e suite;
- axe on /, /tracker and one article at 1440 and 390;
- the keyboard walk on Home: the tracker button's focus state is signal and clearly visible;
- screenshots in screens/e6.3/: home-{1440,1024,768,390}, the tracker button hovered and focused at 1440, the newsletter band at 1440 and 390, one article's rail at 1440;
- the Figma comparison against 2089:10; list the two deliberate deviations (ink "Became law" label, input border).

Add "E6.3: color remap (tracker = signal, newsletter = amber, featured = navy)" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.4: Smaller display headings (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.3 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY: at Figma's 1440 proportions (what laptops and a 1220 window show), the display headings read too big. On Joey's 2560 monitor the 1920 root cap shrinks them about 25% and that's the look he wants. Fix the type scale, not the scaling: the fluid root, its breakpoints and the 1920 cap stay exactly as they are. Body text, heading-h4/h5 and every text-* style are unchanged.

1) In src/app/globals.css, change only these three utilities (values are Figma px at 1440; rem = px / 16):

   | Style | Now (1440) | New (1440) | ≤991 | ≤767 |
   |---|---|---|---|---|
   | type-display-h1 | 90/90 (5.625rem) | 72/72 (4.5rem) | 60 (unchanged) | 40 (unchanged) |
   | type-display-h2 | 66/66 (4.125rem) | 52/52 (3.25rem) | 40 (unchanged) | 34 (unchanged) |
   | type-display-h3 | 38/42 (2.375rem) | 32/36 (2rem, line-height 36/32) | 32/36 → 28/32 (1.75rem) | 24 (unchanged) |

   - Letter spacing stays in em (unchanged), line heights stay unitless.
   - Why h3 changes at ≤991: at 992 the root is 14, so the new h3 computes to 28. The ≤991 value must not be larger, or the no-growth test fails.
   - Expected at 1220 (root 14): h1 63, h2 45.5, h3 28.
2) Check what was tuned to the old sizes. Re-measure at 1440 and report before → after:
   - the topbar height and the statement offset (--statement-top is computed from type, so it should follow by itself);
   - the Home bill band height (Figma 456), the featured band (--band-featured, a min-height of 807), the grid tiles (--post-tile, a min-height of 354);
   - the article header height.
   Don't change the min-height tokens. Report the new empty space so Joey can decide in Figma.
3) Constraints to re-check:
   - signal text ≥ 24px at every width (the "119th Congress" span is display-h3: 28 at 1280, 24 at 390);
   - the scaling test (no growth as the width shrinks) passes;
   - nothing wraps worse: the longest real post title in the featured tile and on an article header at 1440, 1024 and 390.
4) DOCS: update Part A A5 (the type table and the ≤991 h3 value), the /styleguide page if it hard-codes sizes, and docs/token-log.md with one "carry to Figma" line per style: Display/H1 90/90 → 72/72, Display/H2 66/66 → 52/52, Display/H3 38/42 → 32/36. Note there that this is a taste decision, not Eclipse parity (Eclipse's comparable heading is 66 at 1440).

TESTS: update the expected values in tests/scaling.spec.ts. Add an assertion at 1440 that display-h1/h2/h3 compute to 72/52/32, and at 1220 to 63/45.5/28.

VERIFY:
- lint, build and the full test:e2e suite;
- axe on / and one article at 1440 and 390;
- screenshots in screens/e6.4/: home and one article at 2560, 1440, 1220, 1024 and 390;
- the before → after measurements from step 2 in the handoff entry.

Add "E6.4: smaller display headings (72/52/32 at 1440)" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.5: The featured band is never taller than the viewport (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.4 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

E6.4 measured the featured band at 807 (its min-height) with about 400px of empty navy between the title and the dek row at 1440. This prompt fixes the height; nothing else changes.

   - The bug: the featured band's height is only its min-height token (--band-featured: 807 at 1440, which scales with the root to 706 at 1220 and 1109 from 1920). Its content needs about 380 at 1220. The tile is justify-between, so on common windows (1440×790, 1536×730, 1920×950) the title is at the top of the screen and the dek and arrow are below the fold, separated by empty navy.
   - The fix: cap the token at the small viewport height, both values: --band-featured: min(50.4375rem, 100svh) and, at ≤991, min(44rem, 100svh). It stays a MIN-height, so long titles, 400% zoom and text-spacing overrides still grow the band (no clipping). Below md it doesn't apply.
   - The image cell is fill + object-cover, so it follows the row height; check the crop still looks intentional at 1440×790.
   - Test (home.spec): at 1440×790, 1536×730, 1920×950 and 2560×1305, the featured band's height ≤ innerHeight (+1), and its title, dek and arrow are all inside one viewport when the band's top is scrolled to the top of the window. At 2560×1305 the height is still 1109 (unchanged: it fits).
   - Log it in token-log.md as "carry to Figma: the featured band is at most one screen tall".

VERIFY:
- lint, build and the full test:e2e suite; axe on / at 1440 and 390;
- screenshots in screens/e6.5/: home scrolled so the featured band's top is at the window top, at 1440×790, 1536×730, 1920×950 and 2560×1305;
- report the band height and the title-to-dek gap at each of those sizes.

Add "E6.5: featured band ≤ viewport" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.6: Smaller heading-h5 (nav links and everything that shares them) + signal tracker button (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.5 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY: E6.4 shrank the display headings; the nav links now read too big beside them. The nav uses type-heading-h5, and by Joey's rule (E5.1) every nav-style label shares it, so the token changes, not the nav.

1) In src/app/globals.css, change only type-heading-h5:

   | | Now | New |
   |---|---|---|
   | 1440 | 20/28 (1.25rem) | 18/25.2 (1.125rem; line height stays 1.4) |
   | ≤991 | 16 (1rem) | 15 (0.9375rem) |
   | ≤767 | 14 | 14 (unchanged) |

   - Expected: 18 at 1440, 15.75 at 1220, 24.75 at 2560 (root cap 22), 15 at ≤991, 14 at ≤767.
   - Why 15 at ≤991: at 992 the root is 14, so 18 computes to 15.75; the ≤991 value must not be larger (no-growth test). 15 also equals type-ui-nav's ≤991 value.
   - 18 is Eclipse's own nav size at 1440 (E5.1 measured it), so this is a cut of 10%, not E6.4's 20%: h5 is UI text, and at 16 it would equal body text and drop pills and dates to 14 at laptop widths.
   - Weight, tracking and font are unchanged.
2) Everything that uses type-heading-h5 shrinks with it. Check each at 1440 and 390 and list it in the report: Topbar nav, Footer nav, ActionRow labels, Pill, PostMeta, the Home source line, the article editor-note labels, the skip link (layout.tsx), and the accessibility and privacy pages.
3) Re-check:
   - nav and footer links stay ≥ 24px tall (WCAG 2.5.8): line box + pt-stack-sm;
   - pills keep their height and padding from layout tokens, and their text stays vertically centred;
   - the topbar row (--topbar-row, 80) still holds the logo and two nav rows; report the topbar height before → after;
   - "Joey Holzman ↗" wrapping between 768 and ~900 (an open E6.2 item): report whether it improves;
   - the scaling test passes.
4) DOCS: Part A A5 (heading-h5 row) and docs/token-log.md, one "carry to Figma" line: Heading/H5 20/28 → 18/25.2 (Tablet 16 → 15), a taste decision that also matches Eclipse's nav at 1440.

5) "EXPLORE THE BILL TRACKER" BUTTON: signal at rest, ink on hover (Joey's decision; replaces E6.3's ink → signal).
   - At rest: mode="signal" (signal bg, INK label and arrow: 5.76:1). Joey asked for paper text; it fails: paper on signal is 3.47:1, which only passes for text ≥ 24px, and the heading-h4 label is 21 at 1280, 20 at ≤991 and 16 at 390 (CLAUDE.md: no small white text on signal). Don't use paper.
   - Hover AND focus-within: ink bg, PAPER label and arrow (19.8:1), the shared 300ms fade (0 under reduced motion).
   - The shared hover rule hard-codes fg to ink. Add one variable: in [data-tile][data-interactive]:is(:hover,:focus-within) use --tile-fg: var(--tile-hover-fg, var(--color-ink)) (and the muted/line mixes from the same value), then set [--tile-hover-bg:var(--color-ink)] [--tile-hover-fg:var(--color-paper)] on this one Tile. Every other tile is unchanged (the fallback is ink).
   - The focus ring reads --tile-fg, so on focus it's paper on ink: check it's visible (2px, inset as now).
   - Phones: the paper strip under the button (pb-8) stays. At rest signal vs navy is distinct (5.15:1), but the focused/pressed state is ink next to the navy featured tile (1.12:1).
   - Update the E6.3 tests: at rest bg signal + label ink; hover and keyboard focus bg ink + label paper. Update CLAUDE.md §4 and Part A A3 (the tracker button: signal → ink on hover) and note it in token-log.md as "carry to Figma".

TESTS: tests/scaling.spec.ts asserts heading-h5 computes to 18 at 1440, 15.75 at 1220 and 15 at 991. home.spec covers step 5.

VERIFY:
- lint, build and the full test:e2e suite; axe on / and one article at 1440 and 390;
- the keyboard walk on Home (every nav stop visible, uncovered);
- screenshots in screens/e6.6/: the topbar and footer at 2560, 1440, 1220, 1024 and 390; one article header at 1440; the tracker button at rest, hovered and focused at 1440, and at rest at 390.

Add "E6.6: heading-h5 18/25.2 (nav links), signal tracker button" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.7: Drop the Home statement; the bill band heading takes the large type (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.6 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY (Joey's decision): the visible statement "See how Congress is handling AI policy." costs a full row of vertical space on every first render and says what the page already shows. Removing it also makes the mint topbar read as plain site chrome: logo + nav, identical on every page.

1) REMOVE THE VISIBLE STATEMENT. In src/app/page.tsx delete the <h1> passed into <Topbar variant="home">.
   - Home still needs exactly one h1 (CLAUDE.md §5). Make it visually hidden: <h1 className="sr-only">AI in Congress</h1>, as the first child of <main>. Take the text from the same place layout.tsx's metadata title uses; if it's a string literal there, export one SITE_NAME constant from src/lib/site.ts and use it in both (no duplicated copy).
   - Why hidden and not the band heading: the band heading names one section, not the page. The bill band heading stays an <h2>; heading level and visual size are independent.
2) TOPBAR: identical on every page. Delete the children slot and its comment (nothing else passes children). Home and article topbars get the same padding and the same bottom line (border-b border-tile-line). `variant` stays only to switch data-sticky on Home. If the article variant then has no other difference, keep the prop name as is (no rename).
   - Delete --statement-top from globals.css if nothing else uses it.
3) BILL BAND HEADING: type-display-h3 → type-display-h2 (52 at 1440, 45.5 at 1220, 40 at ≤991, 34 at ≤767). Keep the signal span on "{congress} Congress" (≥ 24px at every width, so the signal rule still holds; the test from E6.3 covers it).
   - The source line stays top-right on the heading's first baseline (md:items-baseline); at narrow desktop widths it may wrap below the heading: that's fine, check it doesn't collide.
   - Trim the heading's top (text-box trim-start cap alphabetic, as the statement had) so its cap top sits on the tile's top padding.
   - Labels stay ink under the signal "Became law" number (A1); ignore the signal label in Joey's screenshot.
4) Re-measure at 1440, 1220, 1024 and 390 and report before → after: topbar height, bill band height, the y of the featured band's top (how much moved up into the first screen).
5) TESTS: update anything that targeted the statement (home h1 text, the statement's offset/trim tests, keyboard walk). Add: Home has exactly one h1, it's visually hidden and reads "AI in Congress"; the topbar's height on / equals its height on an article (±1) at 1440 and 390.
6) DOCS: Part A (A1: the statement is removed on purpose; the Home h1 is sr-only), the E4 section's statement notes, CLAUDE.md if it mentions the statement. token-log.md: "carry to Figma: no statement row; the bill heading is Display/H2".

VERIFY:
- lint, build and the full test:e2e suite; axe on / at 1440 and 390;
- the keyboard walk on Home (skip link → logo → nav → tracker button → …), every stop visible;
- screenshots in screens/e6.7/: home at 2560, 1440, 1220, 1024, 768 and 390 (first screen, not full page), and one article topbar at 1440 for comparison.

Add "E6.7: no Home statement, bill heading display-h2" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.8: White text on signal, never below 24px (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.7 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY: ink on signal passes WCAG 2.2 AA by the numbers (5.76:1) but reads poorly: its APCA contrast is only Lc 43, because WCAG 2's formula overrates dark text on saturated orange. Paper on signal is the reverse: 3.47:1 under WCAG 2 (large text only) but Lc 66 under APCA, i.e. it reads clearly. So signal tiles switch to PAPER text, and every piece of text on signal must be ≥ 24px computed at every width (WCAG large text = 18pt = 24px), which passes both models. CLAUDE.md §5 ("no small white text on signal") stays true.

1) In globals.css, [data-tile="signal"]: --tile-fg → var(--color-paper) (muted stays = fg; line stays 20% of fg).
2) Add ONE utility for labels that must stay large: type-heading-h4-24, identical to type-heading-h4 but with font-size max(<its size>, 24px) at every breakpoint (the same max() pattern as type-ui-label's 13px floor). Computed: 24 at 1440/1280/991/390, 33 at 2560. Line height keeps h4's ratio. It never grows as the width shrinks (constant 24 from 1440 down), so the scaling test holds; add it to the test table.
3) Apply it:
   - Home "Explore the bill tracker" button: label → type-heading-h4-24. At rest: signal with paper label and arrow (E6.6's ink → paper text is now just the mode's default). Hover and focus-within: ink with paper (unchanged from E6.6). The focus ring is paper on ink.
   - Rail cap "Bills in this article": heading → type-heading-h4-24, paper on signal.
   - /tracker stub header: the h1 (display-h2) is fine; the sentence (type-text-large, 18 on phones) → type-display-h3 (24 on phones). Keep it one sentence.
4) TESTS: widen E6.3's "signal text is never under 24px" to also cover every text node INSIDE [data-tile="signal"] (computed font-size ≥ 24 at 1440, 1280, 991 and 390) on /, /tracker and one article. Update the button tests: at rest bg signal + label paper; hover/focus bg ink + label paper. axe must stay at 0 (it counts 24px as large text, so 3.47:1 passes).
5) DOCS: CLAUDE.md §4/§5 (signal tiles: paper text, ≥ 24px only), Part A A2/A3 (the signal mode row: fg paper; the 24px rule; why: one line on WCAG 2 vs APCA), token-log.md "carry to Figma: text on signal is paper and ≥ 24px; Heading/H4 has a 24px floor on signal".

VERIFY:
- lint, build and the full test:e2e suite; axe on /, /tracker and one article at 1440, 1280 and 390;
- screenshots in screens/e6.8/: the tracker button at rest, hovered and focused at 1440 and at rest at 1280 and 390; the rail cap at 1440 and 390; /tracker at 1440 and 390.

Add "E6.8: paper text on signal, ≥ 24px" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.9: Article topbar takes the category header color (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.8 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY (Joey's decision): on article pages, the mint topbar above a colored header reads as two unrelated blocks. The topbar takes the header's color so the top of an article is one colored field.

1) Topbar gets an optional `mode` prop (TileMode, default "mint"). src/app/posts/[slug]/page.tsx passes CATEGORIES[post.category].headerMode. Home, /tracker, /privacy and /accessibility keep mint (no change at their call sites).
2) The logo and nav already follow the tile: <Logo> paints with currentColor and the links use text-tile / border-tile-fg, so dark modes (navy, slate) give a paper logo and paper links with no new asset. Do NOT add AIinCongressLogoWhite.svg or any second logo file (one Logo, recolored by the mode). If you find a hard-coded ink anywhere in the topbar, replace it with the tile variable.
3) A hairline between the topbar and the header: border-b border-tile-line on the article topbar (the mode's fg at 12% or 20%). It's decorative (no contrast requirement); its job is to keep the nav reading as navigation inside one colored field.
4) Contrast, measured (nav text is heading-h5, so it needs 4.5:1): blush 13.7, navy 17.9, slate 5.2, volt 17.3, sand 13.7, sage 6.5. All pass. The focus ring reads --tile-fg, so it's paper on navy/slate and ink on the rest: check it's visible on all six.
5) TESTS (article.spec): for one post per header mode (blush, navy, slate, volt, sand, sage): the topbar's computed background equals the header's; the logo's computed color and every nav link's color equal the tile fg; axe 0. Home's topbar is still mint.
6) DOCS: CLAUDE.md §4 ("mint is site chrome" → "mint is site chrome, except on article pages, where the topbar takes the category header color"), Part A A4 (the topbar row) and token-log.md "carry to Figma: the Article topbar uses the header's color, with a hairline in the fg at 12%/20%".

VERIFY:
- lint, build and the full test:e2e suite; axe on all six articles at 1440 and 390;
- the keyboard walk on one dark (navy) and one light (volt) article: every nav stop's ring is visible;
- screenshots in screens/e6.9/: the top of one article per header mode at 1440, and navy + volt at 390.

Add "E6.9: article topbar in the header color" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.10: Fluid root above 1440 tuned for large monitors (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.9 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY (Joey's decision, measured): Joey's two monitors are both 27". On the 2560×1440 one at 100% the site looks right (root 22). On the 1920×1080 one it only looks right at 75% browser zoom, which renders a 2560-wide layout (root 22) at 0.75 → 16.5 device px. Both are the same physical size (22 × 0.233mm ≈ 16.5 × 0.311mm ≈ 5.1mm). So above 1440 the root should follow 22/2560 = 0.859375vw instead of Eclipse's steeper 1.25vw slope, and never drop below 16. Nothing at or below 1440 changes (the Figma frame stays exact).

1) In globals.css, the fluid root (A6). Keep the base rule and the ≤1280 and ≤991 rules exactly as they are. Replace the (min-width: 1920px) rule with:
   @media (min-width: 1440px) { html { font-size: max(1rem, 0.859375vw); } }
   @media (min-width: 2560px) { html { font-size: 1.375rem; } }
   Expected roots: 1440 → 16 · 1600 → 16 · 1862 → 16 · 1920 → 16.5 · 2048 → 17.6 · 2560 → 22 · 3440 → 22.
   - It's continuous at 1440 (16 both sides) and at 2560 (22 both sides), and never decreases as the width grows, so the no-growth test holds.
   - max(1rem, …) lets a larger browser default font size win (WCAG 1.4.4), like the base rule's floor.
   - WCAG 1.4.4 under zoom: the largest root (22) is 1.57× the smallest (14), under the 2.5× limit, so text still reaches 200% within 500% zoom.
2) Everything is rem, so type, spacing and layout follow. Re-check only:
   - the featured band (min(…, 100svh)) and grid tiles at 1920×950;
   - the sticky topbar and article rail fit checks at 1920×950 (they get shorter, so they may start sticking where they didn't);
   - nothing that was tuned at 1920 by eye (grep for 1920 in src/, tests/, docs/).
3) TESTS (tests/scaling.spec.ts): add 1600, 1862, 1920, 2048, 2560 and 3440 to the widths; assert the roots above; update any expectation that assumed 22 at 1920 (E6.4's 99/71.5/44 "at 1920+" becomes "at 2560+"; at 1920, display h1/h2/h3 compute to 74.25/53.6/33). Add the zoom check: for base widths 1920 and 2560, some zoom z in {2,3,4,5} (viewport width/z, deviceScaleFactor z) gives root × z ≥ 2 × the 100% root.
4) DOCS: Part A A6 (the CSS block, one line on why: same physical size on a 27" 1080p and 1440p monitor), CLAUDE.md §6 if it quotes the 1920 cap, and token-log.md: "root above 1440: Eclipse's 1.25vw → 0.859375vw, cap moved 1920 → 2560 (taste, measured on Joey's 27" monitors), not parity".

VERIFY:
- lint, build and the full test:e2e suite; axe on / and one article at 1920 and 2560;
- screenshots in screens/e6.10/: home and one article at 1440×790, 1920×950 and 2560×1305 (first screen), plus 1920 before/after side by side.

Add "E6.10: root above 1440 = max(1rem, 0.859vw), cap at 2560" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## E6.11: Scalable icon sizes (Oct 3)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If E6.10 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/ and content/ so you know what already exists. Reuse existing components and tokens; never recreate them.

WHY: icons use raw spacing primitives (size-24, size-32, size-48). They scale with the root, but (a) they ignore the text they sit beside, so when E6.4/E6.6 shrank the type the arrows stayed big (a 24 ↗ next to 14px nav text on phones), and (b) they grow at the 991 root jump (21 → 24, 28 → 32, 42 → 48), the long-open "icon-size hold" item. Eclipse sizes arrows from their text (30 next to a 24 h4 = 1.25em; 66 next to a 66 h2) and steps them down at 991. Two roles, two tokens:

1) TOKENS (globals.css, in the layout-token block, aliased as --spacing-* so `size-icon-*` utilities exist):
   - --icon-inline: 1.25em. For an icon that sits beside a label: it's 1.25× the label's font size, so it follows every type change, breakpoint and floor automatically (nav 18 → 22.5; phones 14 → 17.5; the tracker label 24 → 30, Eclipse's exact ratio).
   - --icon-tile: 3rem (48 at 1440), ≤991 2.5rem (40), ≤767 2rem (32). For the standalone tile arrows (featured and grid). At 992 it's 42, so 40 at 991 holds the no-growth rule; 40/32 are close to Eclipse's 38/32.
2) APPLY (every Carbon icon in src/, styleguide included):
   - Inline → size-icon-inline: Topbar ↗, Footer ↗, "All articles" ←, the "Explore the bill tracker" →, article source ↗. The icon must inherit the label's font size: if it's a sibling of the label (e.g. the tracker button, where the arrow sits next to the <Link>), move the label's type utility to their shared parent so 1em means the label. No visual change to the label itself.
   - Tile → size-icon-tile: the featured arrow and the PostTile arrow.
   - Pass the same size={32} to every Carbon icon, so one glyph variant renders everywhere (check in node_modules whether ArrowRight/ArrowLeft/ArrowUpRight ship separate 16/20 glyphs; if they do, 32 is still the one to scale). CSS sets the rendered size.
   - Delete the now-unused raw size-24/32/48 on icons. Keep shrink-0.
3) Re-check: link targets stay ≥ 24px tall (the icon is aria-hidden; the target is the link); the ↗ in the nav no longer forces "Joey Holzman ↗" to wrap between 768 and 1024 (report whether that open item is now fixed); the featured row's dek + arrow still bottom-align at 390.
4) TESTS (scaling.spec): every icon's computed size never grows as the width shrinks (add icons to the table); at 1440, 991 and 390 each inline icon is 1.25× its label's computed font-size (±0.5), and the tile arrows are 48/40/32 (and 42 at 1280).
5) DOCS: Part A A8 (the table: role, token, sizes; why em), CLAUDE.md §4 ("icons size from --icon-inline / --icon-tile only"), token-log.md "carry to Figma: inline icons = 1.25 × label size; tile arrows 48 / 40 tablet / 32 mobile".

VERIFY:
- lint, build and the full test:e2e suite; axe on / and one article at 1440 and 390;
- screenshots in screens/e6.11/: topbar, footer, the tracker button, the featured tile and one grid tile at 1440, 991 and 390; one article's back link and sources at 1440 and 390.

Add "E6.11: icon sizes from --icon-inline (1.25em) and --icon-tile" under Progress in CLAUDE.md, tick it, and append the handoff entry.
```

## T-series: the bill tracker (Nov 8)

**What it is.** Seven prompts that build `/tracker` from the Congress.gov API. The design and data spec is `docs/tracker-spec.md`, and every T prompt reads it. They run after E6.11 and before E7.

**How to run them.**
- `scripts/run-prompts.ps1` runs each prompt as its own `claude -p` session, so every session starts clean.
- After each one it checks the Progress tick and pauses so you can review and commit.
- After T2 it runs the full data backfill itself (about an hour).

**Before T1:**
1. Get a key at https://api.congress.gov/sign-up/.
2. In PowerShell, from the repo root, run: `Add-Content .env.local "CONGRESS_API_KEY=<your key>"`.

**The prompts:**
1. **T1:** verify the API live; the client; key handling.
2. **T2:** the fetch pipeline, the data files, the stage logic and its tests.
3. **T3:** the page shell and the bill table (columns, text limits, the three layouts).
4. **T4:** the finder controls, pagination and the empty state.
5. **T5:** the expanded rows (the chevron).
6. **T6:** wiring to Home and the rail, the methodology section, the docs.
7. **T7** (optional): a daily refresh with a GitHub Action.

## T1: Congress.gov API: verify it live, the client, key handling (Nov 8)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md: the latest three entries (step 0 below makes that the rule; follow this prompt over the current §0 wording). If E6.11 isn't ticked under Progress in CLAUDE.md, stop and tell me.
3) Run git status and list src/, content/ and scripts/ (if it exists) so you know what already exists. Reuse existing components and tokens; never recreate them.
4) Read docs/tracker-spec.md §1–3 (the data half). It's the source of truth for the tracker.

WHY: the tracker reads the Congress.gov API v3. Spec §2 marks what's verified (✅) and what's only believed (⚠). Nothing gets built on a ⚠, so this session checks each one against live responses and writes the shared client. It doesn't build the pipeline or any UI.

0) SESSION START (CLAUDE.md §0, step 2): change "Read `docs/progress.md`." to "Read `docs/progress.md`: the latest three entries, plus every entry of the series you're in (E or T). Older entries are history; search them when something refers to them." It's 850+ lines, and reading it whole every session wastes the budget. Make the same change in §0's table row if it says otherwise.
1) KEY: CONGRESS_API_KEY is in .env.local (gitignored). Never open, print, echo or log .env.local or the key, and never put the key in a URL you log. Scripts load it with process.loadEnvFile(".env.local") inside try/catch, then read process.env.CONGRESS_API_KEY. If it's missing, stop and tell me how to add it (spec §2.1).
2) CLIENT: scripts/tracker/congress.mjs, exactly per spec §2.3: get(path, params), paginate(path, params, itemsKey), the 750 ms spacing, retries, the disk cache in .cache/congress/, and a request counter. No dependencies. Add .cache/ and .claude-runs/ to .gitignore.
3) PROBE: scripts/tracker/probe.mjs runs spec §2.4 items 1–11 and prints a compact report (field names, counts, the first 60 characters of text; never full payloads). Save the raw responses that the stage tests will need as fixtures in scripts/tracker/fixtures/: actions for s146 and hr1283, plus the s146 detail. Check that they contain no key. For item 11, check one roll-call page with WebFetch.
4) Update docs/tracker-spec.md in place:
   - turn every ⚠ in §2 into ✅, or into ❌ with what's actually true;
   - replace the §3.3 table's codes with what the API returned (keep the stage rules; change only the codes and fallbacks);
   - fill in the backfill estimate in §3.2 step 9 from item 10.
   If a ❌ breaks the design (for example, /bill ignores fromDateTime), put it first in your report with the smallest fix. Don't redesign.
5) npm script: "tracker:probe": "node scripts/tracker/probe.mjs".

VERIFY:
- lint passes;
- run the probe twice: the second run is mostly cache hits (report both request counts);
- the probe output, the fixtures and the git status show no key and no .cache files;
- git status lists only the files you meant to touch.

Add "T1: Congress.gov API verified, client, probe" under Progress in CLAUDE.md (above E7), tick it, and append the handoff entry. In the entry's "Open for next prompt", list every ❌ and how you resolved it.
```

## T2: Fetch pipeline, data files, stage logic (Nov 8)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T1 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/, content/ and scripts/tracker/. Reuse scripts/tracker/congress.mjs; don't rewrite it.
4) Read docs/tracker-spec.md §1–3 in full. T1 has updated it with what's verified.

WHY: the site never calls the API. A script fetches the data, normalizes it and writes JSON into content/. The build validates that JSON with zod and renders it statically. That keeps builds deterministic, keeps the key out of the build, and makes "as of" honest.

1) CONFIG: content/tracker/config.json exactly as spec §3.1. Add "_note": "TODO(joey): review the patterns, topics and watchlist."
2) STAGE: scripts/tracker/stage.mjs exports stageOf(detail, actions) → { stage, stageLabel } and milestonesOf(actions) per spec §3.3. Use the codes T1 verified. Add vitest tests in scripts/tracker/stage.test.mjs on the T1 fixtures (s146 is stage 5, "Became law"; hr1283 is stage 1), plus small synthetic action arrays for stages 2, 3 (House and Senate), 4 and Vetoed. Include scripts/ in vitest.config.mts if it isn't already, and keep test:content passing.
3) FETCH: scripts/tracker/fetch.mjs per spec §3.2 steps 1–8: sweep window, list and summary sweeps, candidates, cached sub-endpoint fetches, classify, normalize to the §3.4 shape (summary HTML to plain paragraphs, sponsor name as "Sen. Ted Cruz" from first and last name, cosponsor party counts without withdrawn ones, the latest text version), then write everything at the end. Support the --full, --only and --dry-run flags. Print a summary at the end: requests, included, review, the change against the last run, and time taken. Keep the files small; split by job (sweep, classify, normalize) only when one file passes about 150 lines.
4) LOADER: src/lib/tracker.ts parses content/tracker/bills.json and meta.json with zod (shape as spec §3.4; ISO dates via the existing isoDate) and exports getTrackerBills(), getTrackerMeta() and getTrackerBill(id). Bad data fails the build.
5) STATS: the fetch script regenerates content/bill-stats.json per §3.5 with placeholder: false, keeping the schema src/lib/bills.ts expects. Leave the "placeholder" warning code in bills.ts; it just stops firing.
6) CSV: public/data/ai-bills-119.csv per §3.2 step 6, RFC 4180 quoting, UTF-8 with no BOM.
7) npm scripts: "tracker:fetch": "node scripts/tracker/fetch.mjs" and "tracker:backfill": "node scripts/tracker/fetch.mjs --full". The second exists because PowerShell can drop `--` from `npm run x -- --full`.
8) RUN IT SMALL, not the full backfill (that takes about an hour, and the runner script does it after this session): `npm run tracker:fetch -- --only s146-119,hr2794-119,hr1283-119,hr1121-119` to check the output, then a normal run limited to the watchlist so content/tracker/bills.json and meta.json exist and the build works. Add a --watchlist-only flag if you need one. Report the request counts and the estimate for the full run.

VERIFY:
- lint, build, test:content (including the stage tests) all pass;
- content/tracker/bills.json validates and holds the 4 watchlist bills with correct stages: compare each against its Congress.gov page with WebFetch and report a table of bill, our stage, Congress.gov's status, and match;
- the CSV opens with the right columns;
- a --dry-run right after a real run reports no changes;
- no key appears anywhere in git status, the content files or the logs.

Add "T2: tracker fetch pipeline, data files, stage logic" under Progress (above E7), tick it, and append the handoff entry. Under Open, list the full-backfill command and anything in the data that looked wrong.
```

## T3: The tracker page and the bill table (Nov 8)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T2 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/ and content/tracker/. Check content/tracker/meta.json: if the included count is 4 or fewer, the full backfill hasn't run. Say so in your report and carry on with what's there.
4) Read docs/tracker-spec.md §1, §4.1, §4.2, §4.4, §4.7, §4.8 and §5. Read Part A A3, A5, A6, A7 and A9 for the tokens, the fluid root and the accessibility rules.
5) If the Figma MCP is connected, screenshot BillFinder 2209:2 (file 9DKYbMDVJ43Kt1IDcf0XJS) for reference. Its spacing is bound to the token variables. Don't call get_design_context; the spec holds the values.

WHY: /tracker is a stub. This session builds the page shell and the table, the part that has to hold short labels next to 200-character titles without folding badly. The filters, pagination and empty state are T4. The expanded rows are T5.

1) COPY: content/tracker/page.json with spec §4.7's suggested copy (plus the pagination strings in §4.4b, for T4) and "_note": "TODO(joey): approve this copy." Load it with zod in src/lib/tracker.ts.
2) TOKENS: add the §4.4 tracks to globals.css as layout tokens (bill, status wide and medium, cosponsors, chevron, title min, action min, the wide and medium gaps, the 7/16rem bar height, --status-overhang and --table-row-pad). Write the two @container breakpoints as numbers, with a comment that shows each one as the sum of those tokens. Log every token in docs/token-log.md with "carry to Figma" where it applies.
3) PAGE: rewrite src/app/tracker/page.tsx (keep the metadata and robots): the Topbar, a paper Tile, the header (§4.2), the "Bill finder" h2, and the table. Leave a clearly marked slot where T4's controls go.
4) TABLE: BillTable.tsx (the .bill-table container: the column header plus the <ol>) and BillRow.tsx, colocated in src/app/tracker/, exactly per §4.4: the cell styles and rules table, the spacing, the three container-query layouts and the semantics. Each row is a <details>/<summary> with an empty panel slot that T5 fills. Every bill renders, in the default sort (latest action, newest first). Reuse the type utilities and text-tile-muted; no new grays. Add ChevronDown to CLAUDE.md §3's icon list.
5) TESTS: tests/tracker.spec.ts (Playwright, at every configured viewport, plus 320 and 2560 where the helpers allow):
   - the layout is wide at 1440, 1280 and 1024, medium at 991 and 768, and stacked at 390 and 320 (assert from computed grid-template-columns or a data-layout hook);
   - text limits: in every visible row,
     * the bill label, chamber, status label, step, date and cosponsor count are each a single line;
     * the title's rendered width is between 24ch and 60ch of its own font (measure ch with a hidden "0" in the same font);
     * in the wide layout, the latest action is between 20ch and 48ch;
     * nothing overflows its cell (scrollWidth ≤ clientWidth);
     * rows are symmetric: in a row whose title fits on one line, the gap from the row's top edge to the top of the bill cell equals the gap from the bottom of the bill cell to the row's bottom rule (±1px). The status cell's step overhangs per §4.4 and sits at least 8px above the rule, in the wide and medium layouts at every viewport;
   - the summary toggles with Enter and Space, and its focus ring is 2px or more;
   - axe reports 0 violations;
   - no horizontal scroll at 320 or at 400% zoom of 1280;
   - with JavaScript disabled, every bill in bills.json renders.
   If a limit fails with real data, fix it through the tokens or the clamp, not per bill, and report what you changed.

VERIFY:
- lint, build, test:content and the full test:e2e suite pass;
- screenshots in screens/t3/ at 2560, 1440, 1280, 1024, 991, 768, 390 and 320, including the longest title and the longest latest action in the data (name them in the report);
- compare 1440 against the Figma screenshot and list what still differs (spec §5 lists the known ones);
- Eclipse parity isn't needed (no shared tokens changed). Say so.

Add "T3: tracker page shell and bill table" under Progress (above E7), tick it, and append the handoff entry. Record the measured chars per line for the title and the latest action at each viewport.
```

## T4: Finder controls, pagination, empty state (Nov 8)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T3 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/app/tracker/. Extend BillTable and BillRow; don't fork them.
4) Read docs/tracker-spec.md §4.1, §4.3, §4.4b, §4.6 and §4.8.
5) If the Figma MCP is connected, screenshot BillFinder 2209:2 and BillFinderNoMatch 2212:536 for reference.

WHY: a list of a few hundred bills is only useful if a researcher can narrow it fast, page through it without losing their place, share the view they ended up with, and recover when nothing matches.

1) BillFinder.tsx ("use client") wraps the table. Per §4.1 and §4.3–4.6:
   - the search (label variants, diacritic-insensitive);
   - the chamber, status and sort selects;
   - the topic radio pills, with counts that reflect the other filters;
   - the role="status" count;
   - pagination (§4.4b): per page 10/25/50/100 with 25 as the default, the range, the page select, previous/next; hidden before mount; focus moves to the count on page change;
   - URL sync of q, chamber, status, topic, sort, page and per via replaceState, read on mount, with defaults left out;
   - the empty state, whose clear button resets everything and focuses the search.
   page.tsx stays a server component and passes the bills in.
2) Put the filtering, sorting, topic counts and paging in pure functions in a colocated finder.ts, with vitest tests:
   - search variants ("hr 2794", "H.R.2794", "2794", "s146", "Maria" → María);
   - each filter and each sort;
   - topic counts under a search;
   - paging edges (the last partial page; a page number past the end clamps).
3) Field styling per §4.3: 3.5rem fields, 1px border-tile-fg, a ChevronDown in each select. Pills per §4.3. Pagination per §4.4b: 2.5rem circular buttons, disabled at the ends, select hit areas ≥ 2.5rem. Check the existing buttons before you style "Clear all filters". Add ChevronLeft and ChevronRight to CLAUDE.md §3's icon list.
4) TESTS (extend tests/tracker.spec.ts, at every configured viewport):
   - axe reports 0 violations at rest, filtered, on page 2 and in the empty state;
   - typing "zzzz" shows the empty state, the status text updates, and Clear resets the list and focuses the search;
   - a topic narrows the list and its URL round-trips on reload;
   - Next goes to page 2, the range reads "26–50 of N bills", focus lands on the count, Previous is enabled, and on the last page Next is disabled;
   - changing a filter on page 3 resets to page 1;
   - per page 50 shows 50 rows;
   - every control has an accessible name, and targets are ≥ 24px (the pagination buttons are 40);
   - the pagination wraps cleanly with no horizontal scroll at 390 and 320;
   - with JavaScript disabled, every bill still renders.

VERIFY:
- lint, build, test:content and the full test:e2e suite pass;
- screenshots in screens/t4/ at 1440, 1024, 768 and 390: the default view, a filtered view, page 2 with the focus visible on the count, the pagination close up, and the empty state;
- compare against the two Figma screenshots and list what remains different.

Add "T4: tracker finder controls, pagination, empty state" under Progress (above E7), tick it, and append the handoff entry.
```

## T5: Expanded rows (the chevron) (Nov 8)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T4 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/app/tracker/. Extend BillRow and BillFinder; don't fork them.
4) Read docs/tracker-spec.md §3.4, §4.4 and §4.5. Read Part A A9 for the external-link pattern.

WHY: the chevron opens what a policy researcher checks after the status: what the bill does (the CRS summary), how it moved (milestones and roll calls), who backs it (the party split), its companion, and where the text and the CBO score are. The data is already in content/tracker/bills.json (T2).

1) PANEL: BillPanel.tsx (a server-safe plain component) renders §4.5 inside each <details>, after the summary. The full official title goes first when the row's title is clamped. Use a <dl> for the facts and an <ol> for the milestones, and omit any term with no data. External links use the existing external-link pattern. Every date is a <time> formatted with the existing date helper. Reading text keeps to the measure (max 65ch).
2) LAYOUT: in the wide layout the panel starts at the title column and runs to the end, in two columns (summary on the left, facts on the right). In the medium and stacked layouts it's one column. Use the same .bill-table container queries as the rows; spacing comes from layout tokens only.
3) HASH: per §4.5. On load and on hashchange: clear any filter that hides the bill, go to its page, open it and scroll it into view (instantly under reduced motion). Companion links to #id use the same path.
4) PAYLOAD: build, then measure the gzipped /tracker HTML. If it's above 300 KB, cut the excerpt per §4.5 and re-measure. Report both numbers.
5) TESTS (extend tests/tracker.spec.ts):
   - axe reports 0 violations with one row open, in each layout;
   - opening S. 146 shows "Became law", milestones in date order, and the Congress.gov link marked as external;
   - /tracker#s146-119 loads with that row open, even when it's on another page or filtered out by the URL;
   - a companion link opens its target row;
   - the chevron's computed transform flips when open, with no transition under reduced motion;
   - the panel causes no horizontal scroll at 320.

VERIFY:
- lint, build and the full test:e2e suite pass;
- screenshots in screens/t5/: S. 146 open at 1440, 1024, 768 and 390; one bill with no summary open at 1440;
- spot-check two open bills against their Congress.gov pages with WebFetch (milestones, cosponsor split, committees) and report mismatches.

Add "T5: tracker expanded rows" under Progress (above E7), tick it, and append the handoff entry.
```

## T6: Wire the tracker into the site, methodology, docs (Nov 8)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T5 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/ and content/.
4) Read docs/tracker-spec.md §3.5, §4.7 and §5–6.

WHY: the Home stats and the article rail still show hand-entered placeholders while the tracker has the real data. The page also needs to say how its list is built, so a researcher can trust it, reuse it and cite it.

1) HOME: confirm that content/bill-stats.json is generated (placeholder: false) and that Home shows those numbers with the fetch date. No component change should be needed; report it if one is.
2) RAIL: statusLine in src/lib/bills.ts uses the tracker's stageLabel and latest-action date (as of the fetch date) when the bill's id is in the tracker, and falls back to the manual status. Add a vitest test for both paths. The rail's markup doesn't change.
3) METHODOLOGY: the "How this list is built" section on /tracker per §4.1 and §4.7: an h2 in type-display-h3, three paragraphs from page.json on the measure, "Download the data (CSV)" linking /data/ai-bills-119.csv (with its size and row count), and "How to cite" with the citation text. It goes after the finder, with the section gap. Report it as a deliberate addition to the Figma frame.
4) DOCS:
   - Part A: a new "A11. Bill tracker" that points to docs/tracker-spec.md for the details and lists the tokens added in T3 and T4;
   - CLAUDE.md §3: /tracker is no longer a stub; content/tracker/ and scripts/tracker/ exist; the key rule (never read .env.local);
   - CLAUDE.md §4: signal on /tracker is the h1 span and the status bar only; secondary text is text-tile-muted, never a raw gray;
   - CLAUDE.md §9: tracker:probe, tracker:fetch and tracker:backfill;
   - build-prompts "Open items": remove "Bill tracker page", and add the review.json triage and the Figma carry list (spec §5, "Still different", items 1, 2, 3, 6 and 7);
   - E7's gate now says "If T6 isn't ticked", and E7's deferred list drops "the bill tracker page".
5) The old /tracker signal-header open item (carried since E6.8) is gone. Say so in the handoff.

VERIFY:
- lint, build, test:content and the full test:e2e suite pass;
- axe reports 0 violations on /, /tracker and the TAKE IT DOWN article at 1440 and 390;
- screenshots in screens/t6/: the Home bill band, the article rail for TAKE IT DOWN, and the methodology section at 1440 and 390;
- the CSV link downloads.

Add "T6: tracker wired to Home and the rail, methodology, docs" under Progress (above E7), tick it, and append the handoff entry. List every TODO(joey) the T-series added.
```

## T7: Daily refresh with a GitHub Action (optional)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T6 isn't ticked under Progress, stop and tell me.
3) Read docs/tracker-spec.md §3.2 and §3.6.

WHY: the dek can only say "updated daily" if something updates it daily. Running this prompt means Joey wants a GitHub Action that commits data changes to main. Its CONGRESS_API_KEY comes from a repository secret, which Joey adds himself.

1) Add .github/workflows/tracker.yml per §3.6:
   - Node from .nvmrc or the engines field (add one if neither exists, matching the local version);
   - npm ci;
   - npm run tracker:fetch;
   - commit only when content/tracker/, content/bill-stats.json or public/data/ changed;
   - permissions: contents: write only;
   - concurrency: one run at a time;
   - .cache/congress cached with actions/cache;
   - a failed fetch fails the job without committing.
2) In page.json, change the dek's source clause to "updated daily from Congress.gov" and mark it TODO(joey) until the Action has run green once.
3) docs/tracker-spec.md §6: write the exact steps for adding the secret (Settings → Secrets and variables → Actions → New repository secret → CONGRESS_API_KEY) and for triggering the first run (Actions → Tracker refresh → Run workflow).

VERIFY:
- check the workflow against the GitHub Actions docs (WebFetch docs.github.com): triggers, permissions, the secret reference and the commit step. Report what you checked;
- lint and build pass.
Don't push.

Add "T7: daily tracker refresh workflow" under Progress (above E7), tick it, and append the handoff entry.
```

---

## E7: QA pass

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0 "Sessions start cold".
2) Read docs/progress.md (the handoff log). If T6 isn't ticked under Progress in CLAUDE.md, stop and tell me.
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
- everything still open (with the deferred items: Copy article link, Related, charts, the newsletter design).

Tick E7 in CLAUDE.md, then append the E7 handoff entry to docs/progress.md (CLAUDE.md, "Handoff log").
```

---

## T8–T11: Tracker fixes after the first full run (Nov 9)

**What Joey reported:**
1. The page takes a very long time to load.
2. Per page should default to 10, and setting 10 misbehaves.
3. On phones, the filters should collapse into a Filters menu.
4. The column header should stick while scrolling.
5. There should be more topics.

**What review of the code and the handoff log found:**
- **The page is too heavy.** The built /tracker HTML is 1.5 MB (127 KB gzip):
  - all 220 rows render on the server with every expanded panel inside;
  - the full bill objects ship a second time as client props;
  - the browser hydrates 220 `<details>`.
- **The data has false positives.** The title pattern `generative` matches "Regenerative" (3 bills), and the `A.I.` pattern matches "AI/AN" (American Indian/Alaska Native; 2 bills).
- **Most bills have no topic:** 139 of 220.
- **E7 found the dev server on :3000 orphaned.** It answers 500 or hangs, which makes /tracker in dev look far slower than it is.
- **Smaller issues carried in the log:** a summary excerpt can end mid-sentence; a hash link set before hydration doesn't open its row; "hr" alone finds nothing; the bar gap is 4px, not the spec's 3px; S. 146's discharge is labeled "Reported"; Part A A9 still calls /tracker a stub.

**Zustand isn't used.** The finder's state is already an external store: the URL, read with `useSyncExternalStore`, so views stay shareable. The slowness is payload and DOM size, not state. A second store would add a dependency and a second source of truth without saving a byte. T9 fixes the cause.

**Run order:** T8 → T9 → T10 → T11, from PowerShell: `.\scripts\run-prompts.ps1 -Prompts T8,T9,T10,T11 -NoPause`.

## T8: Tracker data: false positives, topics, excerpts, split files (Nov 9)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If E7 isn't ticked under Progress, stop and tell me.
3) Run git status and list scripts/tracker/ and content/tracker/. Reuse the existing scripts; don't rewrite them.
4) Read docs/tracker-spec.md §3 and §4.7, and the T8–T11 intro above this prompt in docs/build-prompts.md.

WHY: five published bills aren't about AI, two thirds of the bills have no topic, and the page ships every bill's full detail up front. This session fixes the data and writes it in the shape T9 needs. It doesn't touch any UI.

1) FALSE POSITIVES in content/tracker/config.json titlePatterns:
   - make "generative" a whole word (\bgenerative\b);
   - make the A.I. pattern refuse "AI/AN" (add (?!\/AN) or equivalent).
   Add a vitest test over the config's patterns:
   - these must not match: "Advanced Wound Care and Regenerative Medicine Access and Reform Act", "Battery and Regenerative Braking Act", "Local Food Recycling and Regenerative Opportunities Act", "AI/AN CAPTA";
   - these must match: "AI Kill Switch Act", "Secure A.I. Development Act of 2026", "Generative AI Terrorism Risk Assessment Act", "AI-Ready Networks Act".
2) TOPICS: replace config.json's topics with these, in this order. Each pattern is tested case-insensitively against the title, the CRS subjects, the policy area and the first summary paragraph that ends in a period. A bill can have several topics.
   | id | label | pattern |
   |---|---|---|
   | deepfakes | Deepfakes and likeness | deep ?fakes?, digital replicas?, likeness, synthetic (media\|content\|images?), intimate (images?\|visual), impersonat, voice clon, fabricated |
   | chatbots | Chatbots and companions | chatbots?, companion, conversational, human-like |
   | child-safety | Children and teens | \bchild, \bminors?\b, \bkids?\b, \bteens?, \byouth, crimes against children, child safety |
   | elections | Elections | elections?, campaign, political ad, voters?, ballot |
   | transparency | Disclosure and labeling | disclos, label, transparen, watermark, provenance, bill of materials, \bads?\b, advertis |
   | safety | Safety and risk | \brisks?\b, kill switch, emergency button, rogue, self-improving, incident, threat, guardrail, containment, frontier, evaluation, catastroph, loss of control |
   | privacy | Privacy and data | privacy, personal data, data protection, data collection, biometric, surveillance |
   | fraud | Fraud and consumer protection | fraud, scams?, decepti, consumer, collusion, price gouging, pricing, identity theft |
   | bias | Bias and civil rights | \bbias, discriminat, civil rights, algorithmic accountability, algorithmic systems, censorship |
   | jobs | Jobs and the economy | \bjobs?\b, \bworkers?\b, workforce, employ, labor, talent, wage, small business, main ?street |
   | health | Health care | health, medic, doctors?, patients?, hospital, clinical, \bFDA\b |
   | education | Education | educat, classroom, \bschools?\b, teachers?, literacy, universit, college |
   | government | Government use of AI | federal agenc, government, veterans?, \bVA\b, procure, \bOMB\b, CISA, customs, border, \bSBA\b, federal data |
   | preemption | Federal and state roles | preempt, moratorium, state law, states'? right, state regulation |
   | national-security | National security | national security, defense, military, armed forces, foreign adversar, China, Chinese, DeepSeek, export, chips?\b, semiconductor, intelligence community, national intelligence, terroris, weapons, cyber |
   | research-compute | Research and compute | research, \bcompute\b, NAIRR, National Science Foundation, \bNSF\b, testbed, standards, NIST, grand challenge |
   | energy | Energy and data centers | energy, data cent, cooling, environment, climate, \bheat\b, grid, electricity, emissions |
   Join each row's alternatives with |. Keep topicOverrides. If any topic ends up with fewer than 4 bills, report it rather than dropping it.
3) SUMMARY EXCERPT: the normalized summary keeps every paragraph, but add `excerpt`: the leading paragraphs up to about 600 characters, ending at a paragraph that ends in a period (never mid-sentence; S. 146's current third paragraph ends "…intimate visual depictions of"). Use the opening title-only line only when nothing else exists.
4) MILESTONE LABEL: a committee discharge is labeled "Discharged from committee", not "Reported by committee". The stage rule is unchanged (a discharge still counts as stage 2); only the milestone label changes. Update the stage tests.
5) SPLIT OUTPUT for fast loading (T9 uses it). The fetch script also writes:
   - content/tracker/index.json: the row fields only, per bill: id, type, number, label, title, sponsor {name, party, state}, originChamber, introducedDate, stage, stageLabel, latestAction, cosponsors.count, topics. Sorted like bills.json. Validated by zod in src/lib/tracker.ts as TrackerIndexBill. Report its raw and gzip size.
   - public/data/tracker/bills/{id}.json: one file per bill with everything the expanded panel needs (summary with excerpt, milestones, committees, cosponsor split, related/companions, cbo, law, text, congressGovUrl, subjects, policyArea). Delete files for bills that left the tracker.
   bills.json stays the full record (the CSV, the rail and the tests use it).
6) NO-API REBUILD: add `--rebuild` to fetch.mjs. It re-classifies and re-normalizes every cached bill from .cache/congress/ with no API calls, so title-pattern, topic and excerpt changes apply without a sweep. A bill whose title no longer matches and isn't on the watchlist leaves the tracker. Exclude `topics` and `topicOverrides` from the config hash, so a topic edit never forces a full sweep. Add "tracker:rebuild": "node scripts/tracker/fetch.mjs --rebuild". Run it.
7) Update docs/tracker-spec.md §3.1 (patterns, topics), §3.2 (--rebuild, index.json, the per-bill files) and §3.4 (the excerpt).

VERIFY:
- lint, build and test:content pass;
- after `npm run tracker:rebuild`, the 5 false positives are gone from bills.json, index.json, the CSV and the per-bill folder;
- report a table of each topic and its bill count, plus how many bills have no topic (target: under 15%), with their titles;
- S. 146's excerpt ends at a period;
- the stage tests pass with the new label;
- no key appears in any output.

Add "T8: tracker data fixes, topics, excerpts, split files" under Progress, tick it, and append the handoff entry.
```

## T9: Tracker load time, caching and the per-page bug (Nov 9)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T8 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/app/tracker/ and content/tracker/. Extend BillFinder, BillTable, BillRow and BillPanel; don't fork them.
4) Read docs/tracker-spec.md §4.1, §4.4b and §4.5, and the T8–T11 intro above this prompt in docs/build-prompts.md.

WHY: /tracker's built HTML is 1.5 MB. Every bill's row and full panel render on the server, the full bill objects ship again as client props, and the browser hydrates 220 <details>. The fix is to send less, render less and cache what's fetched. It isn't a state library: the URL stays the single source of truth via useSyncExternalStore, and no Zustand or other state dependency is added.

Measure first, on a production build (`npm run build`, then `npm start` on a free port; the dev server isn't a fair measure). Record:
- /tracker HTML bytes, raw and gzip;
- the route's JS, gzip;
- DOM node count;
- LCP and Total Blocking Time from Playwright's performance APIs (CDP), with 4× CPU throttling and Fast 3G network emulation, at 390 and 1440.
Put the before numbers in the handoff.

1) PER-PAGE BUG FIRST: Joey reports that the page should always render with 10 bills per page, but once per page is set to 10, "there are then only 10 bills" and the other filters adjust to that. Reproduce it in a Playwright test before changing anything: set per page to 10 and assert that the status count, the range ("1–10 of N bills"), N, the page count and every topic count are unchanged apart from the page size. Also check that per page survives a filter change, a sort change, a page change, a reload, and a hash link. Find the cause, fix it, and keep the test.
2) DEFAULT 10 PER PAGE everywhere: DEFAULTS.per, parseState's fallback, the spec and the tests. The options stay 10/25/50/100.
3) SEND LESS:
   - BillFinder gets the rows from content/tracker/index.json (T8), imported in the client module, so the bundler gives it a hashed, immutably cached chunk. It never gets the full TrackerBill objects as props.
   - page.tsx renders only what the default view shows: the first 10 rows of the default sort, with no panels, and passes nothing else bill-related to the client.
   - Without JavaScript, the page shows those 10 rows and a <noscript> note: "The full list needs JavaScript. Download every bill as CSV" (linking the CSV), with copy in page.json. Update CLAUDE.md §5's no-JS rule with this tracker exception and its reason (spec §4.1 too).
4) RENDER LESS: only the current page's rows are in the DOM.
5) LAZY PANELS WITH CACHING:
   - A row's panel content is fetched from /data/tracker/bills/{id}.json on first open, and kept in a module-level Map so reopening, paging back or re-filtering never refetches.
   - Prefetch on pointerenter and focus of a summary, so most opens are instant.
   - While loading, the panel shows "Loading details…" with aria-busy="true", keeping its space so the row doesn't jump.
   - On a failed fetch, it shows "Couldn't load the details" plus the "View on Congress.gov ↗" link, and retries on the next open.
   - Hash links still open their row after the fetch.
   - Keep BillPanel's markup and the T5 tests' expectations; only the data source changes.
6) HTTP CACHING in next.config.ts headers():
   - /data/tracker/bills/:id* → Cache-Control "public, max-age=3600, stale-while-revalidate=86400" (the data changes at most daily);
   - /data/:file*.csv → the same.
   Next already caches its hashed chunks immutably; don't change that.
7) BUDGETS: add tests/tracker.perf.spec.ts. It runs only against a production server; add a playwright config for it, or skip it under `next dev` with a clear message. It asserts:
   - /tracker HTML ≤ 120 KB raw;
   - ≤ 10 rows and no panel content in the server HTML;
   - opening a row makes exactly one request for its JSON, and reopening makes none;
   - LCP < 2.5 s and TBT < 200 ms at 390 under the throttling above.

VERIFY:
- lint, build, test:content and the full test:e2e suite against a production server pass. The T3–T5 tracker tests need updating for 10 per page, lazy panels and the 10-row server render: change their expectations, not their intent, and list every test you changed and why;
- the before and after table: HTML raw/gzip, JS gzip, DOM nodes, LCP, TBT at 390 and 1440;
- axe reports 0 violations at rest, with a row open (after its fetch), and in the loading state;
- screenshots in screens/t9/: default at 1440 and 390, a row loading and loaded, and the no-JS view.

Add "T9: tracker load time, lazy panels, caching, 10 per page" under Progress, tick it, and append the handoff entry.
```

## T10: Filters menu on phones, sticky column header (Nov 9)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T9 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/app/tracker/. Extend FinderControls, BillTable and globals.css; don't fork them.
4) Read docs/tracker-spec.md §4.3, §4.4 and §4.8, and Part A A9.

WHY: on a phone the chamber, status and sort selects plus 17 topic pills push the list a full screen down. And on a long page, the columns lose their labels as soon as the header scrolls away.

1) FILTERS MENU below md (768). The same controls, rendered once (no duplicate IDs); CSS and one boolean decide the layout:
   - The search stays visible. Under it sits a full-width "Filters" button: 3.5rem tall, 1px border-tile-fg, type-text-regular, a ChevronDown that rotates when open (motion-safe only).
     * Its label shows the active count: "Filters" with nothing active, "Filters (2)" when chamber, status, sort or topic differ from their defaults.
     * It has aria-expanded and aria-controls on the panel.
   - The panel opens inline, pushing the list down, rather than as a modal, so focus never gets trapped and the back button isn't hijacked. It holds the chamber, status and sort selects stacked full width, then the topic pills, wrapping.
   - At the bottom of the panel, two buttons:
     * "Show {n} bills" (ink pill): closes the panel, scrolls the result count into view and focuses it;
     * "Clear filters" (text button): resets everything but the search, and keeps the panel open.
   - Escape closes the panel and returns focus to the Filters button.
   - The panel always starts closed, even when the URL has active filters; the button's count shows they're active.
   - At md and up there's no button, and the controls lay out exactly as now.
   - Copy goes in page.json.
2) STICKY COLUMN HEADER in the wide and medium table layouts (the stacked layout has no header):
   - .bill-head is position: sticky at top 0 (the /tracker topbar isn't sticky; check it). Paper background, a z-index above rows, and its 4px rules kept.
   - Only while the table is in view: it sticks inside .bill-table and leaves with it.
   - FOCUS NOT OBSCURED (WCAG 2.4.11): a summary that gets keyboard focus must never sit under the stuck header. Give each row a scroll-margin-top of the header's height (a CSS variable set from the header's measured height, or a token that matches it) and check it with a keyboard walk.
   - This is a reading aid, not motion, so it stays sticky under prefers-reduced-motion. Write that exception into CLAUDE.md §5 and Part A A9, next to the existing sticky rules, with the reason.
   - Only when the viewport is at least 640px tall (CLAUDE.md §5's height rule).
3) TESTS (extend tests/tracker.spec.ts):
   - at 390 the selects and pills are hidden until the Filters button opens them, and the button's count reads "Filters (2)" after two filters are set;
   - "Show n bills" closes the panel and focuses the count;
   - Escape returns focus to the button;
   - axe reports 0 violations with the panel open and closed;
   - at 1440, after scrolling halfway through the table, the header's top is 0 and every column label is visible;
   - a Tab walk through the rows never leaves a focused summary's top above the header's bottom edge;
   - under reduced motion the header still sticks;
   - at 1440×600 (under 640 tall) the header doesn't stick.

VERIFY:
- lint, build and the full test:e2e suite against a production server pass;
- screenshots in screens/t10/: 390 with the menu closed, open, and with 2 active filters; 1440 and 1024 mid-scroll with the header stuck; a keyboard-focused row just under the header.

Add "T10: tracker filters menu on phones, sticky column header" under Progress, tick it, and append the handoff entry.
```

## T11: Tracker bug sweep (Nov 9)

```
FRESH SESSION: assume you remember nothing from earlier sessions. Before anything else:
1) Read CLAUDE.md in full, including section 0.
2) Read docs/progress.md per §0. If T10 isn't ticked under Progress, stop and tell me.
3) Run git status and list src/app/tracker/.
4) Read docs/tracker-spec.md §4 and the T8–T11 intro above this prompt in docs/build-prompts.md.

WHY: the handoff log has carried small tracker defects since T3. Fix them, then hunt for more with fresh eyes. Defects only: no new features.

Fix each of these, with a test where one is practical:
1) SEARCH: "hr", "s", "h.r." or "hjres" alone (a bill type with no number) should list that type's bills. Today "hr" finds nothing because the haystack holds "h.r.". Add the case to finder.test.ts.
2) PRE-HYDRATION HASH: a hash set on an already-loaded page before hydration doesn't open its row (T5's note). Make the hash effect read location.hash when it first runs after hydration, and test it with the immediate goto("#…") that T5 described.
3) PROGRESS BAR GAP: the bar uses gap-4. The spec and Figma use 3px (--progress-gap, 3/16rem). Add the token if it's missing, and log it.
4) STACKED LAYOUT TOP RULE: the first row has no rule above it below 38.5rem (T3's note). Add the table's top rule to match the other layouts' header rule, or a 1px tile-line, whichever matches the wide layout's visual rhythm. Report which you chose.
5) THE NATIVE SEARCH CLEAR "×" is Chrome's blue. Hide the WebKit cancel button and add our own clear button inside the field: aria-label "Clear search", ink, size-icon-inline, a target of at least 24×24px, visible only when there's a query, and focus returns to the input.
6) THE PAGER ON PHONES takes three lines at 390 (T4's note). Put the range and per page on one line and the pager on the next, if that fits at 320 without overflow; otherwise leave it and report.
7) STALE DOCS: Part A A9 still says "/tracker is a stub page". Fix it, and grep the docs for any other "stub" mentions of /tracker.
8) HUNT: run the whole tracker in a production build at 1440, 1024, 768, 390 and 320, keyboard only and then with a screen-reader-style accessibility tree dump (Playwright's ariaSnapshot) of one row, open and closed. Look for:
   - wrong or missing accessible names;
   - focus loss after any action (filter, page, clear, open, close, the Filters menu);
   - layout overflow with the longest title, the longest latest action and the longest sponsor name in the data;
   - a stage label that disagrees with its bar;
   - dates in the wrong order;
   - an empty panel term;
   - console errors and hydration warnings;
   - the status count and range disagreeing;
   - URLs that don't round-trip.
   Fix what you find and list each fix with its file. List anything you judge not worth fixing, with the reason.
9) DEV SERVER: if :3000 doesn't answer 200 on /tracker within 30 s, say so at the top of the report. Joey must kill it (E7 found an orphaned dev server) before trusting dev-mode timing.

VERIFY:
- lint, build, test:content and the full test:e2e suite against a production server pass, plus tests/tracker.perf.spec.ts from T9;
- axe reports 0 violations on /tracker at 1440 and 390: at rest, filtered, with a row open, in the empty state, and with the phone Filters menu open;
- screenshots in screens/t11/ for each visual fix (before and after where it's visual).

Add "T11: tracker bug sweep" under Progress, tick it, and append the handoff entry, ending with every open TODO(joey) for the tracker.
```

---

## Open items (design, not code)

- **Newsletter form:** Joey is designing the final version. The build adds a visible label and keeps the Figma shapes for now.
- **Tracker review queue:** go through `content/tracker/review.json` (66 bills after the first backfill) and move each into the `watchlist` or `exclude` in `content/tracker/config.json`.
- **Figma carry list for the tracker** (tracker spec §5, "Still different"):
  * (#1) latest action is Text/Regular, not H5 (7 text layers);
  * (#2) the status bar fills n segments ("Step 5 of 5" shows 5, not 4);
  * (#3) chamber is the originating chamber ("S. 146 · House" is wrong);
  * (#6) pagination copy: "Bills per page", "1–25 of 214 bills", "Page [1] of 9" (10 per page by default since T9, as in Figma);
  * (#7) Figma's placeholder errors: "H.R, 2794" has a comma, and NO FAKES is marked "Became law".
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
