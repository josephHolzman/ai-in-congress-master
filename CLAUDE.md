# CLAUDE.md: AI in Congress

AI in Congress is an independent policy blog analyzing how the U.S. Congress legislates artificial intelligence. It's a portfolio piece: a policy reader (think CSIS) will judge it in about 30 seconds. **Correctness, accessibility and restraint matter more than cleverness.**

Read this file in full before doing anything. Before any UI work, also read:
1. **`docs/build-prompts.md` Part A:** the design spec and the source of truth for values.
2. **`docs/eclipse-audit.md`:** the measured audit of the Eclipse 2024 site (fluid root, type scale, tile padding, band behavior, hover timing) and the reasoning behind each design decision. Use it as the baseline for parity checks. Where it disagrees with Part A, Part A wins.

When this file and a prompt conflict, ask.

---

## 0. Sessions start cold

Every build prompt runs in a fresh, cleared session. **Assume you remember nothing.** All context lives in files:

| File | What it holds |
|---|---|
| `CLAUDE.md` | How to work, the rules, and Progress (which prompts are done) |
| `docs/progress.md` | The handoff log: what each earlier session built, decided, changed and left open |
| `docs/build-prompts.md` Part A | The design spec |
| `docs/eclipse-audit.md` | Eclipse's measurements and the reasoning behind the design |
| `docs/token-log.md` | Every token changed for Eclipse parity |
| The code itself | Run `git status` and list `src/` and `content/` before you start |

**At the start of every session:**
1. Read this file.
2. Read `docs/progress.md`: the latest three entries, plus every entry of the series you're in (E or T). Older entries are history; search them when something refers to them.
3. Confirm that the previous prompt is ticked under Progress. If it isn't, stop and say so.
4. Look at what exists before you write anything.

Never re-scaffold, re-tokenize or recreate a component that already exists. Extend it.

### Handoff log

At the end of every prompt, append one entry to `docs/progress.md`. It's the next session's only memory, so keep it complete and short:

```md
## E<n>: <title> · <YYYY-MM-DD>
- Built: <components, routes, files added>
- Changed: <existing files touched, and why>
- Decisions: <assumptions made, deviations from Part A, token changes (also in token-log.md)>
- Verified: <commands run and results; screenshot folders>
- Open for next prompt: <known issues, TODOs, anything the next session must know>
```

---

## 1. How to work: Karpathy's four principles

These four rules address the most common ways coding agents fail: guessing silently, overbuilding, making edits nobody asked for, and declaring victory without checking. Follow them on every task.

### 1.1 Think before coding
- **State your assumptions before you write code.** If the request can be read two ways, list both and say which one you're taking. If the difference matters, ask.
- **Surface confusion; don't bury it.** If something in the spec, the Figma values or the existing code doesn't add up, say so plainly instead of picking an option quietly.
- **Name the tradeoff.** If a simpler approach than the one requested exists, say so and recommend it before building the complicated one.
- **Read before you write.** Open the files you're about to change, and the components and tokens that already exist. Don't recreate something that's already there.
- **Stop when you're blocked.** A wrong guess that gets built costs far more than a question.

### 1.2 Simplicity first
- **Write the minimum code that solves the stated problem.** No speculative features, no "while I'm here," no configurability nobody asked for.
- **Don't abstract code that's used once.** Write it inline. Extract a component or helper on the third real use, not the first.
- **Don't handle errors that can't happen.** Validate at the boundaries (content files, environment variables, user input) and trust the types inside.
- **If you wrote 200 lines and 50 would do, rewrite it before you hand it in.** The diff should look boring.

### 1.3 Surgical changes
- **Touch only what the task needs.** Don't reformat, rename, re-comment or "improve" neighboring code.
- **Match the existing style,** even where you'd have done it differently.
- **Clean up only your own mess.** Remove things your change made unused. If you notice unrelated dead code or a bug, **mention it in your report**; don't fix it unasked.
- **Every changed line should trace back to the request.** If you can't say why a line changed, revert it.

### 1.4 Goal-driven execution
- **Turn the task into checks you can verify** before you start: "the build passes," "axe reports zero violations on /," "type-display-h2 computes to 66px at 1440."
- **For multi-step work, write a short plan** with a check after each step, and follow it.
- **Loop until the checks pass.** If they can't pass, stop and report exactly what fails and why. Never report "done" on something you haven't verified.
- **Report what you verified and how,** not just what you changed.

---

## 2. The standard: write it like a lazy senior engineer

"Lazy" here means refusing to write code that doesn't need to exist, not cutting corners. The best change is often a smaller one.

- **The platform first.** Use HTML and CSS before JavaScript. A `<details>`, a `<dialog>`, `position: sticky`, `:focus-within` or `text-wrap: balance` beats a component with state.
- **Server components by default.** Add `"use client"` only for real interactivity (the sticky-fit check, the newsletter announcement), and keep those components tiny.
- **No new dependencies without asking.** The approved list:
  * Next.js, React, Tailwind v4;
  * `@next/mdx`, `gray-matter`, `zod`;
  * `@carbon/icons-react`;
  * Playwright, `@axe-core/playwright`;
  * ESLint, Prettier.

  Anything else needs a one-line justification and approval.
- **No state libraries, no UI kits, no CSS-in-JS, no animation libraries.**
- **One way to do each thing:**
  * one Tile component;
  * one ActionRow;
  * one set of tokens;
  * one content loader.

  If you're about to write a second way, use the first.
- **Delete before you add.** If a change can be made by removing code, do that.
- **Boring names, flat folders.** Colocate files with where they're used. No barrel `index.ts` files. No `utils/` junk drawer: a helper lives next to its only caller until it has three.
- **Comments explain why, never what.** Delete comments that restate the code.
- **Types document the shape;** don't repeat it in prose.
- **Small files.** If a component passes about 150 lines, it's probably doing two jobs.

---

## 3. Project facts

- **Stack:**
  * the latest stable Next.js (App Router, `src/`);
  * TypeScript (strict);
  * Tailwind v4, CSS-first, with tokens in `src/app/globals.css`;
  * MDX through `@next/mdx`, with frontmatter via `gray-matter` and validation via `zod`;
  * statically generated.
- **Content** lives in `content/`:
  * `posts/*.mdx`;
  * `bills.json`;
  * `bill-stats.json`.

  - **The posts are Joey's real articles,** imported from the old site. Never edit their prose or "fix" their facts. Lines marked `TODO(joey)` are his to resolve: leave them, and list them in your reports.
  - **No post has an image yet.** The UI falls back to a decorative placeholder (`alt=""`).
  - **`bill-stats.json` holds placeholder numbers** (`placeholder: true`).
  - **All text in the Figma frames is placeholder.** Never hardcode copy in components.
- **Assets:**
  * fonts in `src/fonts/` (Switzer Variable, roman and italic);
  * the logo in `src/assets/brand/`, rendered with `currentColor`;
  * the favicon at `src/app/icon.svg`;
  * the placeholder image at `public/images/trump.png` (temporary; `placeholder.svg`, the flat stone version, is kept for when it goes back).
- **Icons:** `@carbon/icons-react` only: `ArrowRight`, `ArrowLeft`, `ArrowUpRight`, `ChevronDown` (the tracker rows and selects), `ChevronLeft` and `ChevronRight` (the tracker pagination), and `Close` (the tracker search's clear button). Icons are always `aria-hidden`; the text carries the meaning.
- **Pre-launch:**
  * `SITE_LIVE` defaults to false, which sends `noindex` sitewide;
  * the newsletter form doesn't submit.
- **Bill tracker** (`/tracker`, spec in `docs/tracker-spec.md`): a working page built from `content/tracker/` (`bills.json`, `review.json`, `meta.json`, `config.json`, `page.json`), which `scripts/tracker/` fetches from the Congress.gov API. The fetch also writes `content/bill-stats.json` (Home) and `public/data/ai-bills-119.csv`. The article rail's status lines come from the tracker when it has the bill.
  - **Never read `.env.local`.** It holds `CONGRESS_API_KEY`. The scripts read it; you don't open, print or grep it, and the key never goes in a URL, a log, a fixture or a commit.
- **Figma:** file `9DKYbMDVJ43Kt1IDcf0XJS`, with HomeNew `2076:2212` and Article `2075:1532`. Part A, section A1, lists the deliberate deviations from the file.

---

## 4. Design system rules (details in `docs/build-prompts.md`, Part A)

- **Tokens only.** No raw hex, px, font sizes or letter spacing in components. If a value is missing, add a token and say so in your report.
- **Icons size from `--icon-inline` / `--icon-tile` only** (`size-icon-inline`: 1.25em of the label, so the label's type utility goes on the icon's parent; `size-icon-tile`: standalone tile arrows). Every Carbon icon gets `size={32}`; CSS sets the rendered size.
- **Every colored block is a `<Tile mode>`.** Text, muted text and lines read from the tile's variables (`text-tile`, `text-tile-muted`, `border-tile-line`), so a mode change recolors everything inside it.
- **Color means destination:**
  * mint is site chrome and the default hover (nothing on Home uses it any more), except on article pages, where the topbar takes the category header color (with a hairline under it), and on the Home featured tile, which hovers to amber with ink text;
  * signal (orange) is the bill tracker: signal text on Home, the "Explore the bill tracker" button (paper label; it goes ink with paper text on hover and focus) and the rail cap. On /tracker, signal is the h1's "119th Congress" span and the status bar only;
  * amber is the newsletter;
  * navy is the Home featured tile (and the Deepfakes article header);
  * ink is the footer, the tracker button's hover and the Home grid tiles ("More analysis"), which hover to paper with ink text;
  * category colors are for article headers (and the topbar above them) only.
- **Signal is never text below 24px computed, at any width** (3.47:1 on paper).
- **Signal tiles have paper text, and every piece of it is ≥ 24px computed, at any width** (3.47:1; ink reads poorly on signal despite passing WCAG 2). Labels on signal use `type-heading-h4-24`.
- **Secondary text is `text-tile-muted`, never a raw gray** (on /tracker as everywhere).
- **Pills are neutral** (outlined in `tile-fg`). Category color never appears on pills.
- **Type comes from the `type-*` utilities only.** All sizes are in rem, and the fluid root (A6) scales the whole layout.
- **The quarter grid:**
  * columns at 25%, 50% and 75%;
  * a 40 inset inside every tile;
  * reading text on `--measure` (quarters 2–3).

---

## 5. Accessibility (WCAG 2.2 AA): not optional

- Only use text and background pairs from Part A. **No muted text on Sage, Signal or Slate. No small white text on Signal or Amber.** Text on Signal is paper and ≥ 24px only.
- **Structure:**
  * a skip link first;
  * the landmarks `header`, `nav`, `main` and `footer`;
  * one `h1` per page, with no skipped heading levels.
- **Focus:** a visible 2px outline on every interactive element. **Hover is never the only state:** pair `:hover` with `:focus-visible` or `:focus-within`.
- **One link per tile:** the title is the link, stretched over the tile, and the tile arrows are decorative (`aria-hidden`).
- **Targets** are at least 24×24px.
- **External links:** ↗ plus visually hidden "(external site)".
- **Every image needs `alt` text.** The content schema fails the build without it.
- **Sticky elements:**
  * only at 768px wide and up, 640px tall and up, and without reduced motion;
  * never when the element is taller than the viewport;
  * `:focus-within` raises their z-index so focus is never covered.
  * **Exception (T10): the /tracker column header** (`.bill-head`) stays sticky under reduced motion. It's a reading aid, not motion: it doesn't move or animate, it just keeps the column labels in view. It still needs 640px of height, sticks only inside the table, and focused rows and links keep a scroll-margin of its height, so it never covers focus.
- **Reduced motion:** no transitions and no sticky behavior.
- **Without JavaScript,** every page and its content render. **Exception: /tracker** renders only its first 10 bills, with a note linking the full CSV ("The full list needs JavaScript. Download every bill as CSV"), and an opened row links to Congress.gov instead of its details. Rendering all bills and their panels made the page 1.5 MB (T9); the CSV carries every bill for no-JS readers.
- **Reflow:** no horizontal scroll at 320px wide or at 400% zoom. Text spacing overrides must not clip anything.

---

## 6. Visual parity with Eclipse: check it routinely

The visual reference is the archived Eclipse site: **https://web.archive.org/web/20240524202822/https://www.eclipse.xyz/**. This site should scale and render the way that one does. **Start every comparison from the measurements in `docs/eclipse-audit.md`**, then confirm them live in Chrome. The archive can differ from the audit at some widths; when it does, trust the live measurement and note the difference.

- **Check it routinely:** after every prompt that touches tokens, type, layout or components, and whenever something looks off.
- **Use Claude in Chrome.** Open the Eclipse archive and our page (`npm run dev`) in two tabs. At each width (**1440, 1366, 1280, 1024, 991, 768 and 390**), compare:
  * how display and body text scale and shrink across breakpoints (Eclipse's root is fluid, so read `getComputedStyle(document.documentElement).fontSize` on both);
  * tile padding, band heights, line weights and the spacing between elements;
  * how full-bleed blocks, halves and quarters behave as the window narrows;
  * hover transitions (timing and color change) and the sticky slide-over on scroll.

  Read computed styles with JavaScript in both tabs rather than eyeballing screenshots.
- **You may change which primitives and tokens are used to get closer to Eclipse:**
  * adjust a token's value;
  * swap which type or spacing token a component uses;
  * add a breakpoint value;
  * change the fluid root formula.

  Do this when something is **clearly** off: a visible difference in scale, rhythm or proportion, not a 1px nitpick.
- **Limits on that permission:**
  1. **Accessibility and contrast always win.** Never trade a WCAG 2.2 AA requirement for parity. Color pairs stay within Part A.
  2. **Keep our palette and content.** Parity is about scale, spacing, proportion and behavior. It doesn't mean copying Eclipse's colors, copy, logo or images.
  3. **Change tokens, not one-off values.** Fix it in `globals.css` so the change applies everywhere.
  4. **Log every change** in `docs/token-log.md`, one line each: date · token · old → new · which Eclipse measurement justified it. List these changes in your report so Joey can carry them back into Figma.

---

## 7. Verification (do this before every report)

1. `npm run lint` and `npm run build` pass.
2. Playwright screenshots of the pages you changed, at the widths the prompt names, saved to `screens/<prompt>/`.
3. axe has zero violations on the pages you changed.
4. Keyboard walk: the focus order makes sense, every stop is visible, and nothing is hidden under a sticky element.
5. Compare against the Figma frame (use the Figma MCP screenshot if it's connected), and list any mismatch you couldn't resolve.
6. Run the Eclipse parity check (section 6) at the listed widths, and report any token changes you made and logged.

**Report format** (also write it as the handoff entry in `docs/progress.md`):
- what changed (files);
- what you verified (commands and results);
- what's still open, and any assumptions you made.

Keep it short.

---

## 8. Git

- **Don't commit, push or create branches unless asked.** Joey reviews and commits after each prompt.
- Never commit `.env*`, `screens/` or build output.

---

## 9. Commands

<!-- Filled in by E0 once the scripts exist. -->
- `npm run dev`: start the dev server at http://localhost:3000
- `npm run build`: production build (static generation, type check)
- `npm run lint`: ESLint with the Next config
- `npm run test:e2e`: Playwright at 1440, 1280, 1024, 768 and 390 (starts the dev server if one isn't running)
- `npm run test:content`: vitest (content, tracker data, finder and stage logic)
- `npm run tracker:probe`: check the Congress.gov API live and refresh the fixtures
- `npm run tracker:fetch`: incremental tracker refresh (flags: `--full`, `--only <ids>`, `--dry-run`, `--no-sweep`)
- `npm run tracker:backfill`: full sweep from the start of the Congress (about 45–50 min)
- `npm run tracker:rebuild`: re-classify and re-normalize the cached bills with no API calls (after a pattern, topic or excerpt change)

---

## 10. Progress

- [x] E0: scaffold, assets, project setup
- [x] E1: tokens (color, tile modes, type, spacing, layout)
- [x] E1.1: tablet type step, fluid-root floor, hover fade
- [x] E1.2: layout tokens at ≤991, small-text floor
- [x] E2: shell components (Tile, ActionRow, Pill, Topbar, Footer, NewsletterBand)
- [x] E3: content model around the imported articles
- [x] E4: Home (HomeNew)
- [x] E5: Article
- [x] E5.1: Home refinements (nav span + bill band layout)
- [x] E6: mobile first pass
- [x] E6.1: new buttons, single-stage scroll, nav focus order, 991 holds
- [x] E6.2: article image overlap, amber divider under the tracker button
- [x] E6.3: color remap (tracker = signal, newsletter = amber, featured = navy)
- [x] E6.4: smaller display headings (72/52/32 at 1440)
- [x] E6.5: featured band ≤ viewport
- [x] E6.6: heading-h5 18/25.2 (nav links), signal tracker button
- [x] E6.7: no Home statement, bill heading display-h2
- [x] E6.8: paper text on signal, ≥ 24px
- [x] E6.9: article topbar in the header color
- [x] E6.10: root above 1440 = max(1rem, 0.859vw), cap at 2560
- [x] E6.11: icon sizes from --icon-inline (1.25em) and --icon-tile
- [x] T1: Congress.gov API verified, client, probe
- [x] T2: tracker fetch pipeline, data files, stage logic
- [x] T3: tracker page shell and bill table
- [x] T4: tracker finder controls, pagination, empty state
- [x] T5: tracker expanded rows
- [x] T6: tracker wired to Home and the rail, methodology, docs
- [x] T7: daily tracker refresh workflow
- [x] E7: QA pass
- [x] T8: tracker data fixes, topics, excerpts, split files
- [x] T9: tracker load time, lazy panels, caching, 10 per page
- [x] T10: tracker filters menu on phones, sticky column header
- [x] T11: tracker bug sweep
