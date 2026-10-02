# Token log

Every token changed for Eclipse parity, one line each: date · token · old → new · the Eclipse measurement that justified it. Carry these back into Figma.

- 2026-10-02 · E1: tokens created from Part A; no parity changes. See the E1 entry in `progress.md` for the open 768–991 type question.
- 2026-10-02 · E1.1 · carry to Figma · new ≤991 type step (sizes / line heights in px at the 16px root): display-h1 90/90 → 60/60, display-h2 66/66 → 40/40, display-h3 38/42 → 32/36, heading-h4 24/31 → 20/26, heading-h5 20/28 → 16/22.4, text-large 24/31 → 20/26 · Eclipse live at 990 (root 16): h1 3.75rem/1, h2 40/40, h3 2rem/1.15 (36.8; we use 36 to stay ≤ 1024's 36.75), h4 20/26, h5 16/22.4, text-size-large 20/26.
- 2026-10-02 · E1.1 · carry to Figma · new ≤991 sizes held at their 1024 size, rounded down: text-medium 22 → 18, text-article → 18 (28.8), text-regular 16 → 14, text-small 14 → 12, ui-nav 18 → 15, ui-label 14 → 12. Line-height ratios unchanged · not from Eclipse (Eclipse grows text-regular 14 → 15 at 991); this keeps every style from growing as the window narrows.
- 2026-10-02 · E1.1 · carry to Figma · text-article 1.25rem → max(1.25rem, 18px) · an 18px floor; it reads 18 instead of 17.5 between 992 and 1280 (root 14).
- 2026-10-02 · E1.1 · carry to Figma · layout-tile-pad: 24 now starts at ≤991 (was ≤767) · Eclipse pad-medium is 20 at ≤991 (35 at 1024); 24 per Part A, one non-desktop value.
- 2026-10-02 · E1.1 · html font-size calc(-0.125rem + 1.25vw) → max(0.875rem, calc(-0.125rem + 1.25vw)) · identical at a 16px default (1281 14.0125, 1366 15.075, 1440 16); honors a larger browser default (WCAG 1.4.4). Not a Figma change.
- 2026-10-02 · E1.2 · carry to Figma · layout-tile-top-md 80 → 56, layout-tile-top-lg 140 → 80, layout-stack 24 → 16 now start at ≤991 (were ≤767) · stops them growing at the 991 root jump (992 → 991 was 70 → 80, 122.5 → 140, 21 → 24). Eclipse live at 990 grows the same way (top-padding-5 70 → 80; pad-top-large has no ≤991 rule), so our former ≤767 values are used instead.
- 2026-10-02 · E1.2 · carry to Figma · text-small and ui-label 0.875rem → max(0.875rem, 13px), and ≤991 0.75rem → max(0.75rem, 13px) · a 13px floor: they read 13 from about 1350 down (was 12.25 at 992–1280 and 12 at ≤991); line height 18.6 at 13. Not from Eclipse (its text-size-small is 14 → 12.25 at 1280).
- 2026-10-02 · E3 · carry to Figma · added `--spacing-12` (0.75rem, 12 at 1440) · not a parity change: A5 asks for 12 between article list items and no 12 step existed. A7's primitive list should include it.
