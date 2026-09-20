import raw from "@/data/summary.json";
import type { SourceId } from "./types";

/**
 * Aggregates computed straight from the three organizer CSVs during data
 * preparation, so the first paint can show true counts before the full
 * archive finishes loading in the browser. No value here is hand-written.
 */

export type SourceSummary = {
  count: number;
  recordsInFile?: number;
  undated?: number;
  from: string;
  to: string;
  byYear: Record<string, number>;
  byMonth: Record<string, number>;
  listeningHours?: number;
  artists?: number;
  tracks?: number;
  skipped?: number;
  shuffled?: number;
  spend?: number;
  income?: number;
  categories?: { name: string; count: number }[];
  cities?: { name: string; count: number }[];
  merchants?: { name: string; count: number }[];
  cityCount?: number;
};

export type Summary = {
  generatedFrom: string[];
  sources: Record<SourceId, SourceSummary>;
  combined: { count: number; from: string; to: string; byMonth: Record<string, number> };
  music: {
    hourHistogram: number[];
    topArtists: { name: string; plays: number }[];
    topTracks: { name: string; artist: string; plays: number }[];
  };
};

export const summary = raw as unknown as Summary;

export const YEARS = (() => {
  const first = Number(summary.combined.from.slice(0, 4));
  const last = Number(summary.combined.to.slice(0, 4));
  const out: number[] = [];
  for (let y = first; y <= last; y += 1) out.push(y);
  return out;
})();

/** Per-source records per year — drives the coverage timeline. */
export function coverage() {
  return YEARS.map((year) => {
    const key = String(year);
    const spotify = summary.sources.spotify.byYear[key] ?? 0;
    const household = summary.sources.household.byYear[key] ?? 0;
    const india = summary.sources.india.byYear[key] ?? 0;
    return { year, spotify, household, india, total: spotify + household + india };
  });
}

export function formatInr(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatCount(value: number) {
  return value.toLocaleString("en-US");
}
