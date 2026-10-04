import { ActionRow } from "@/components/ActionRow";
import { Tile } from "@/components/Tile";
import { sponsorLine, statusLine, type Bill } from "@/lib/bills";

// Below xl the rail is a full-width block before the body, its content on the
// measure; from xl it docks into the last quarter, beside the first paragraph.
const content = "mx-auto max-w-measure xl:mx-0 xl:max-w-none";

export function Rail({ bills }: { bills: Bill[] }) {
  return (
    <aside
      aria-labelledby="rail-heading"
      // Sticky only while it fits the viewport with 80 to spare (StickyFit),
      // and only when docked: below xl it would slide over the body.
      data-sticky
      data-sticky-margin="80"
      className="focus-within:z-3 max-xl:relative xl:col-start-4 xl:row-start-1 xl:self-start"
    >
      <Tile mode="signal" className="pb-stack">
        <h2 id="rail-heading" className={`${content} type-heading-h4-24`}>
          Bills in this article
        </h2>
      </Tile>
      <Tile mode="stone">
        <div className={content}>
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="border-tile-line not-first:mt-stack not-first:border-t not-first:pt-stack"
            >
              <p className="type-text-regular text-tile-muted">{bill.label}</p>
              <h3 className="type-heading-h4">{bill.title}</h3>
              <ul className="mt-stack space-y-stack-sm type-text-article">
                {[sponsorLine(bill), statusLine(bill)].map((line) => (
                  // The dot is an empty pseudo-element, so AT skips it.
                  <li
                    key={line}
                    className="flex gap-stack before:mt-[calc((1lh-var(--spacing-16))/2)] before:size-16 before:shrink-0 before:rounded-full before:bg-current"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-tile">
                <ActionRow label="Track this bill" href={bill.url} external />
              </div>
            </div>
          ))}
        </div>
      </Tile>
    </aside>
  );
}
