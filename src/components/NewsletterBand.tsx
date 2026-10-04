"use client";

import { useState } from "react";
import { Tile } from "@/components/Tile";

// The input and button padding is layout tokens, so they don't grow at the
// 991 root jump.
export function NewsletterBand() {
  const [status, setStatus] = useState("");

  return (
    <Tile mode="amber" as="section" aria-labelledby="newsletter-heading">
      <h2 id="newsletter-heading" className="type-display-h2">
        Get new analysis by email
      </h2>
      {/* Pre-launch: nothing is sent. Without JS the form reloads the page;
          POST keeps the address out of the URL. */}
      <form
        action="#"
        method="post"
        className="mt-tile-md"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus("Signups open soon.");
        }}
      >
        <label htmlFor="newsletter-email" className="block type-display-h3">
          Email address
        </label>
        {/* White on amber is 1.85:1, so the input needs an ink edge (1.4.11).
            Submit gets the same border so the two stay the same height. */}
        <div className="mt-stack flex flex-wrap gap-stack max-md:flex-col">
          <input
            id="newsletter-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@domain.com"
            data-tile="paper"
            className="min-w-0 grow rounded-full border border-ink px-tile py-stack type-display-h3 placeholder:text-tile-muted max-md:type-heading-h4"
          />
          <button
            type="submit"
            data-tile="ink"
            data-interactive
            className="rounded-full border border-ink px-tile py-stack type-display-h3 max-md:type-heading-h4 max-md:[text-box:none]"
          >
            Submit
          </button>
        </div>
      </form>
      <p
        aria-live="polite"
        className={status ? "mt-stack type-display-h3" : undefined}
      >
        {status}
      </p>
    </Tile>
  );
}
