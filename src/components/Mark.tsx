type MarkProps = {
  /** Any CSS length, e.g. a rem token. Height follows the 321×334 viewBox. */
  width: string;
  className?: string;
};

// The quarter-circle from src/app/icon.svg. Decorative: wherever it's used,
// nearby text names the site.
export function Mark({ width, className }: MarkProps) {
  return (
    <svg
      viewBox="0 0 321 334"
      fill="none"
      aria-hidden
      className={className}
      style={{ width }}
    >
      <path
        fill="currentColor"
        d="M0 0C177.283 0 321 143.717 321 321V334H0V0Z"
      />
    </svg>
  );
}
