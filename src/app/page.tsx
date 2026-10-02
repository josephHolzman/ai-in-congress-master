import Image from "next/image";
import Link from "next/link";
import { ActionRow } from "@/components/ActionRow";
import { PostMeta } from "@/components/PostMeta";
import { PostTile } from "@/components/PostTile";
import { SiteEnd } from "@/components/SiteEnd";
import { StickyFit } from "@/components/StickyFit";
import { Tile } from "@/components/Tile";
import { Topbar } from "@/components/Topbar";
import { getBillStats } from "@/lib/bills";
import { formatDate } from "@/lib/dates";
import { getAllPosts, getFeaturedPost } from "@/lib/posts";

export default function Home() {
  const stats = getBillStats();
  const featured = getFeaturedPost();
  const rest = getAllPosts().filter((post) => post !== featured);
  const statItems = [
    { label: "Introduced", value: stats.introduced },
    { label: "Reported by committee", value: stats.reported },
    { label: "Passed one chamber", value: stats.passedOneChamber },
    { label: "Became law", value: stats.becameLaw },
  ];

  return (
    <>
      <StickyFit />
      <Topbar variant="home">
        {/* Trim only the top: Figma's 24 below is from the untrimmed box. */}
        <h1 className="mt-(--statement-top) type-display-h2 [text-box:trim-start_cap_alphabetic]">
          See how Congress is handling AI policy.
        </h1>
      </Topbar>
      <main id="main" tabIndex={-1} className="outline-none">
        {/* Stage 1 of the cascade: slides over the topbar, then sticks. */}
        <Tile
          mode="amber"
          as="section"
          aria-labelledby="bills-heading"
          data-sticky
          className="z-1 focus-within:z-3"
        >
          {/* The stats start tile-top-lg below the header's top (Figma: 140 from
              heading to stats). A min-height, so a wrapped header still grows. */}
          <div className="flex min-h-tile-lg flex-wrap items-baseline justify-between gap-x-stack gap-y-stack-sm">
            <h2 id="bills-heading" className="type-display-h3">
              AI bills in the {stats.congress} Congress
            </h2>
            <p className="type-heading-h5 text-tile-muted">
              {stats.source}, updated{" "}
              <time dateTime={stats.asOf}>{formatDate(stats.asOf)}</time>
            </p>
          </div>
          {/* Columns are true quarters of the band, each inset by the tile
              padding, so the stats line up with the halves below. */}
          <dl className="-mx-tile grid grid-cols-2 gap-y-tile-md md:grid-cols-4">
            {statItems.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-stack-sm px-tile">
                <dt className="order-2 type-heading-h4">{label}</dt>
                {/* Top trim only: Figma's 8 is from the number's line box. */}
                <dd className="order-1 type-display-h1 [text-box:trim-start_cap_alphabetic]">
                  {value.toLocaleString("en-US")}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-tile-lg">
            <ActionRow label="Open the bill tracker" href="/tracker" />
          </div>
        </Tile>

        {/* Stage 2: everything from here down slides over the bill band. */}
        <div className="relative z-2">
          <div className="grid md:min-h-(--band-featured) md:grid-cols-2">
            <Tile
              mode="ink"
              interactive
              className="relative flex flex-col justify-between gap-tile-md"
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
              <div>
                <p className="max-w-(--dek) type-heading-h4">
                  {featured.description}
                </p>
                <div className="mt-stack">
                  <ActionRow label="Read more" decorative />
                </div>
              </div>
            </Tile>
            {/* The image fills whatever height the text tile sets. */}
            <div className="relative aspect-video bg-stone md:aspect-auto">
              <Image
                src={featured.image?.src ?? "/images/placeholder.svg"}
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
      <div className="relative z-2">
        <SiteEnd />
      </div>
    </>
  );
}
