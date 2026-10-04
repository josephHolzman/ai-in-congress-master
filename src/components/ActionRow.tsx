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
    <Link href={href} className={row}>
      {/* The nav links' type (Topbar), so every lined link row reads alike. */}
      <span className="type-heading-h5">
        {label}
        {external && <span className="sr-only"> (external site)</span>}
      </span>
      <Icon size={24} aria-hidden className="size-24 shrink-0" />
    </Link>
  );
}
