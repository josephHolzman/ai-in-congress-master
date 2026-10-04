export const SITE_NAME = "AI in Congress";
export const SITE_LIVE = process.env.SITE_LIVE === "true";
export const SITE_URL = process.env.SITE_URL || "#";
export const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "#";

// Topbar and footer share these. DOM order is the mobile visual (and tab)
// order; from md the external link is placed in column 3 of row 1.
export const NAV_LINKS = [
  { label: "Articles", href: "/" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Bill Tracker", href: "/tracker" },
  { label: "Accessibility", href: "/accessibility" },
  { label: "Joey Holzman", href: PORTFOLIO_URL, external: true },
];
