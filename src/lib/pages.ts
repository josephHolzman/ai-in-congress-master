import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { isoDate } from "@/lib/dates";
import { parseFrontmatter } from "@/lib/posts";

const pageFrontmatter = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
  updated: isoDate,
});

/** content/pages/<slug>.mdx; render `body` with compileMdx. */
export function getPage(slug: string) {
  const name = `${slug}.mdx`;
  const { data, content } = parseFrontmatter(
    pageFrontmatter,
    `content/pages/${name}`,
    fs.readFileSync(path.join(process.cwd(), "content/pages", name), "utf8"),
  );
  return { ...data, body: content };
}
