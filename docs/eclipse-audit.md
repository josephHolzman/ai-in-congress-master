> **Repo context file.** This is the Eclipse 2024 audit and the design-system history for AI in Congress, copied from the project doc `claude/eclipse-audit-figma-setup.md`.
> - **Use it for:** Eclipse's measured values (fluid root, type scale, tile padding, band behavior, hover timing) and the reasoning behind each design decision.
> - **Precedence:** where this file and `docs/build-prompts.md` Part A disagree, **Part A wins**; it's newer and reflects the final Figma frames. Some sections here record earlier decisions that were later revised. Revisions are marked "REVISED" or "Superseded".

# Eclipse (May 2024) audit, and the Figma setup for AI in Congress

Source: https://web.archive.org/web/20240524202822/https://www.eclipse.xyz/

The audit comes from Eclipse's live stylesheet, its `:root` variables and computed styles, measured in Chrome at a 1387px-wide window, plus screenshots of each section.

## 1. Audit: how the 2024 Eclipse site is built

**It's a Webflow site built on the Client-First class system.** It has:
- no column grid;
- no smooth-scroll library (no Lenis or GSAP);
- 11 Webflow interactions;
- `transition: background-color 0.3s` on hoverable tiles.

The smoothness comes from three things: everything scales with the window, tiles fill with color on hover, and there's a great deal of empty space inside the tiles. Nothing hijacks scrolling.

### 1.1 Scaling: the root font size follows the window width
```
html { font-size: calc(-0.125rem + 1.25vw) }   /* 1440px → 16px, 1387px → 15.3px */
@media (max-width: 1280px) { html { font-size: 0.875rem } }  /* fixed 14px */
@media (max-width: 991px)  { html { font-size: 1rem } }      /* fixed 16px */
```
Every size is in rem, so type, padding and tile heights scale together. **At 1440, 1rem = 16px**, so designing in Figma at 1440 with 16px as the base matches the code exactly.

### 1.2 Color (`:root` variables, verbatim)
| Name | Hex | Black text | White text |
|---|---|---|---|
| white | `#FFFFFF` | 20.8 | — |
| grey | `#EEEEEE` | 17.9 | 1.2 |
| black | `#020202` | — | 20.8 |
| navy | `#0D0C2B` | 1.1 | 19.0 |
| red (the orange) | `#FF4301` | **6.0** | **3.5 (fails for small text)** |
| green-light (mint) | `#C4FFC3` | 18.2 | 1.1 |
| pink | `#ECC8CA` | 13.5 | 1.5 |
| blue | `#626F9F` | 4.2 | 4.9 |
| green (sage) | `#7B9E8B` | 7.0 | 3.0 |
| beige | `#D8D4BB` | 13.9 | 1.5 |
| yellow | `#E9FF53` | 18.7 | 1.1 |
| orange (amber) | `#FFB036` | 11.4 | 1.8 |

**Divider lines are a translucent version of the text color, never a separate gray:**
- on dark tiles: `rgba(255,255,255,0.2–0.24)`;
- on light tiles: `rgba(0,0,0,0.1)` or `rgba(98,111,159,0.2–0.3)` (the blue at 20–30%).

### 1.3 Type (ABC Monument Grotesk, weight 500 for headings, 400 for text)
| Class | Size (rem → px at 1440) | Line height | Tracking | ≤ 991 | ≤ 767 |
|---|---|---|---|---|---|
| heading-style-landing (wordmark) | 11.25 → 180 | 0.9 | — | 6.25rem | 3.125rem |
| h1 | 5.625 → 90 | 1.0 | −3% | 3.75rem | 2.5rem |
| h2 | 4.125 → 66 | 1.0 | −3% | 2.5rem | 2.125rem |
| heading-style-58 | 3.625 → 58 | 1.0 | −3% | 2.5rem | 2.125rem |
| h3 | 2.375 → 38 | 1.1 | −3% | 2rem | 1.5rem |
| h4 | 1.5 → 24 | 1.3 | −3% | 1.25rem | 1rem |
| h5 | 1.25 → 20 | 1.4 | −3% | 1rem | 0.875rem |
| h6 | 1 → 16 | 1.5 | −3% | 0.875rem | 0.75rem |
| text-size-large | 1.5 → 24 | 1.3 | −2% | | 1.125rem |
| text-size-medium | 1.375 → 22 | 1.3 | −2% | | |
| text-size-regular | 1 → 16 | 1.35 | 0 | 0.9375rem | |
| text-size-small | 0.875 → 14 | 1.4 | 0 | | |
| text-size-tiny | 0.75 → 12 | 1.4 | 0 | | |
| nav link | 1.125 → 18 | ~1.1 | 0 | | |

### 1.4 Space and layout
- **Tile padding: 2.5rem (40px) on every side**, everywhere (`.pad-medium`, `.padding-global`, the nav).
- Variants: `pad-top-large` (top 8.75rem = 140px), `top-padding-5` (top 5rem = 80px), `pad-large` (40 / 40 / 140).
- Scale: 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7.5, 8, 12rem.
- **Layout is tiles, not columns.** The page is a stack of full-width bands. Each band is one full tile or splits into halves (50/50); some lists use quarters. Tiles meet edge to edge, divided by 1px lines on their right and bottom edges. There are no gutters.
- **Heights:**
  * the hero and intro bands are 100vh (936px at 1387);
  * the banner is about 430;
  * the "find out" tile and the open-position tiles are `min-height: 50rem` / 100vh;
  * blog tiles are `min-height: 17.5rem`;
  * the footer is 31rem.
- **Nav:** 2.5rem padding; a 2-column grid of link columns with a 2.5rem gap, each column 2 rows; each link has 0.625rem vertical padding and a 1px line above it; external links get a 12px ↗.
- **Radius:** only on the email input and the Submit pill (fully round), and the round badge. Tiles are square.

### 1.5 Home page sequence (top to bottom)
| Band | Height | Color | What's in it |
|---|---|---|---|
| Hero | 100vh | mint | Logo mark and nav at the top; a giant wordmark as wide as the screen at the bottom; a tagline at about 58px sitting on the wordmark |
| Intro | 100vh | white | h2 at the top left, with one phrase in orange; a small orange paragraph at the bottom left; a spinning badge at the bottom right |
| Banner | 431 | navy | White h2 at the top left; a small "Referral Bonus Program ↗" link at the bottom left |
| Stats | 1950 | white / black halves | Left: a sticky h2 question. Right: a black tile of stacked stats ("50,000+" in h2 with a small label), each block padded 5rem at the top |
| "Find out how" | 100vh | grey, hover mint | A full-tile link: h2 text with a large → arrow |
| Feature | 430 | orange / black halves | Left: h2 in white, a small white paragraph, then a black action row "Learn how it works →". Right: 4 black rows with a bullet dot and a label, divided by white lines at 24% |
| Investors / ecosystem | ~285 each | white halves | Left: h2. Right: a plain list of names and "+ more" |
| News / careers | 472 | black halves, hover mint | Left: h3 "Latest news" with a large arrow at the bottom left. Right: a dot mark and h3 "See open positions →" |
| Sign-up | 291 | orange | h3 in white, a full-width pill input and a black Submit pill |
| Footer | 31rem | black | A giant mint wordmark cropped at the bottom; small mint social links ↗ |

### 1.6 Interaction
- **Hover:** tiles fade to `--green-light` over 0.3s (news, careers, "find out how", feature rows).
- Arrows are large stroked glyphs (about 32px) flush right in their tile or row.
- That's all. No reveal-on-scroll, no parallax, no scroll-jacking.

### 1.7 Accessibility problems not to copy
- **Small white text on orange (3.5:1)** and **small orange text on white (3.5:1)**, for example the intro paragraph and the feature paragraph. Both fail WCAG 1.4.3.
- **Hover fills with no matching focus style.** That fails visible focus for keyboard users (2.4.7).
- **Text scales purely with the window width between 1281 and 1440px.** Page zoom works through the breakpoints, but any viewport-based type still has to pass the 200% zoom test (1.4.4).
- The spinning badge has no pause control, which matters if it runs longer than 5 seconds (2.2.2).

## 2. Palette for AI in Congress: Eclipse, shifted

Same structure and energy. Every hue is nudged, and the navy, pink and orange are the ones your logo and earlier work already use.

| Token | Eclipse | AI in Congress | Text on it |
|---|---|---|---|
| `paper` | `#FFFFFF` | `#FFFFFF` | ink 20.0 |
| `stone` | grey `#EEEEEE` | `#EDEBE6` (warm limestone) | ink 16.8 |
| `ink` | black `#020202` | `#08080C` | white 20.0, signal 5.8, mint 17.3 |
| `navy` | `#0D0C2B` | `#10133A` | white 17.9, signal 5.1 |
| `signal` | red `#FF4301` | `#FF4301` (keeps your logo color) | **ink 5.8 at any size; white only at 24px and up** |
| `mint` | green-light `#C4FFC3` | `#C2FCD3` (a touch cooler) | ink 17.3 |
| `blush` | pink `#ECC8CA` | `#EFCFC8` | ink 13.7 |
| `volt` | yellow `#E9FF53` | `#E4FA5B` | ink 17.3 |
| `amber` | orange `#FFB036` | `#FFAE3D` | ink 10.8 |
| `sand` | beige `#D8D4BB` | `#DDD6BE` | ink 13.7 |
| `slate` | blue `#626F9F` | `#0060C4` | white 5.2; as text on paper 5.2 |
| `sage` | green `#7B9E8B` | `#6F9C86` | **ink only** (white 3.1 fails) |

**Text rules, contrast-checked:**
- **Muted text** is the tile's text color at 72% opacity:
  * ink at 72% passes on paper, stone, mint, volt, blush, sand and amber (6.1–8.4:1);
  * white at 72% passes on navy and ink (9.6–10.3:1);
  * **on `signal`, use full ink (muted ink is 4.15:1 there).**
- **Orange text** (`signal`) is only for text at 24px and up, on any tile where it passes. Below 24px, orange is a graphic accent only: chip borders, dots, arrows, lines. On ink, signal passes WCAG 2 (5.8:1), but it drops to about 4.0:1 under protanopia simulation and scores only APCA Lc 41, so small orange text on dark tiles reads weakly. Small text on dark tiles is white or white 72%.
- **Volt is the accent on dark tiles** (Ink and Navy modes), at any size: 17.3:1 on ink and 15.4:1 on navy, staying at or above 16.7:1 under protanopia, deuteranopia and tritanopia simulation, with APCA Lc 97 on ink. Use it for **one element per tile**, normally the category chip (border and text). Dates and other metadata stay white at 72%, so the accent marks a single thing and doesn't compete with the title.
- Volt on mint is about 1.1:1, so on hover or focus (when the tile flips to Mint) the accent must flip to ink. The hover rule already does this.
- **Lines** are the tile's text color at 20% (dark tiles) or 12% (light tiles). Lines are decorative. Every control also has a visible label and a focus ring.

**Category → tile color.** Used **only on the article page header**, where there's exactly one category per page. On the home page, tiles are colored by position, not category (see Step 6), so the page's colors don't depend on whatever was published last.

| Category | Tile |
|---|---|
| Child safety | blush |
| Deepfakes | amber |
| Executive branch | slate (white text, no muted text: white 72% is 3.5:1) |
| Lawmakers | volt |
| National security | sand (ink text) |
| States | sage (ink text only; mint is reserved for the topbar and hover) |

**Pills (category chips) are neutral and outlined** (decided Oct 2, after reviewing CSIS, Brookings, Lawfare, Rest of World, Quanta, Tech Policy Press, GOV.UK and Carbon):
- No fill; a 1px border and the text in `tile/accent`: **volt on Ink and Navy, ink on every other tile**, including Mint hover and category headers.
- UI/Label 14, weight 500. The date beside the pill is `tile/fg-muted`.
- **Category color lives only in the article header tile.** Signal is not a header color.
- Revisit colored pills only with about 15+ posts AND category pages to filter by.
- **Headers where all text must be full strength (no muted):** Slate (white text; white 72% is 3.5:1) and Sage (ink text; ink 72% is 4.3:1).


> **Review note (Oct 2):** all text in the Figma frames is placeholder. Critique layout, type, color and components, not the copy or facts.

> **Link color (Oct 2, final): blue `#0060C4`**, a new primitive `color/blue`.
> - It has no red component, so it reads as a true blue, not violet. (Cobalt `#1F3FE0` read as purple.)
> - Contrast: 6.1:1 on Paper, 5.1 on Stone, 5.2 on Mint, and 3.3:1 against ink body text.
> - Still always underlined.
> - Hover: navy with a 2px underline.
> - On Sand, Amber and Blush, links are ink with an underline.

> **Color = destination (Oct 2, Joey's revision):**
>
> | Color | Means |
> |---|---|
> | Mint | site chrome (topbar, footer wordmark, hover) |
> | Amber | the bill tracker (the Home widget band, the "Bills in this article" rail cap) |
> | Signal | the newsletter band (above every footer) |
> | Ink | the featured tile and the footer |
> | Everything else | category headers |
>
> - Category colors now: Deepfakes → navy. Amber and signal are no longer category colors.
> - National security → sand (decided Oct 2). Rail: docked from 1080 to the window edge, with 40 padding inside (decided Oct 2).

## 3. Figma setup (about 45 minutes)

### Step 1: File and frames
- Desktop frame **1440 × 900** (1rem = 16px, matching Eclipse's formula) and mobile **390 × 844**.
- **No column layout grid.** Add two grids, both hidden by default:
  * 2 columns, gutter 0, margin 0 (halves);
  * 4 columns, gutter 0, margin 0 (quarters).
- Everything is built from auto-layout tiles.

### Step 2: Primitive variables
Collection **Primitives** (one mode):
- **color/**: the 12 colors in §2, plus `white` and `ink` at 72%, 20% and 12% as their own variables (Figma variables can't apply opacity to another variable).
  * Scope: fills and strokes only.
- **space/**: 4, 8, 16, 24, 32, 40, 56, 80, 140.
  * Scope: gap and padding.
- **size/**:
  * `tile-min` 280 (17.5rem);
  * `band-banner` 432;
  * `band-feature` 432;
  * `band-full` 900 (100vh at 1440 × 900).

### Step 3: The Tile collection (this is the key step)
Collection **Tile**, with one **mode per tile color**: Paper, Stone, Ink, Navy, Signal, Mint, Blush, Volt, Amber, Sand. Variables:

| Variable | Paper / Stone / Mint / Blush / Volt / Amber / Sand | Ink / Navy | Signal |
|---|---|---|---|
| `tile/bg` | the color | the color | signal |
| `tile/fg` | ink | white | ink |
| `tile/fg-muted` | ink 72% | white 72% | ink (no muted) |
| `tile/accent` (one element per tile, normally the chip) | ink | volt | ink |
| `tile/line` | ink 12% | white 20% | ink 20% |
| `tile/hover-bg` | mint (Mint tile: volt) | mint | mint |

Bind every tile and its children to `tile/*`, never to primitives. To recolor a tile, select it and change the **Tile mode** in the right panel; everything inside follows.

In code this becomes `[data-tile="navy"] { --tile-bg: …; --tile-fg: … }`, so design and build stay one-to-one.

### Step 4: Text styles
Use **Switzer**: Medium (500) for headings, Regular (400) for text. Monument Grotesk is a paid ABC Dinamo font; Switzer is the closest free neo-grotesk.

Desktop values; create "Mobile/" versions with the ≤ 767 sizes in §1.3:

| Style | Size / line | Weight | Tracking |
|---|---|---|---|
| Display/Wordmark | 180 / 162 | 500 | −5% |
| Display/H1 | 90 / 90 | 500 | −4% |
| Display/H2 | 66 / 66 | 500 | −3.5% |
| Display/H3 | 38 / 42 | 500 | −3% |
| Heading/H4 | 24 / 31 | 500 | −2% |
| Heading/H5 | 20 / 28 | 500 | −1.5% |
| Text/Large | 24 / 31 | 400 | −1.5% |
| Text/Medium | 22 / 29 | 400 | −1% |
| **Text/Article** (new, for long reading) | 20 / 32, paragraph spacing 24 | 400 | 0 |
| Text/Regular | 16 / 22 (140%) | 400 | 0 |
| Text/Small | 14 / 20 | 400 | +0.5% |
| UI/Nav | 18 / 20 | 500 | −0.5% |
| UI/Label | 14 / 20 | 500 | +0.5% |

Tracking values are explained in Step 4a. Treat them as starting points to check by eye, not as measurements.

### Step 4a: Letter spacing with Switzer Variable
Switzer Variable has only a **weight axis (100–900), not an optical-size axis**. The font doesn't tighten itself at large sizes the way Monument's display cuts do, so the tracking has to be set by hand, per size. Rules:

1. **Track in percent in Figma, and in `em` in code. Never in px.** Figma's −3% is CSS `letter-spacing: -0.03em`. Em-based tracking scales with the fluid root size. A px value would be right at 1440 and wrong at every other width.
2. **The bigger the text, the tighter.** The default spacing is drawn for text sizes and looks loose at display sizes. The scale above runs from −5% at 180px down to 0 at 16–20px and +0.5% at 14px. Small text needs a little air, not less.
3. **Start about 0.5–1% tighter than Eclipse's numbers at display sizes.** Eclipse uses a flat −3% on every heading, tuned for Monument Grotesk. Switzer's default spacing is looser at large sizes, so −3% on Switzer at 90px still looks a bit open. That's why H1 starts at −4% and the wordmark at −5%. This is my judgment from the two typefaces' builds, not a measurement, so check it (rule 7).
4. **Long-form text stays at 0.** Text/Article and Text/Regular are 0. Negative tracking on 1,500 words slows reading and makes letter pairs like "rn" and "m" harder to tell apart. Eclipse's −2% on body text only works because its paragraphs are two lines long.
5. **Heavier weight means slightly tighter.** The table assumes 500 for headings. If you use 600 for a heading, take off another 0.5%. If you use 400 at display size, add back about 0.5%.
6. **Don't change kerning.** Leave `font-kerning: normal` and the default ligatures on. For the roll-call numbers, turn on tabular figures (`font-variant-numeric: tabular-nums`) so "312" and "282" line up in the stat tiles. Check in Figma's OpenType panel (Type details → Number) that Switzer offers tabular figures. If it doesn't, leave it off.
7. **How to check:** set the real worst cases at each display size:
   - "AI in Congress" (the "AI" pair and "in");
   - "Rep. Bilirakis Introduces Bill to Prohibit AI-Generated Child Pornography" (long, with "il", "li", "rn");
   - "Comparing the AI Policies of the Biden and Trump Administrations".

   Zoom to 100% and squint. If letters touch, especially "rn", "il" and "ll", go back 0.5%. If the words look like separate letters, tighten by 0.5%.
8. **Accessibility:** WCAG 1.4.12 requires that the layout survives users overriding letter spacing to 0.12em. Negative tracking is allowed, but headings must not sit in fixed-height or overflow-hidden boxes, or that override will clip them. In Figma, keep text layers as "auto height" inside auto-layout tiles. Claude Code gets the same rule.

### Step 4b: Line height, vertical rhythm and other type details

**Line height: set it in percent in Figma and unitless in CSS. Never "Auto".** Figma's "Auto" uses Switzer's built-in metrics (about 130%) and silently changes the moment you change the size. Percent and unitless values follow the font size through the Mobile styles and the fluid root.

| Style | Line height | Why |
|---|---|---|
| Display/Wordmark | 90% (`0.9`) | One line, so line height only affects the box. 0.9 lets the bottom of the type sit closer to the frame edge, like Eclipse's footer crop. |
| Display/H1, H2 | 100% (`1`) | Multi-line headlines read as one block. Switzer's ascenders and descenders don't collide at 1.0 at weight 500, but check "Ég" and "jy" pairs once. |
| Display/H3 | 110% (`1.1`) | Two- or three-line story titles need a little more air. |
| Heading/H4 | 130% (`1.3`) | |
| Heading/H5 | 140% (`1.4`) | |
| Text/Large, Medium | 130% (`1.3`) | Short intro and dek lines only, two to four lines at most. |
| **Text/Article** | **160% (`1.6`)** | Long reading. At 20px that's 32px. Don't go below 1.5 (and WCAG 1.4.8 asks for at least 1.5). |
| Text/Regular | 140% (`1.4`) | Eclipse uses 1.35. 1.4 is kinder for notes and source lists. |
| Text/Small, UI/Label | 143% (`1.43` = 20/14) | |
| UI/Nav | 110% (`1.1`) | A single line inside a row that's 44px or taller, so the row provides the target size. |

**Vertical trim** (makes the 40px padding look like 40px):
- With 100% line height, the top of a 90px headline sits about 15px below the tile's padding edge, because of the space inside the line box above the capitals. Eclipse lives with that. You can do better.
- In Figma, select each display text layer and set **Vertical trim → Cap height to baseline** (Type details → Basics). The capitals then touch the 40px padding line.
- In code, use `text-box: trim-both cap alphabetic` on display styles only. Chrome and Safari support it; where it's unsupported, the text just has a little extra space above it, so it's safe as an enhancement.
- Never trim body text. It collapses the gap between paragraphs.

**Paragraph spacing:**
- Text/Article: **24px** (0.75em of the line height) between paragraphs; headings 1.6em above and 0.6em below. Spacing above should be larger than below, so a heading sits with the text it introduces.
- In Figma, set this with the text style's Paragraph spacing, not empty lines.

**Line length:**
- Text/Article: **max 680px (~68ch)**.
- Display headings get a max width so they wrap into balanced blocks: H1 at most 14ch, H2 at most 18ch, H3 at most 22ch. Eclipse does this with its `maxwidth-*` classes.
- In code, add `text-wrap: balance` on headings and `text-wrap: pretty` on paragraphs (no single-word last lines).

**Weights:** use only **400 and 500**. Switzer Variable can do any weight, but two weights is what makes the Eclipse look calm. Use 600 only where you need emphasis on dark tiles, and never set a weight the font can't draw: Figma will fake it.

**Italic:** use the Switzer Variable Italic file for `<em>` in articles. Never let the browser fake a slanted roman. That means loading the italic file in `next/font/local`, which R2 already does.

**Links in text:**
- `text-decoration-thickness: 0.06em` (about 1px at 18–20px);
- `text-underline-offset: 0.18em`, so the underline clears the descenders;
- `text-decoration-skip-ink: auto`.
- The underline stays at all times. On hover, only the color changes.

**Numbers:** use tabular figures in stat tiles and dates in lists (see 4a, rule 6). Keep proportional figures in running text.

**Minimum sizes:**
- Body text is never under 16px on mobile. Text/Article on mobile is 18 / 29 (160%).
- No text anywhere is under 12px, and 12px only for footnote-level labels.

**Code mapping:** each text style becomes one utility class with `font-size` (rem), `line-height` (unitless or rem), `letter-spacing` (em) and `font-weight`. For example, Display/H1 is `font-size: 5.625rem; line-height: 1; letter-spacing: -0.04em; font-weight: 500; text-wrap: balance`, and Text/Article is `font-size: 1.25rem; line-height: 1.6; letter-spacing: 0; max-width: 42.5rem` with `p + p { margin-top: 1.5rem }`.

**Text/Article** is the one style Eclipse doesn't have. Its body text is short marketing lines; yours is 1,500-word analysis. Keep the article column at 640–680px inside its tile.

### Step 5: Components (build in this order)
1. **Tile** (auto layout, vertical):
   - padding 40 on every side; fill `tile/bg`; stroke `tile/line` 1px inside, **right and bottom only**;
   - properties: `size` = Full / Half / Quarter; `top` = 40 / 80 / 140; `state` = Default / Hover (Hover swaps the fill to `tile/hover-bg`).
   - Prototype: hover → Hover, Smart Animate, 300ms ease-out.
   - Add a **Focus** state too: a 2px `tile/fg` inner outline (Eclipse has none; you need it).
2. **Action row:** a full-width row inside a tile (top line `tile/line`, height 96, padding 0 40), with a label in UI/Nav on the left and a 32px → on the right. Variant: external ↗.
3. **Nav:** the logo plus a 2-column grid of links with lines above them, 40 padding, using your existing pattern restyled with UI/Nav.
4. **Stat block:** a number in Display/H2 and a label in Text/Small `tile/fg-muted`, 80 above.
5. **Story tile:** Tile with category chip, date (UI/Label, muted), title (Display/H3), and an action row at the bottom. Include an optional dek (Text/Regular). Its Tile mode is set by where it sits (Paper in the home grid and in Related), and its Hover/Focus variant is Mint mode.
6. **List tile:** the "Backed by investors" pattern. A Half tile with the heading in Display/H3 next to a Half tile with a plain list.
7. **Footer:** an Ink tile with Display/Wordmark "AI in Congress" in mint, cropped by the frame's bottom edge, and small mint links ↗.

### Step 6: Compose the two pages (frames only, no new components)

**Home:**
This is built for what the site actually is: about six analyses, with a reader who's judging the work in 30 seconds. It is not a newsroom front page.

1. **Statement band, Mint — REVISED (Oct 2): it leads with the bill data, and the positioning h1 is cut.**
   - **Why the h1 went:** the logo "AI in Congress" already names the topic. The about band and the nav name cover authorship.
   - **The band, top to bottom:**
     * the nav;
     * the `<h1>` "AI bills in the 119th Congress", in Display/H3, sentence case, with no date;
     * four quarter tiles at the full grid width, each with its number in **Display/H1** (the numbers are the hero) and its label in Text/Regular (Introduced / Reported by committee / Passed one chamber / Became law). **No dividers.** Each stat starts exactly on its quarter line, and that alignment carries the structure. Rule: lines mark things you can click (tiles, action rows); stats aren't clickable, so they get no lines;
     * a full-width action row, "Open the bill tracker", with "Congress.gov · updated [date]" on its right side before the →.
   - The original spec below is superseded wherever it conflicts.

   *Original:* **Statement band, Mint** (the nav sits inside it; about 480 tall at 1440):
   - the positioning line as the page's visible `<h1>` in Display/H1, at most 14ch wide (e.g. "How Congress is legislating artificial intelligence.");
   - below it, one Text/Regular line: "Independent analysis by Joey Holzman · Updated October 2026".
   - Add the roll-call numbers here ONLY once they're real, sourced counts. Never use illustrative numbers.
   - **Bill tracker strip, inside the Mint band at its bottom.** Ship it only once the tracker page exists.
     * A row of 4 quarter tiles showing the bill pipeline for the 119th Congress: Introduced / Advanced from committee / Passed a chamber / Enacted.
     * Each tile is a Stat block: the number in Display/H2 and the label in Text/Small at ink 72%.
     * Below the row, one full-width action row, "Open the AI bill tracker →", with "Congress.gov data, updated [date]" in UI/Label at ink 72%.
     * Lines are ink 12%.
     * The whole Mint band must stay within one viewport height (about 820 at 1440 × 900); otherwise the sticky slide-over covers the stats before anyone sees them.
     * The h1 stays in ink; signal on mint is about 3:1, too close to the large-text floor.
     * Don't use a separate white band or a black pill button.
2. **Featured analysis, Signal, full width.** One story, one link. Use a `featured: true` frontmatter flag so you choose it, rather than whatever is newest.
   - Chip and date at the top.
   - The title in Display/H2 in the left half, and the dek in Text/Large in the right half, aligned to the bottom.
   - An ink action row "Read the analysis →" across the full width at the bottom.
   - All text in **full ink** (5.8:1).
   - *Current frame:* Ink, with text in the left half and the post image in the right half; the chip in volt and the date in white 72%.
3. **Analysis grid, Paper** (no images; the featured tile is the only image on Home):
   - **Section header row:** a full-width Paper row, padding 40, with a visible `<h2>` "More analysis" in Display/H4 and a bottom line. Tile titles are then `<h3>`.
   - **Every other article as a half tile**, 2 per row, newest first, excluding the featured post. Each tile, top to bottom:
     * chip (ink border and text) and date (UI/Label, `tile/fg-muted`); if the post was updated, show "Updated Sep 12, 2026" instead of the publish date;
     * 80 gap, then the title in Display/H3, max about 22ch;
     * 16 gap, then the **dek in Text/Medium, full `tile/fg`**, max 48ch. Keep deks to 160 characters or fewer by editing, not with CSS line-clamp;
     * an action row pinned to the bottom ("Read the analysis →"), which is **decorative** (`aria-hidden`).
   - **One link per tile:** the title is the only `<a>`, and its `::after` stretches over the whole tile. The chip is not a link. A screen reader's links list then reads five distinct titles instead of five "Read the analysis" links.
   - Lines are ink 12%: every tile gets a bottom line, and only the left column gets a right line. Hover and `:focus-within` switch the tile to Mint (300ms; instant under reduced motion). The focus ring is a 2px ink outline inset 8px, on `:focus-visible` only.
   - **Odd count:** the last cell is a Stone "About the author" tile: name, one sentence on who you are, and email ↗ and LinkedIn ↗ as action rows. Don't use an "All articles" tile; the grid already is all articles.
   - **Mobile:** tiles stack full width, with padding 24, a 56 gap above the title and the Mobile/ text styles.
4. **About band, Sand, full width.** This replaces the odd-count "About the author" cell.
   - Sand is the one palette color that's neither a category nor reserved, and it separates clearly from both Paper above and the Ink footer below.
   - Built as two half tiles (the List tile pattern):
     * **Left half:** the `<h2>` "About the author" in UI/Label at ink 72%; 80 below it, "Joey Holzman" in Display/H3; under that, two or three sentences in Text/Large on who you are and why you write this. Use only real credentials.
     * **Right half:** three full-width action rows: "Email ↗", "LinkedIn ↗" and "Résumé (PDF) ↗". Hover flips each row to Mint.
   - Nothing goes between the grid rows. Two rows of two read as one grid.
5. Footer: **Ink**.

**Cut for now:** the separate "All articles" list. With six posts it repeats the whole page. Bring back an index page and an "All articles →" tile once there are about 12.

Band rhythm: mint, then signal, then paper, then ink. Never stack ink and navy: they're 1.1:1 apart and merge into one dark mass.

**Article (revised Oct 2):**
1. **Topbar, Mint**, nav only. It always has a 1px ink 12% bottom line, because a Volt (Lawmakers) header beside Mint is 1.0:1 and the two would merge.
2. **Header**, mirroring the Home featured tile so the click feels like the tile opening:
   - **Left half:** in the category color (Tile mode = category). Pill and date at the top; the `<h1>` in Display/H2, at most about 18ch; the dek in Text/Large aligned to the bottom.
   - **Right half:** the post image, full bleed, cropped to the header's height. The image never sets the height.
   - Height: at most 820 at 1440.
   - On **Signal and Sage** headers all text is full ink, never ink 72% (4.2:1 and 4.3:1). On **Navy**, text is white and muted text is white 72%.
**Reading layout (revised): the text is centered on quarters 2–3, and quarter 4 is the utility column.** Quarters at 1440 are 0 / 360 / 720 / 1080.
- **Text column:** 400–1040 (640 wide, centered on the page), Text/Article 20/32.
- **Utility column (quarter 4):** 1120–1400 (280 wide), sticky at top 40. Quarter 1 is left as margin.
  * **REVISED: the rail is a docked Stone tile.** It runs the full quarter, 1080 to the right viewport edge (1440), and its **height hugs its content**, so it's never a full-length column.
  * Inside, the padding is 40, so the content sits at 1120–1400 and lines up with the nav.
  * Sticky at **top 0**, so it docks to the top and right edges of the window like every other tile.
  * No border at first. If Stone washes out on a low-quality screen, add a 1px ink 12% line on its left and bottom edges.
  * Text: ink, with metadata in ink 72% (passes on Stone).
  * Below 1280, it becomes a full-width Stone band before the body.
  * The action-row lines run 1120–1400.
  * If the rail is taller than the viewport minus 80 (about 3+ bills), it is not sticky; it scrolls with the page, so the lower bills can still be reached.
- **Rule:** reading content (meta, notes, body, sources) sits on the text column; tiles (header, related, about) stay full-bleed halves.

3. **Meta row, Paper:** "By Joey Holzman · Published … · Updated … · 8 min read · Image: [credit]" in UI/Label at ink 72%, starting at the text column's left edge (400). Under it, aligned with the utility column, a "Copy article link" action with its top line.
4. **Editor's notes** (only if any): a full-width Stone band, with the content on the text column. "Update · Oct 1, 2026" in UI/Label at full ink, then the note in Text/Regular.
5. **Body, Paper:**
   - **Text column:** Text/Article; body `<h2>` in Display/H3, 64 above and 24 below; links in blue `#0060C4`, underlined. Charts may break out to 400–1400 (quarters 2–4) when they need the width. The rail is sticky, so the chart sits below the rail's end or the rail ends before it.
   - **Utility column:** "Bills in this article", then for each bill: number (UI/Label), short title (H5), sponsor and status in Text/Small using the funnel's stage words plus "as of [date]", and an action row "Track on Congress.gov ↗". No background and no vertical line.
   - **Below 1280:** the utility column moves inline, after the notes and before the body, and the text column centers at a 680 max width.
   - **Body type**, all full ink on Paper:

     | Element | Style |
     |---|---|
     | Paragraph | Text/Article 20/32, weight 400, 0 tracking, 24 after |
     | Body h2 | Display/H3 38/42, weight 500, −3%; 64 above, 24 below |
     | Body h3 | H4 24/31, weight 500, −2%; 40 above, 12 below |
     | Lists | Text/Article; 24 indent; 12 between items; markers ink 72% |
     | Block quote (bill text, testimony) | Text/Article, 2px ink left rule, 24 left padding, not italic |
     | Strong | weight 600 (500 is too close to 400) |
     | Emphasis | Switzer Italic 400 |
     | Link | blue `#0060C4`, 1px underline, 3 offset; hover: navy with a 2px underline |
     | Figure caption | Text/Small 14/20, ink 72%, 12 below the figure |

     - No drop cap, no justified text, no hyphenation.
     - Text containers have no fixed heights (WCAG 1.4.12 text spacing).

6. **Sources:** on the text column. "Sources" in Display/H3, then a numbered list where each item is ONE link in blue, separated by ink 12% lines, and then a second "Copy article link" action row.
7. **More analysis:** a header row, then **2 half tiles** using the Home grid's tile component, same category first.
8. **About band, Sand**: the same as Home, because readers arriving from a shared link never see Home.
9. **Footer, Ink.**

### Step 7: Check before handing it to Claude Code
- Every text layer is bound to `tile/fg`, `tile/fg-muted` or `tile/accent`. No raw colors (use Selection colors to spot any).
- No white text under 24px on Signal or Sage tiles. No orange text under 24px on light tiles.
- The mobile frame uses the Mobile/ text styles, and halves and quarters stack to full width.
