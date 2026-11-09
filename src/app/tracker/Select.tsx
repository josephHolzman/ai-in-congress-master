import { ChevronDown } from "@carbon/icons-react";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** A bordered 3.5rem finder field (§4.3); otherwise the borderless pager
      select (§4.4b), whose hit area is still 2.5rem tall. */
  field?: boolean;
};

// A native select with the Carbon chevron drawn inside it.
export function Select({ field, ...rest }: SelectProps) {
  return (
    <span
      className={`relative type-text-regular ${field ? "flex" : "inline-flex"}`}
    >
      <select
        className={`appearance-none bg-paper ${
          field
            ? "h-56 w-full border border-tile-fg ps-16 pe-56"
            : "min-h-40 ps-8 pe-32 hover:bg-stone"
        }`}
        {...rest}
      />
      <ChevronDown
        size={32}
        aria-hidden
        className={`pointer-events-none absolute top-1/2 size-icon-inline -translate-y-1/2 ${
          field ? "end-16" : "end-8"
        }`}
      />
    </span>
  );
}
