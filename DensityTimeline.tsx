import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { formatCount, summary, YEARS } from "@/lib/data/summary";
import { SOURCE_META } from "@/lib/data/types";
import { chapterOf } from "@/lib/receipts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
};

type Cell = {
  key: string;
  year: number;
  month: number;
  spotify: number;
  household: number;
  india: number;
  total: number;
  dominant: "spotify" | "household" | "india" | null;
};

function buildCells(): Cell[] {
  const s = summary.sources.spotify.byMonth;
  const h = summary.sources.household.byMonth;
  const i = summary.sources.india.byMonth;
  const out: Cell[] = [];
  for (const year of YEARS) {
    for (let m = 1; m <= 12; m += 1) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      const spotify = s[key] ?? 0;
      const household = h[key] ?? 0;
      const india = i[key] ?? 0;
      const total = spotify + household + india;
      const dominant: Cell["dominant"] = total
        ? spotify >= household && spotify >= india
          ? "spotify"
          : household >= india
            ? "household"
            : "india"
        : null;
      out.push({
        key,
        year,
        month: m,
        spotify,
        household,
        india,
        total,
        dominant,
      });
    }
  }
  return out;
}

/**
 * A vertical timeline landscape: every year is a band, every month a cluster of
 * marks whose number and brightness follow the real record count for that month.
 */
export function DensityTimeline() {
  const allCells = useMemo(buildCells, []);
  const [layers, setLayers] = useState<Record<"spotify" | "household" | "india", boolean>>({
    spotify: true,
    household: true,
    india: true,
  });
  const cells = useMemo(
    () =>
      allCells.map((c) => {
        const spotify = layers.spotify ? c.spotify : 0;
        const household = layers.household ? c.household : 0;
        const india = layers.india ? c.india : 0;
        const total = spotify + household + india;
         const dominant: Cell["dominant"] = total
           ? spotify >= household && spotify >= india
             ? "spotify"
             : household >= india
               ? "household"
               : "india"
           : null;
        return {
          ...c,
          spotify,
          household,
          india,
          total,
           dominant,
        };
      }),
    [allCells, layers],
  );
  const max = useMemo(() => Math.max(...cells.map((c) => c.total), 1), [cells]);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { ref, shown } = useReveal<HTMLDivElement>(0.08);

  const focusKey = hoverKey ?? selectedKey;
  const hover = focusKey ? cells.find((c) => c.key === focusKey) ?? null : null;
  const active = hover ?? cells.reduce((a, b) => (b.total > a.total ? b : a), cells[0]!);
  const dominantMeta = active.dominant ? SOURCE_META[active.dominant] : null;
  const activeChapter = chapterOf(`${active.year}-06-01T12:00:00`)!;
  const setHover = (c: Cell | null) => setHoverKey(c ? c.key : null);

  return (
    <section ref={ref} id="years" className="surface-dark-base surface-indigo story-scene archival-grain relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 50% at 10% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
           <div>
             <p className="label-xs text-muted">Scene 04 · The years</p>
              <h2 className="mt-6 display-xl">
               THE SHAPE OF A LIFE,
            <span className="display-fade block italic">
              ONE FINGERPRINT.
            </span>
             </h2>
           </div>
          <div className="flex flex-wrap gap-3">
            {(["spotify", "household", "india"] as const).map((s) => {
              const on = layers[s];
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setLayers((prev) => ({ ...prev, [s]: !prev[s] }))}
                   className={`inline-flex min-h-11 items-center gap-2.5 border px-4 label-xs transition ${
                    on ? "border-cloud/45 text-cloud" : "border-cloud/15 text-muted hover:text-cloud"
                  }`}
                >
                  <span
                    className="size-2 rounded-full transition"
                    style={{ background: on ? TONE_VAR[SOURCE_META[s].tone] : "currentColor", opacity: on ? 1 : 0.4 }}
                    aria-hidden="true"
                  />
                  {SOURCE_META[s].verb}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_280px] lg:items-start">
           <div className="overflow-x-auto pb-2" aria-label="Monthly record density from 2013 to 2024">
             <div className="min-w-[34rem]">
            {YEARS.map((year, yi) => {
              const row = cells.filter((c) => c.year === year);
              const yearTotal = row.reduce((a, c) => a + c.total, 0);
              const chapter = chapterOf(`${year}-06-01T12:00:00`)!;
              return (
                <div
                  key={year}
                  style={{ transitionDelay: `${yi * 60}ms` }}
                  className={`grid grid-cols-[4.5rem_1fr] items-center gap-4 border-t border-cloud/12 py-3 md:grid-cols-[7rem_1fr] md:gap-8 ${
                    shown ? "reveal reveal-in" : "reveal"
                  }`}
                >
                  <div>
                    <Link
                      to="/chapter/$slug"
                      params={{ slug: chapter.slug }}
                      className="numeral block text-[clamp(1.6rem,3.4vw,2.6rem)] transition hover:opacity-70"
                      style={{ color: hover?.year === year ? "var(--cloud)" : "color-mix(in oklab, var(--cloud) 55%, transparent)" }}
                    >
                      {year}
                    </Link>
                    <span className="mt-1 block font-mono text-[10px] text-muted">{formatCount(yearTotal)}</span>
                  </div>

                  {/* month clusters — mark count and brightness follow real density */}
                  <div className="flex items-center gap-1.5 md:gap-3">
                    {row.map((c) => {
                      const density = c.total / max;
                      const marks = c.total ? 1 + Math.round(density * 8) : 0;
                      const tone = c.dominant ? TONE_VAR[SOURCE_META[c.dominant].tone] : "var(--cloud)";
                      const live = hover?.key === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onMouseEnter={() => setHover(c)}
                          onFocus={() => setHover(c)}
                          onMouseLeave={() => setHover(null)}
                          onBlur={() => setHover(null)}
                           onClick={() => setSelectedKey((key) => (key === c.key ? null : c.key))}
                           aria-pressed={selectedKey === c.key}
                           aria-label={`${MONTHS[c.month - 1]} ${c.year}: ${formatCount(c.total)} records${c.dominant ? `, mostly ${SOURCE_META[c.dominant].verb.toLowerCase()}` : ""}. Chapter ${String(chapter.index + 1).padStart(2, "0")}: ${chapter.title}.`}
                           className="group relative flex h-16 min-w-7 flex-1 flex-col-reverse items-center justify-start gap-[3px] transition-colors md:h-20"
                          style={{ background: live ? "color-mix(in oklab, var(--cloud) 8%, transparent)" : undefined }}
                        >
                          {marks === 0 ? (
                            <span className="mb-1 block size-[3px] rounded-full bg-cloud/20" aria-hidden="true" />
                          ) : (
                            <>
                              {c.spotify && layers.spotify ? <span aria-hidden="true" className="block w-px bg-accent transition-all" style={{ height: `${4 + density * 38}px`, opacity: shown ? (live ? 1 : .65) : 0 }} /> : null}
                              {c.household && layers.household ? <span aria-hidden="true" className="block h-[3px] bg-gold transition-all" style={{ width: `${4 + density * 12}px`, opacity: shown ? (live ? 1 : .75) : 0 }} /> : null}
                              {c.india && layers.india ? <span aria-hidden="true" className="block rounded-full border border-mint transition-all" style={{ width: `${5 + density * 9}px`, height: `${5 + density * 9}px`, opacity: shown ? (live ? 1 : .75) : 0 }} /> : null}
                              {marks > 4 ? <span aria-hidden="true" className="block size-[3px] rounded-full" style={{ background: tone, opacity: .7 }} /> : null}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-[4.5rem_1fr] gap-4 border-t border-cloud/12 pt-2 md:grid-cols-[7rem_1fr] md:gap-8">
              <span />
              <div className="flex label-xs text-muted opacity-60">
                {MONTHS.map((m) => (
                  <span key={m} className="flex-1 text-center">
                    {m.slice(0, 1)}
                  </span>
                ))}
              </div>
             </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28" aria-live="polite">
             <p className="label-xs text-muted">{selectedKey ? "Selected month" : hoverKey ? "Focused month" : "Busiest month"}</p>
            <p className="mt-4 numeral text-[clamp(2.4rem,5vw,3.6rem)]">{formatCount(active.total)}</p>
            <p className="mt-2 font-display text-xl">
              {MONTHS[active.month - 1]} {active.year}
            </p>
            {dominantMeta ? (
              <p className="mt-4 label-xs" style={{ color: TONE_VAR[dominantMeta.tone] }}>
                Mostly {dominantMeta.verb}
              </p>
            ) : (
              <p className="mt-4 label-xs text-muted">No records in the chosen layers</p>
            )}
            <Link
              to="/chapter/$slug"
              params={{ slug: activeChapter.slug }}
              className="mt-3 block font-display text-sm text-muted underline decoration-dotted transition hover:text-cloud"
            >
              Chapter {String(activeChapter.index + 1).padStart(2, "0")} · {activeChapter.title}
            </Link>
            <dl className="mt-5 space-y-2 border-t border-cloud/15 pt-4 font-mono text-[11px]">
              {(
                [
                  ["Listen", active.spotify],
                  ["Spend", active.household],
                  ["Move", active.india],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd>{formatCount(v)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-xs leading-relaxed text-muted">
               Each year opens its chapter. Absence remains visible: the household ledger ends in 2018, while card activity begins in 2022.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
