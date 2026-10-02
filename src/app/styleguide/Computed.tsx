"use client";

import { useEffect, useRef } from "react";

// Shows a live computed value, so the readout follows the fluid root on resize.
export function Computed({
  target,
  property,
}: {
  target: string;
  property: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = document.getElementById(target);
    const read = () => {
      if (el && ref.current)
        ref.current.textContent = getComputedStyle(el)
          .getPropertyValue(property)
          .trim();
    };
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, [target, property]);

  return <span ref={ref} />;
}
