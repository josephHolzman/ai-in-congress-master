import { z } from "zod";

// YAML parses unquoted dates as Date objects at UTC midnight; JSON and quoted
// YAML give strings. Both become YYYY-MM-DD.
export const isoDate = z
  .union([z.date(), z.iso.date()])
  .transform((d) => (typeof d === "string" ? d : d.toISOString().slice(0, 10)));

/** "2026-10-01" → "Oct 1, 2026" */
export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
