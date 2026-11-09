import fs from "node:fs";
import path from "node:path";
import { evaluate } from "@mdx-js/mdx";
import matter from "gray-matter";
import * as runtime from "react/jsx-runtime";
import { z } from "zod";
import { useMDXComponents } from "@/mdx-components";
import { getBills } from "@/lib/bills";
import { CATEGORIES, type Category } from "@/lib/categories";
import { isoDate } from "@/lib/iso-date";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const WORDS_PER_MINUTE = 230;

// Strict, so a misspelled optional field fails instead of vanishing.
export const postFrontmatter = z.strictObject({
  title: z.string().min(1),
  description: z.string().min(1),
  date: isoDate,
  category: z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]),
  author: z.string().min(1),
  updated: isoDate.optional(),
  featured: z.boolean().optional(),
  draft: z.boolean().optional(),
  bills: z.array(z.string()).default([]),
  editorNotes: z
    .array(
      z.strictObject({
        type: z.enum(["update", "correction"]),
        date: isoDate,
        text: z.string().min(1),
      }),
    )
    .optional(),
  sources: z
    .array(
      z.strictObject({
        label: z.string().min(1),
        href: z.url({ protocol: /^https$/ }),
      }),
    )
    .optional(),
  image: z
    .strictObject({
      src: z.string().min(1),
      alt: z.string().min(1),
      credit: z.string().optional(),
    })
    .optional(),
});

export type Post = z.infer<typeof postFrontmatter> & {
  slug: string;
  body: string;
  readingMinutes: number;
};

/** Parses frontmatter; throws with the file name and the failing field. */
export function parseFrontmatter<T extends z.ZodType>(
  schema: T,
  file: string,
  source: string,
) {
  const { data, content } = matter(source);
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `${file}: invalid frontmatter\n${z.prettifyError(result.error)}`,
    );
  }
  return { data: result.data as z.infer<T>, content };
}

function readPost(name: string): Post {
  const file = `content/posts/${name}`;
  const { data, content } = parseFrontmatter(
    postFrontmatter,
    file,
    fs.readFileSync(path.join(POSTS_DIR, name), "utf8"),
  );
  try {
    getBills(data.bills);
  } catch (error) {
    throw new Error(`${file}: ${(error as Error).message}`);
  }
  return {
    ...data,
    slug: name.replace(/\.mdx$/, ""),
    body: content,
    readingMinutes: Math.ceil(
      content.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE,
    ),
  };
}

// Read once at import, so a bad post fails the build wherever posts are used.
const posts = fs
  .readdirSync(POSTS_DIR)
  .filter((name) => name.endsWith(".mdx"))
  .map(readPost)
  .sort((a, b) => b.date.localeCompare(a.date));

/** Newest first; drafts are excluded in production. */
export function getAllPosts() {
  return process.env.NODE_ENV === "production"
    ? posts.filter((post) => !post.draft)
    : posts;
}

export function getPost(slug: string) {
  return getAllPosts().find((post) => post.slug === slug);
}

/** featured: true, else the newest post getAllPosts() returns. */
export function getFeaturedPost() {
  const all = getAllPosts();
  return all.find((post) => post.featured) ?? all[0];
}

/** Compiles an MDX body (frontmatter already stripped) with mdx-components. */
export async function compileMdx(body: string) {
  const { default: Content } = await evaluate(body, {
    ...runtime,
    useMDXComponents,
  });
  return Content;
}
