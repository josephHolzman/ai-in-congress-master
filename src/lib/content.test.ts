import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { getBills } from "@/lib/bills";
import {
  compileMdx,
  getAllPosts,
  parseFrontmatter,
  postFrontmatter,
} from "@/lib/posts";

// Importing posts.ts validates every post; NODE_ENV is "test", so drafts count.
const posts = getAllPosts();

test("all 6 posts validate", () => {
  expect(posts).toHaveLength(6);
});

test("every bill id the posts reference exists", () => {
  for (const post of posts) {
    expect(getBills(post.bills).map((bill) => bill.id)).toEqual(post.bills);
  }
});

test.each(posts.map((post) => post.slug))("%s compiles", async (slug) => {
  const post = posts.find((p) => p.slug === slug)!;
  const Content = await compileMdx(post.body);
  expect(renderToStaticMarkup(createElement(Content))).toContain(
    '<div class="prose-article',
  );
});

test("a post missing a category fails, naming the file and field", () => {
  const source = [
    "---",
    'title: "T"',
    'description: "D"',
    "date: 2025-01-01",
    'author: "A"',
    "---",
    "Body",
  ].join("\n");
  expect(() =>
    parseFrontmatter(postFrontmatter, "content/posts/no-category.mdx", source),
  ).toThrow(/no-category\.mdx[\s\S]*category/);
});
