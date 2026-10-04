"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Over 3 lines at display-h2, the title steps down to display-h3 (data-long).
// It's counted at h2 every time the box resizes (width, font load), so it's
// exact at every width. Without JS it stays h2.
export function Title({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h1 = ref.current!;
    const update = () => {
      h1.removeAttribute("data-long");
      const lines =
        h1.offsetHeight / parseFloat(getComputedStyle(h1).lineHeight);
      h1.toggleAttribute("data-long", Math.round(lines) > 3);
    };
    const observer = new ResizeObserver(update);
    observer.observe(h1);
    return () => observer.disconnect();
  }, []);

  return (
    // Untrimmed: Figma's 29 and 42 run box to box (h3 would trim it back).
    <h1
      ref={ref}
      className="mt-stack type-display-h2 text-tile [text-box:none] data-long:type-display-h3 data-long:[text-box:none]"
    >
      {children}
    </h1>
  );
}
