import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Chart } from "@/components/Chart";

// A5 article styles. p and li take type-text-article from the wrapper; the
// vertical rhythm is in .prose-article (globals.css).
const components: MDXComponents = {
  wrapper: ({ children }) => (
    <div className="prose-article type-text-article">{children}</div>
  ),
  h2: (props) => <h2 className="type-display-h3" {...props} />,
  h3: (props) => <h3 className="type-heading-h4" {...props} />,
  ul: (props) => (
    <ul className="list-disc pl-24 marker:text-tile-muted" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal pl-24 marker:text-tile-muted" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="border-l-2 border-tile-fg pl-24" {...props} />
  ),
  // Body links get no ↗ (E3); external ones still get rel="noopener".
  a: ({ href = "", ...props }) =>
    /^https?:/.test(href) ? (
      <a href={href} rel="noopener" {...props} />
    ) : (
      <Link href={href} {...props} />
    ),
  strong: (props) => <strong className="font-semibold" {...props} />,
  em: (props) => <em className="font-normal italic" {...props} />,
  Chart,
  // The TAKE IT DOWN post nests a <D3Chart> in its <Chart>. There's no chart
  // library, so it renders nothing; MDX throws on an undefined component.
  D3Chart: () => null,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
