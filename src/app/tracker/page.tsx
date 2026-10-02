import type { Metadata } from "next";
import { SiteEnd } from "@/components/SiteEnd";
import { Tile } from "@/components/Tile";
import { Topbar } from "@/components/Topbar";
import { SITE_LIVE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bill tracker · AI in Congress",
  // A page-level robots replaces the layout's, so keep pre-launch nofollow.
  robots: { index: false, follow: SITE_LIVE },
};

export default function TrackerPage() {
  return (
    <>
      <Topbar variant="article" current="/tracker" />
      <main id="main" tabIndex={-1} className="outline-none">
        <Tile mode="amber">
          <h1 className="type-display-h2">Bill tracker</h1>
          <p className="mt-stack type-text-large">
            The bill tracker is in progress.
          </p>
        </Tile>
      </main>
      <SiteEnd />
    </>
  );
}
