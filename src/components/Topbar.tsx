import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@carbon/icons-react";
import { Logo } from "@/components/Logo";
import { Tile } from "@/components/Tile";
import { NAV_LINKS } from "@/lib/site";

type TopbarProps = {
  variant: "home" | "article";
  /** The current page's href, marked with aria-current. */
  current?: string;
  /** Home only: the statement below the nav row. */
  children?: ReactNode;
};

export function Topbar({ variant, current, children }: TopbarProps) {
  return (
    <Tile
      mode="mint"
      as="header"
      // Home: the bottom layer of the sticky cascade (globals.css, StickyFit).
      data-sticky={variant === "home" || undefined}
      // A volt header next to mint is 1.0:1, so article pages get a line.
      className={
        variant === "home"
          ? "z-0 pb-stack focus-within:z-3"
          : "border-b border-tile-line"
      }
    >
      <div className="flex min-h-80 flex-wrap items-start justify-between gap-stack">
        <Link href="/" className="block">
          <Logo width="var(--logo-topbar)" className="block" />
        </Link>
        {/* From md, the nav is the right half: 50% of the content box ends on
            the right inset, so it starts on the 50% line. Below md it drops
            under the logo, full width, in 2 columns with the external link
            last (Joey's call, E6: CSS order, so desktop is untouched). */}
        <nav aria-label="Main" className="w-full md:w-1/2">
          <ul className="grid grid-cols-(--nav-cols) gap-x-stack gap-y-stack-sm">
            {NAV_LINKS.map(({ label, href, external }) => (
              <li
                key={label}
                className={external ? "max-md:order-last" : undefined}
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
      {variant === "home" && children}
    </Tile>
  );
}
