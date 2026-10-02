import { notFound } from "next/navigation";
import { ActionRow } from "@/components/ActionRow";
import { Pill } from "@/components/Pill";
import { Tile } from "@/components/Tile";
import { Computed } from "./Computed";

const colors = [
  "paper",
  "stone",
  "ink",
  "navy",
  "signal",
  "mint",
  "blush",
  "volt",
  "amber",
  "sand",
  "slate",
  "sage",
  "blue",
];

// Mint and signal have no hover state (A3), so they get no "Hover me" tile.
const modes = [
  "paper",
  "stone",
  "mint",
  "amber",
  "blush",
  "volt",
  "sand",
  "sage",
  "signal",
  "ink",
  "navy",
  "slate",
];
const staticModes = ["mint", "signal"];

// Full class names, so Tailwind's scanner finds them.
const typeTokens = [
  "type-display-h1",
  "type-display-h2",
  "type-display-h3",
  "type-heading-h4",
  "type-heading-h5",
  "type-text-large",
  "type-text-medium",
  "type-text-article",
  "type-text-regular",
  "type-text-small",
  "type-ui-nav",
  "type-ui-label",
];

const spacing = [
  "w-4",
  "w-8",
  "w-16",
  "w-24",
  "w-32",
  "w-40",
  "w-56",
  "w-80",
  "w-140",
];

export default function Styleguide() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex flex-col gap-tile-md p-tile">
      <h1 className="type-display-h2">Styleguide</h1>

      <section className="flex flex-col gap-stack">
        <h2 className="type-display-h3">Color</h2>
        <ul className="grid grid-cols-2 gap-stack md:grid-cols-4">
          {colors.map((name) => (
            <li key={name} className="flex flex-col gap-stack-sm">
              <div
                id={`swatch-${name}`}
                className="h-80 border border-ink"
                style={{ backgroundColor: `var(--color-${name})` }}
              />
              <p className="type-heading-h5">{name}</p>
              <p className="type-text-regular">
                <Computed
                  target={`swatch-${name}`}
                  property={`--color-${name}`}
                />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section id="tile-modes" className="flex flex-col gap-stack">
        <h2 className="type-display-h3">Tile modes</h2>
        <ul className="grid grid-cols-1 border-t border-l border-ink md:grid-cols-4">
          {modes.map((mode) => (
            <li
              key={mode}
              className="flex flex-col border-r border-b border-ink"
            >
              <div data-tile={mode} className="flex flex-col gap-stack p-tile">
                <p className="type-heading-h4">{mode}</p>
                <p className="text-tile-muted">Muted text</p>
                <hr className="border-tile-line" />
                <p>Foreground text</p>
              </div>
              {!staticModes.includes(mode) && (
                <div data-tile={mode} data-interactive className="p-tile">
                  <a href="#tile-modes" className="type-heading-h5">
                    Hover me
                  </a>
                  <p className="text-tile-muted">Muted follows the flip</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-stack">
        <h2 className="type-display-h3">Type</h2>
        {typeTokens.map((token) => (
          <div
            key={token}
            className="flex flex-col gap-stack-sm border-t border-ink pt-tile"
          >
            <p id={token} className={token}>
              Comparing the AI policies 0123456789
            </p>
            <p className="type-text-small">
              {token} · <Computed target={token} property="font-size" /> /{" "}
              <Computed target={token} property="line-height" /> ·{" "}
              <Computed target={token} property="letter-spacing" /> ·{" "}
              <Computed target={token} property="font-weight" />
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-stack">
        <h2 className="type-display-h3">Spacing</h2>
        {spacing.map((width) => (
          <div key={width} className="flex items-center gap-stack">
            <div id={width} className={`h-24 bg-ink ${width}`} />
            <p className="type-text-small">
              {width.slice(2)} · <Computed target={width} property="width" />
            </p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-stack">
        <h2 className="type-display-h3">Components</h2>
        <div className="grid md:grid-cols-2">
          {(["paper", "ink"] as const).map((mode) => (
            <Tile key={mode} mode={mode} className="flex flex-col gap-stack">
              <Pill>{mode}</Pill>
              <ActionRow label="Open the bill tracker" href="/tracker" />
              <ActionRow label="Joey Holzman" href="#" external />
              <ActionRow label="Read more" decorative />
            </Tile>
          ))}
        </div>
      </section>
    </main>
  );
}
