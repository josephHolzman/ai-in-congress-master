import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "@carbon/icons-react";

type ActionRowProps = {
  label: string;
  href: string;
  external?: boolean;
};

const row =
  "flex items-center justify-between gap-stack border-t border-tile-fg pt-stack-sm";

export function ActionRow({ label, href, external }: ActionRowProps) {
  const Icon = external ? ArrowUpRight : ArrowRight;
  return (
    // The nav links' type (Topbar), so every lined link row reads alike. It's
    // on the link so the icon's 1.25em means the label.
    <Link href={href} className={`${row} type-heading-h5`}>
      <span>
        {label}
        {external && <span className="sr-only"> (external site)</span>}
      </span>
      <Icon size={32} aria-hidden className="size-icon-inline shrink-0" />
    </Link>
  );
}
