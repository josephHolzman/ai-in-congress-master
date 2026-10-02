import type { ReactNode } from "react";

// Neutral on every mode (A4): border and text follow the tile's fg.
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block w-fit rounded-full border border-tile-fg px-24 py-4 type-heading-h5 text-tile uppercase">
      {children}
    </span>
  );
}
