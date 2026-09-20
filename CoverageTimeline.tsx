import { coverage } from "@/lib/data/summary";
import { SOURCE_META, SOURCE_ORDER } from "@/lib/data/types";
import { SourceIcon } from "./SourceMark";

const BAR: Record<string, string> = {
  spotify: "bg-accent",
  household: "bg-gold",
  india: "bg-mint",
};

/**
 * Where each dataset actually contributes records, year by year.
 * Coverage is read from the prepared aggregates — no source spans all 12 years.
 */
export function CoverageTimeline({ onPickYear }: { onPickYear?: (year: number) => void }) {
  const rows = coverage();
  const max = Math.max(...rows.map((r) => r.total));

  return (
    <section className="archive-panel rounded-md p-5 md:p-6" aria-label="Dataset coverage by year">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">One timeline, three windows</p>
          <h2 className="mt-1.5 text-xl">Where each record set begins and ends</h2>
        </div>
        <ul className="flex flex-wrap gap-3">
          {SOURCE_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <span className={`size-2 rounded-full ${BAR[s]}`} aria-hidden="true" />
              <SourceIcon source={s} className="size-3" />
              {SOURCE_META[s].verb}
            </li>
          ))}
        </ul>
      </div>

      <ol className="mt-6 space-y-2.5">
        {rows.map((row) => (
          <li key={row.year} className="grid grid-cols-[3.2rem_1fr_auto] items-center gap-3">
            <button
              type="button"
              aria-label={`Filter archive to ${row.year}`}
              onClick={() => onPickYear?.(row.year)}
              className="min-h-11 text-left font-mono text-[11px] text-muted transition hover:text-cloud"
            >
              {row.year}
            </button>
            <div className="flex h-3 w-full overflow-hidden rounded-sm bg-cloud/6">
              {SOURCE_ORDER.map((s) => {
                const value = row[s];
                if (!value) return null;
                return (
                  <span
                    key={s}
                    className={`${BAR[s]} h-full transition-[width] duration-700`}
                    style={{ width: `${(value / max) * 100}%` }}
                    title={`${row.year} · ${SOURCE_META[s].verb} · ${value.toLocaleString("en-US")} records`}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
            <span className="font-mono text-[10px] text-muted">{row.total.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted">
        Listening runs the full length of the archive. The household ledger only speaks between 2015 and
        2018; card activity only from 2022. The gaps are part of the story, not missing data.
      </p>
    </section>
  );
}
