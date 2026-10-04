import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@carbon/icons-react";
import { PostMeta } from "@/components/PostMeta";
import { PostTile } from "@/components/PostTile";
import { SiteEnd } from "@/components/SiteEnd";
import { StickyFit } from "@/components/StickyFit";
import { Tile } from "@/components/Tile";
import { Topbar } from "@/components/Topbar";
import { getBillStats } from "@/lib/bills";
import { formatDate } from "@/lib/dates";
import { getAllPosts, getFeaturedPost } from "@/lib/posts";
import { SITE_NAME } from "@/lib/site";

export default function Home() {
  const stats = getBillStats();
  const featured = getFeaturedPost();
  const rest = getAllPosts().filter((post) => post !== featured);
  const statItems = [
    { label: "Introduced", value: stats.introduced },
    { label: "Reported by committee", value: stats.reported },
    { label: "Passed one chamber", value: stats.passedOneChamber },
    { label: "Became law", value: stats.becameLaw, signal: true },
  ];

  return (
    <>
      <StickyFit />
      <Topbar variant="home" />
      <main id="main" tabIndex={-1} className="outline-none">
        <h1 className="sr-only">{SITE_NAME}</h1>
        {/* Not sticky: it slides up over the (sticky) topbar and scrolls on. */}
        <Tile
          mode="paper"
          as="section"
          aria-labelledby="bills-heading"
          className="relative z-1 pb-0 max-md:pb-8"
        >
          <div className="md:flex md:flex-wrap md:items-start md:justify-between md:gap-stack">
            {/* Top trim only, so the cap tops of the heading and (from md) the
                source line both sit on the tile's padding. */}
            <h2
              id="bills-heading"
              className="type-display-h2 [text-box:trim-start_cap_alphabetic]"
            >
              AI bills in the{" "}
              <span className="text-signal">{stats.congress} Congress</span>
            </h2>
            <p className="type-heading-h5 text-tile-muted max-md:mt-stack md:[text-box:trim-start_cap_alphabetic]">
              {stats.source}, updated{" "}
              <time dateTime={stats.asOf}>{formatDate(stats.asOf)}</time>
            </p>
          </div>
          {/* Columns are true quarters of the band, each inset by the tile
              padding, so the stats line up with the halves below. */}
          <dl className="-mx-tile mt-tile-md grid grid-cols-2 gap-y-tile-md max-md:gap-y-32 md:grid-cols-4">
            {statItems.map(({ label, value, signal }) => (
              <div key={label} className="flex flex-col gap-stack-sm px-tile">
                <dt className="order-2 type-heading-h4">{label}</dt>
                {/* Top trim only: Figma's 8 is from the number's line box.
                    Signal only on the number: the label is under 24px (A1). */}
                <dd
                  className={`order-1 type-display-h1 [text-box:trim-start_cap_alphabetic] ${signal ? "text-signal" : ""}`}
                >
                  {value.toLocaleString("en-US")}
                </dd>
              </div>
            ))}
          </dl>
          {/* Full bleed (-mx-tile) and flush on the band's bottom (pb-0), so
              from md the button is exactly the right half, edge to edge.
              Below md a paper strip (pb-8) keeps it off the navy featured
              tile: hover and focus go ink, and ink on navy is 1.12:1. The
              label is paper throughout, so it never computes under 24px. */}
          <div className="-mx-tile mt-tile-md grid md:grid-cols-2">
            <Tile
              mode="signal"
              interactive
              className="relative flex items-center justify-between gap-stack [--tile-hover-bg:var(--color-ink)] [--tile-hover-fg:var(--color-paper)] md:col-start-2"
            >
              <Link
                href="/tracker"
                className="link-stretched type-heading-h4-24"
              >
                Explore the bill tracker
              </Link>
              <ArrowRight size={32} aria-hidden className="size-32 shrink-0" />
            </Tile>
          </div>
        </Tile>

        {/* Scrolls normally, never over the bill band. */}
        <div className="relative z-1">
          <div className="grid md:min-h-(--band-featured) md:grid-cols-2">
            <Tile
              mode="navy"
              interactive
              className="relative flex flex-col justify-between gap-tile-md [--tile-hover-bg:var(--color-amber)]"
            >
              <div>
                <PostMeta post={featured} />
                <h2 className="mt-stack type-display-h2">
                  <Link
                    href={`/posts/${featured.slug}`}
                    className="link-stretched"
                  >
                    {featured.title}
                  </Link>
                </h2>
              </div>
              <div className="flex items-end justify-between gap-stack">
                <p className="max-w-(--dek) type-heading-h4">
                  {featured.description}
                </p>
                <ArrowRight
                  size={48}
                  aria-hidden
                  className="size-48 shrink-0"
                />
              </div>
            </Tile>
            {/* The image fills whatever height the text tile sets. */}
            <div className="relative aspect-4/3 bg-stone md:aspect-auto">
              <Image
                src={featured.image?.src ?? "/images/trump.png"}
                alt={featured.image?.alt ?? ""}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>

          <section aria-labelledby="more-heading" className="bg-paper">
            <h2 id="more-heading" className="sr-only">
              More analysis
            </h2>
            <div className="grid md:grid-cols-2">
              {rest.map((post) => (
                <PostTile
                  key={post.slug}
                  post={post}
                  className="border-b border-tile-line md:odd:border-r md:last:odd:col-span-2 md:last:odd:border-r-0"
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <div className="relative z-1">
        <SiteEnd />
      </div>
    </>
  );
}
