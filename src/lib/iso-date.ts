import { z } from "zod";

// YAML parses unquoted dates as Date objects at UTC midnight; JSON and quoted
// YAML give strings. Both become YYYY-MM-DD. Apart from dates.ts so client
// code that formats dates doesn't bundle zod (T9).
export const isoDate = z
  .union([z.date(), z.iso.date()])
  .transform((d) => (typeof d === "string" ? d : d.toISOString().slice(0, 10)));
