import type { Metadata } from "next";
import { SiteEnd } from "@/components/SiteEnd";
import { Tile } from "@/components/Tile";
import { Topbar } from "@/components/Topbar";
import { formatDate } from "@/lib/dates";
import { getPage } from "@/lib/pages";
import { compileMdx } from "@/lib/posts";

const page = getPage("accessibility");

export const metadata: Metadata = {
  title: `${page.title} · AI in Congress`,
  description: page.description,
};

export default async function AccessibilityPage() {
  const Body = await compileMdx(page.body);
  return (
    <>
      <Topbar variant="article" current="/accessibility" />
      <main id="main" tabIndex={-1} className="outline-none">
        <Tile mode="paper">
          <div className="mx-auto max-w-measure">
            <h1 className="type-display-h2">{page.title}</h1>
            <p className="mt-stack type-heading-h5 text-tile-muted">
              Updated{" "}
              <time dateTime={page.updated}>{formatDate(page.updated)}</time>
            </p>
            <div className="mt-tile-md">
              <Body />
            </div>
          </div>
        </Tile>
      </main>
      <SiteEnd />
    </>
  );
}
