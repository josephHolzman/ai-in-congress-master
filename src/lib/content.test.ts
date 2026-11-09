import { readdirSync, readFileSync } from "node:fs";
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
import {
  billDetailSchema,
  getTrackerBill,
  getTrackerBills,
  getTrackerIndex,
  getTrackerMeta,
} from "@/lib/tracker";
import trackerConfig from "../../content/tracker/config.json";

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

test("the tracker data validates and holds every watchlist bill", () => {
  const ids = getTrackerBills().map((bill) => bill.id);
  for (const id of trackerConfig.watchlist) expect(ids).toContain(id);
  expect(getTrackerBill("s146-119")?.stage).toBe(5);
  expect(getTrackerMeta().included).toBe(ids.length);
});

test("the split files (T8) hold every tracker bill and nothing else", () => {
  const ids = getTrackerBills().map((bill) => bill.id);
  expect(getTrackerIndex().map((bill) => bill.id)).toEqual(ids);
  const dir = "public/data/tracker/bills";
  expect(readdirSync(dir).sort()).toEqual(ids.map((id) => `${id}.json`).sort());
  for (const id of ids) {
    const detail = billDetailSchema.parse(
      JSON.parse(readFileSync(`${dir}/${id}.json`, "utf8")),
    );
    expect(detail.id).toBe(id);
  }
});
