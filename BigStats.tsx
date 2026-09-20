import { useMemo } from "react";
import { useReveal } from "@/hooks/useReveal";
import { formatCount, summary, YEARS } from "@/lib/data/summary";
import { moments, stats } from "@/lib/receipts";

const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
  rose: "var(--rose)",
  violet: "var(--violet)",
};

/** A bare data ridge — no card, no axis, just the shape of the number's own data. */
function Ridge({ values, tone, shown }: { values: number[]; tone: string; shown: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-24 items-end gap-[2px] md:h-32" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="flex-1 transition-all duration-[900ms]"
          style={{
            height: shown ? `${Math.max(2, (v / max) * 100)}%` : "2%",
            background: `linear-gradient(to top, color-mix(in oklab, ${tone} 25%, transparent), ${tone})`,
            opacity: 0.3 + (v / max) * 0.7,
            transitionDelay: `${i * 35}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function BigStats() {
  const { ref, shown } = useReveal<HTMLDivElement>(0.1);

  const playsByYear = useMemo(() => YEARS.map((y) => summary.sources.spotify.byYear[String(y)] ?? 0), []);
  const spendByYear = useMemo(() => {
    const h = summary.sources.household.byMonth;
    const i = summary.sources.india.byMonth;
    return YEARS.map((y) => {
      let total = 0;
      for (let m = 1; m <= 12; m += 1) {
        const k = `${y}-${String(m).padStart(2, "0")}`;
        total += (h[k] ?? 0) + (i[k] ?? 0);
      }
      return total;
    });
  }, []);
  const cityValues = useMemo(() => (summary.sources.india.cities ?? []).slice(0, 18).map((c) => c.count), []);
  const momentValues = useMemo(
    () => YEARS.map((y) => moments.filter((m) => m.day.startsWith(String(y))).length),
    [],
  );

  const spend = (summary.sources.household.spend ?? 0) + (summary.sources.india.spend ?? 0);

  const items = [
    {
      value: formatCount(summary.sources.spotify.listeningHours ?? 0),
      word: "LISTENING HOURS",
      body: `${formatCount(summary.sources.spotify.count)} plays across ${formatCount(
        summary.sources.spotify.artists ?? 0,
      )} artists — seven and a half months of continuous sound.`,
      tone: "rose",
      values: playsByYear,
      caption: "plays per year",
    },
    {
      value: `₹${(spend / 10000000).toFixed(1)}Cr`,
      word: "SPENDING LOGGED",
      body: `${formatCount(
        summary.sources.household.count + summary.sources.india.count,
      )} receipts, from a ₹10 milk packet to a card payment in another state.`,
      tone: "gold",
      values: spendByYear,
      caption: "receipts per year",
    },
    {
      value: formatCount(summary.sources.india.cityCount ?? 0),
      word: "PLACES",
      body: `Cities that appear in the card trail. ${
        stats.topCities[0]?.name ?? "One city"
      } returns most often; most of the rest appear exactly once.`,
      tone: "accent",
      values: cityValues,
      caption: "most-visited cities",
    },
    {
      value: String(moments.length),
      word: "HIDDEN THREADS",
      body: "Days where four or more different kinds of record land together — where the three archives touch.",
      tone: "mint",
      values: momentValues,
      caption: "threads per year",
    },
  ];

  return (
    <section ref={ref} className="surface-dark-base surface-night">
      <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
        <p className="label-xs text-muted">Four landmarks in the archive</p>

        <div className="mt-14 space-y-20 md:mt-20 md:space-y-28">
          {items.map((s, i) => {
            const tone = TONE_VAR[s.tone] ?? "var(--accent)";
            const flip = i % 2 === 1;
            return (
              <div
                key={s.word}
                style={{ transitionDelay: `${i * 90}ms` }}
                className={`grid items-end gap-6 border-t border-cloud/12 pt-10 md:grid-cols-12 md:gap-10 ${
                  shown ? "reveal reveal-in" : "reveal"
                }`}
              >
                <div className={`md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
                  <p className="numeral-mega" style={{ color: tone }}>
                    {s.value}
                  </p>
                  <p className="mt-6 label-xs">{s.word}</p>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{s.body}</p>
                </div>
                <div className={`md:col-span-6 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-7"}`}>
                  <Ridge values={s.values} tone={tone} shown={shown} />
                  <p className="mt-3 border-t border-cloud/12 pt-2 label-xs text-muted opacity-70">{s.caption}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
