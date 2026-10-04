import Link from "next/link";
import { ArrowUpRight } from "@carbon/icons-react";
import { Mark } from "@/components/Mark";
import { Tile } from "@/components/Tile";
import { NAV_LINKS } from "@/lib/site";

export function Footer() {
  return (
    <Tile mode="ink" as="footer">
      <div className="grid gap-y-tile-md lg:grid-cols-(--footer-cols)">
        <Mark
          width="var(--mark-footer)"
          className="block max-w-full text-mint"
        />
        <div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-3 gap-x-stack-sm gap-y-32 max-md:grid-cols-2">
              {NAV_LINKS.map(({ label, href, external }) => (
                // As in the Topbar: column 3 of row 1 from md, last below.
                <li
                  key={label}
                  className={
                    external ? "md:col-start-3 md:row-start-1" : undefined
                  }
                >
                  <Link
                    href={href}
                    className="inline-flex min-h-target items-center gap-4 type-heading-h5 text-mint"
                  >
                    {label}
                    {external && (
                      <>
                        <span className="sr-only"> (external site)</span>
                        <ArrowUpRight
                          size={24}
                          aria-hidden
                          className="size-24 shrink-0"
                        />
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mt-tile-md max-w-(--disclaimer) type-text-regular text-paper">
            AI in Congress is an independent blog and is not affiliated with,
            endorsed by, or sponsored by the United States Congress or any
            government entity. All views and opinions expressed are solely those
            of the author, Joey Holzman.
          </p>
        </div>
      </div>
    </Tile>
  );
}
