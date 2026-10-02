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
      // A volt header next to mint is 1.0:1, so article pages get a line.
      className={
        variant === "article" ? "border-b border-tile-line" : undefined
      }
    >
      <div className="flex min-h-80 flex-wrap items-start justify-between gap-stack">
        <Link href="/" className="block">
          <Logo width="var(--logo-topbar)" className="block" />
        </Link>
        <nav aria-label="Main">
          <ul className="grid grid-cols-(--nav-cols) gap-x-stack gap-y-stack-sm">
            {NAV_LINKS.map(({ label, href, external }) => (
              <li key={label}>
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
