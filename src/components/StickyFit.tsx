"use client";

import { useEffect } from "react";

// Marks each [data-sticky] layer that fits the viewport with data-fits; CSS
// makes only those sticky (globals.css). Without JS nothing is marked, so
// nothing sticks.
export function StickyFit() {
  useEffect(() => {
    const layers = [...document.querySelectorAll<HTMLElement>("[data-sticky]")];
    const update = () => {
      for (const layer of layers) {
        layer.toggleAttribute(
          "data-fits",
          layer.offsetHeight <= window.innerHeight,
        );
      }
    };
    const observer = new ResizeObserver(update);
    layers.forEach((layer) => observer.observe(layer));
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
