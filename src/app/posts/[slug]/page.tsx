import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "@carbon/icons-react";
import { Pill } from "@/components/Pill";
import { SiteEnd } from "@/components/SiteEnd";
import { StickyFit } from "@/components/StickyFit";
import { Tile } from "@/components/Tile";
import { Topbar } from "@/components/Topbar";
import { getBills } from "@/lib/bills";
import { CATEGORIES } from "@/lib/categories";
import { formatDate } from "@/lib/dates";
import { compileMdx, getAllPosts, getPost } from "@/lib/posts";
import { Rail } from "./Rail";
import { Title } from "./Title";

// Drafts aren't generated in production, so their slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} · AI in Congress`,
    description: post.description,
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const Body = await compileMdx(post.body);
  const bills = getBills(post.bills);
  const headerMode = CATEGORIES[post.category].headerMode;

  return (
    <>
      <StickyFit />
      <Topbar variant="article" mode={headerMode} />
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Extra bottom padding: the image overlaps the header by that much. */}
        <Tile
          mode={headerMode}
          className="pb-[calc(var(--spacing-tile)+var(--spacing-image-overlap))]"
        >
          <Link
            href="/"
            className="inline-flex min-h-target items-center gap-12 type-text-large text-tile"
          >
            <ArrowLeft
              size={32}
              aria-hidden
              className="size-icon-inline shrink-0"
            />
            All articles
          </Link>
          <div className="mx-auto mt-tile max-w-measure">
            <Pill>{post.category}</Pill>
            <Title>{post.title}</Title>
            <p className="mt-tile type-heading-h4 text-tile">
              {post.description}
            </p>
            <div className="mt-tile-md flex flex-wrap items-center justify-between gap-x-stack gap-y-stack-sm type-ui-nav text-tile max-md:flex-col max-md:items-start">
              <p className="flex items-center gap-12">
                <span
                  aria-hidden
                  className="size-24 shrink-0 rounded-full bg-current"
                />
                {post.readingMinutes} min read
              </p>
              <p>
                By {post.author}, Published{" "}
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated && (
                  <>
                    {" · Updated "}
                    <time dateTime={post.updated}>
                      {formatDate(post.updated)}
                    </time>
                  </>
                )}
              </p>
            </div>
          </div>
        </Tile>

        <div data-tile="paper" className="flow-root pb-tile-lg">
          <div className="-mt-image-overlap px-tile">
            <figure className="mx-auto max-w-measure">
              <div className="relative aspect-[721/438] bg-stone">
                <Image
                  src={post.image?.src ?? "/images/trump.png"}
                  alt={post.image?.alt ?? ""}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {post.image?.credit && (
                <figcaption className="mt-12 type-text-small text-tile-muted">
                  {post.image.credit}
                </figcaption>
              )}
            </figure>
          </div>

          {post.editorNotes && (
            <Tile mode="stone" className="mt-article-gap">
              <div className="mx-auto flex max-w-measure flex-col gap-stack">
                {post.editorNotes.map(({ type, date, text }) => {
                  const label = type === "update" ? "Update" : "Correction";
                  return (
                    <div
                      key={`${type}-${date}`}
                      role="note"
                      aria-label={`${label}, ${formatDate(date)}`}
                    >
                      <p className="type-heading-h5">
                        {label} ·{" "}
                        <time dateTime={date}>{formatDate(date)}</time>
                      </p>
                      <p className="type-text-regular">{text}</p>
                    </div>
                  );
                })}
              </div>
            </Tile>
          )}

          {/* One DOM position for the rail: before the body, moved into the
              last quarter from xl. Both share row 1 there. */}
          <div className="mt-article-gap grid gap-y-article-gap xl:grid-cols-4">
            {bills.length > 0 && <Rail bills={bills} />}
            <article className="px-tile xl:col-span-full xl:row-start-1">
              <div className="mx-auto max-w-measure">
                <Body />
                {/* prose-article: the body's link styles and em rhythm (the
                  heading → list gap and the 12 between items). */}
                {post.sources && (
                  <section
                    aria-labelledby="sources-heading"
                    className="prose-article mt-article-gap border-t border-tile-line pt-tile type-text-article"
                  >
                    <h2
                      id="sources-heading"
                      className="type-display-h3 [text-box:none]"
                    >
                      Sources
                    </h2>
                    {/* Markers hang 1.5em (30 at 20px) outside the text edge. */}
                    <ol className="list-decimal pl-[1.5em] marker:text-tile-muted">
                      {post.sources.map(({ label, href }) => (
                        <li key={href}>
                          {/* An inline box is only the font's 23px content
                              area; the padding takes the target past 24
                              without moving the line. */}
                          <a href={href} rel="noopener" className="py-4">
                            {label}
                            <span className="sr-only"> (external site)</span>
                            <ArrowUpRight
                              size={32}
                              aria-hidden
                              className="ml-4 inline size-icon-inline align-middle"
                            />
                          </a>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            </article>
          </div>
        </div>
      </main>
      <SiteEnd />
    </>
  );
}
