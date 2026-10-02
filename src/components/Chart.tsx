type ChartProps = {
  title: string;
  summary: string;
  source: { label: string; href: string };
  table: { columns: string[]; rows: (string | number)[][] };
};

// The chart treatment isn't designed yet: the summary and the data table carry
// the content. Children (the post's <D3Chart>) are ignored.
export function Chart({ title, summary, source, table }: ChartProps) {
  const numeric = table.columns.map((_, i) =>
    table.rows.every((row) => typeof row[i] === "number"),
  );
  const cell = (i: number) =>
    `py-8 ${i > 0 ? "pl-16" : ""} ${numeric[i] ? "text-right tabular-nums" : "text-left"}`;

  return (
    <figure className="flex flex-col gap-16">
      <p className="type-heading-h4">{title}</p>
      <p className="type-text-regular">{summary}</p>
      <table className="w-full type-text-regular">
        {/* The visible title is above; the caption names the table for AT. */}
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="border-b border-tile-line">
            {table.columns.map((column, i) => (
              <th
                key={column}
                scope="col"
                className={`font-semibold ${cell(i)}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={String(row[0])} className="border-b border-tile-line">
              {row.map((value, i) => {
                const Cell = i === 0 ? "th" : "td";
                return (
                  <Cell
                    key={i}
                    scope={i === 0 ? "row" : undefined}
                    className={`font-normal ${cell(i)}`}
                  >
                    {typeof value === "number"
                      ? value.toLocaleString("en-US")
                      : value}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="type-text-small">
        Source:{" "}
        <a href={source.href} rel="noopener">
          {source.label}
        </a>
      </figcaption>
    </figure>
  );
}
