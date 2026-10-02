import type { TileMode } from "@/components/Tile";

// Keyed by the exact label used in post frontmatter (A4).
export const CATEGORIES = {
  "Child safety": {
    label: "Child safety",
    slug: "child-safety",
    headerMode: "blush",
  },
  Deepfakes: { label: "Deepfakes", slug: "deepfakes", headerMode: "navy" },
  "Executive branch": {
    label: "Executive branch",
    slug: "executive-branch",
    headerMode: "slate",
  },
  Lawmakers: { label: "Lawmakers", slug: "lawmakers", headerMode: "volt" },
  "National security": {
    label: "National security",
    slug: "national-security",
    headerMode: "sand",
  },
  States: { label: "States", slug: "states", headerMode: "sage" },
} as const satisfies Record<
  string,
  { label: string; slug: string; headerMode: TileMode }
>;

export type Category = keyof typeof CATEGORIES;
