/**
 * Unified client-side data model.
 *
 * Every record from the three organizer datasets is normalized into a
 * `Fragment`. Source-specific fields are never destroyed — they are kept on
 * `metadata` so any view can reach the original values.
 *
 * Nothing in this layer touches a server: the raw payloads are static files
 * fetched by the browser and normalized here.
 */

export type SourceId = "spotify" | "household" | "india";

export type Fragment = {
  /** Stable id: `<source>-<index in source>` */
  id: string;
  source: SourceId;
  /** Epoch milliseconds (local wall clock of the original record). */
  timestamp: number;
  /** Display category, already safe to render. */
  category: string;
  title: string;
  description: string;
  /** Present for money fragments only. */
  amount?: number;
  currency?: string;
  /** Aggregated location (city / state) — never a street address. */
  location?: string;
  /** Source-specific fields, preserved. Safe subset only. */
  metadata: Record<string, string | number | boolean>;
};

export type SourceMeta = {
  id: SourceId;
  /** Short verb used across the product. */
  verb: "Listen" | "Spend" | "Move";
  label: string;
  dataset: string;
  blurb: string;
  /** CSS custom-property colour token name. */
  tone: "accent" | "gold" | "mint";
};

export const SOURCE_META: Record<SourceId, SourceMeta> = {
  spotify: {
    id: "spotify",
    verb: "Listen",
    label: "Listening history",
    dataset: "Spotify streaming history",
    blurb: "Every song pressed play on, with the hour it happened.",
    tone: "accent",
  },
  household: {
    id: "household",
    verb: "Spend",
    label: "Everyday spending",
    dataset: "Daily household transactions",
    blurb: "Milk, autos, snacks, a train ticket — the ledger of ordinary days.",
    tone: "gold",
  },
  india: {
    id: "india",
    verb: "Move",
    label: "Card activity",
    dataset: "Augmented India transactions",
    blurb: "Card trails across cities: shopping, travel, entertainment.",
    tone: "mint",
  },
};

export const SOURCE_ORDER: SourceId[] = ["spotify", "household", "india"];
