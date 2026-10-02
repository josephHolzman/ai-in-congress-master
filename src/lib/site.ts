export const SITE_LIVE = process.env.SITE_LIVE === "true";
export const SITE_URL = process.env.SITE_URL || "#";
export const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "#";

// Topbar and footer share these. Row-major: the first three fill row 1.
export const NAV_LINKS = [
  { label: "Articles", href: "/" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Joey Holzman", href: PORTFOLIO_URL, external: true },
  { label: "Bill Tracker", href: "/tracker" },
  { label: "Accessibility", href: "/accessibility" },
];
