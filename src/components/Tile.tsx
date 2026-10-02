import type { HTMLAttributes } from "react";

export type TileMode =
  | "paper"
  | "stone"
  | "mint"
  | "amber"
  | "blush"
  | "volt"
  | "sand"
  | "sage"
  | "signal"
  | "ink"
  | "navy"
  | "slate";

const topPadding = { none: "pt-0", md: "pt-tile-md", lg: "pt-tile-lg" };

type TileProps = HTMLAttributes<HTMLElement> & {
  mode: TileMode;
  as?: "div" | "section" | "header" | "footer" | "article" | "aside";
  interactive?: boolean;
  top?: keyof typeof topPadding;
};

// [data-tile] paints bg-tile and text-tile in the base layer (globals.css), so
// a className color or background on a tile still wins.
export function Tile({
  mode,
  as: Tag = "div",
  interactive,
  top,
  className,
  ...rest
}: TileProps) {
  return (
    <Tag
      data-tile={mode}
      data-interactive={interactive || undefined}
      className={["p-tile", top && topPadding[top], className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
