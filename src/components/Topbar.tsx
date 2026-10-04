import Link from "next/link";
import { ArrowUpRight } from "@carbon/icons-react";
import { Logo } from "@/components/Logo";
import { Tile, type TileMode } from "@/components/Tile";
import { NAV_LINKS } from "@/lib/site";

type TopbarProps = {
  variant: "home" | "article";
  /** The current page's href, marked with aria-current. */
  current?: string;
  /** Articles pass their header's mode, so the top reads as one field. */
  mode?: TileMode;
};

export function Topbar({ variant, current, mode = "mint" }: TopbarProps) {
  return (
    <Tile
      mode={mode}
      as="header"
      // Home: sticky under the bill band, which slides over it (globals.css,
      // StickyFit).
      data-sticky={variant === "home" || undefined}
      // The z-index only applies where it's sticky (Home). Off mint (articles)
      // the topbar sits on a header of its own color: a hairline sets the nav
      // apart.
      className={
        mode === "mint"
          ? "z-0 focus-within:z-3"
          : "z-0 border-b border-tile-line focus-within:z-3"
      }
    >
      <div className="flex min-h-(--topbar-row) flex-wrap items-start justify-between gap-stack">
        <Link href="/" className="block">
          <Logo width="var(--logo-topbar)" className="block" />
        </Link>
        {/* From md, the nav is the right half: 50% of the content box ends on
            the right inset, so it starts on the 50% line. Below md it drops
            under the logo, full width, in 2 columns, external link last. */}
        <nav aria-label="Main" className="w-full md:w-1/2">
          <ul className="grid grid-cols-(--nav-cols) gap-x-stack gap-y-stack-sm">
            {NAV_LINKS.map(({ label, href, external }) => (
              <li
                key={label}
                className={
                  external ? "md:col-start-3 md:row-start-1" : undefined
                }
              >
                <Link
                  href={href}
                  aria-current={href === current ? "page" : undefined}
                  className="flex items-start justify-between border-t border-tile-fg pt-stack-sm type-heading-h5 aria-[current=page]:underline"
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
      </div>
    </Tile>
  );
}
