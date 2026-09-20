import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useReveal } from "@/hooks/useReveal";
import { formatCount, formatInr, summary } from "@/lib/data/summary";
import { chapters, receiptsInChapter, stats, type Chapter } from "@/lib/receipts";

const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
  rose: "var(--rose)",
  violet: "var(--violet)",
};

/** Surface per chapter — the journey alternates warm paper and deep colour. */
const SURFACE: Record<string, string> = {
  "first-signals": "surface-sand",
  "finding-a-sound": "surface-dark-base surface-night",
  "the-loud-year": "surface-dark-base surface-noir",
  "small-expenses": "surface-ivory",
  "the-inside-years": "surface-dark-base surface-indigo",
  "moving-again": "surface-sand",
};

type MonthRow = { key: string; plays: number; spend: number };

function monthsOf(c: Chapter): MonthRow[] {
  const s = summary.sources.spotify.byMonth;
  const h = summary.sources.household.byMonth;
  const i = summary.sources.india.byMonth;
  const out: MonthRow[] = [];
  for (let y = c.years[0]; y <= c.years[1]; y += 1) {
    for (let m = 1; m <= 12; m += 1) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      out.push({ key, plays: s[key] ?? 0, spend: (h[key] ?? 0) + (i[key] ?? 0) });
    }
  }
  return out;
}

/* ------------------------------ visualisations ------------------------------ */

function DotField({ rows, tone, shown }: { rows: MonthRow[]; tone: string; shown: boolean }) {
  const max = Math.max(...rows.map((r) => r.plays), 1);
  return (
    <div className="flex h-56 items-end gap-2" aria-hidden="true">
      {rows.map((r, i) => {
        const marks = r.plays ? 1 + Math.round((r.plays / max) * 9) : 0;
        return (
          <span key={r.key} className="flex flex-1 flex-col-reverse items-center gap-1.5">
            {Array.from({ length: marks }, (_, k) => (
              <span
                key={k}
                className="block size-1.5 rounded-full transition-all duration-700"
                style={{
                  background: tone,
                  opacity: shown ? 0.35 + (r.plays / max) * 0.6 : 0,
                  transitionDelay: `${i * 30 + k * 25}ms`,
                }}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
}

function Waveform({ rows, tone, shown }: { rows: MonthRow[]; tone: string; shown: boolean }) {
  const max = Math.max(...rows.map((r) => r.plays), 1);
  return (
    <div className="flex h-56 items-center gap-[3px]" aria-hidden="true">
      {rows.map((r, i) => (
        <span
          key={r.key}
          className="flex-1 rounded-full transition-all duration-[900ms]"
          style={{
            height: shown ? `${Math.max(3, (r.plays / max) * 100)}%` : "3%",
            background: `linear-gradient(to bottom, ${tone}, color-mix(in oklab, ${tone} 20%, transparent))`,
            transitionDelay: `${i * 45}ms`,
          }}
        />
      ))}
    </div>
  );
}

function SpendBars({ rows, shown }: { rows: MonthRow[]; shown: boolean }) {
  const max = Math.max(...rows.map((r) => r.spend), 1);
  return (
    <div className="space-y-1.5" aria-hidden="true">
      {rows
        .filter((r) => r.spend > 0)
        .map((r, i) => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="w-16 shrink-0 font-mono text-[10px] text-muted">{r.key}</span>
            <span className="h-2 flex-1">
              <span
                className="block h-full transition-all duration-700"
                style={{
                  width: shown ? `${(r.spend / max) * 100}%` : "0%",
                  background: "var(--gold)",
                  transitionDelay: `${i * 40}ms`,
                }}
              />
            </span>
            <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted">{r.spend}</span>
          </div>
        ))}
    </div>
  );
}

function NightRing({ shown, tone }: { shown: boolean; tone: string }) {
  const hours = summary.music.hourHistogram;
  const max = Math.max(...hours, 1);
  return (
    <div role="img" aria-label="Actual 24-hour listening distribution. Thirty percent of listening happened after midnight.">
      <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
        <svg viewBox="-72 -72 144 144" className="h-full w-full" aria-hidden="true">
          <circle r="39" fill="none" stroke="currentColor" strokeOpacity=".12" />
          <circle r="57" fill="none" stroke="currentColor" strokeOpacity=".08" />
          {hours.map((value, hour) => {
            const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
            const inner = 40;
            const outer = inner + (shown ? (value / max) * 25 : 1);
            const night = hour < 6;
            return <line key={hour} x1={(Math.cos(angle) * inner).toFixed(2)} y1={(Math.sin(angle) * inner).toFixed(2)} x2={(Math.cos(angle) * outer).toFixed(2)} y2={(Math.sin(angle) * outer).toFixed(2)} stroke={night ? tone : "currentColor"} strokeOpacity={night ? 1 : .26} strokeWidth="3" strokeLinecap="round" style={{ transition: "all 700ms ease", transitionDelay: `${hour * 22}ms` }} />;
          })}
          {[0, 6, 12, 18].map((hour) => {
            const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
            return <text key={hour} x={(Math.cos(angle) * 31).toFixed(2)} y={(Math.sin(angle) * 31 + 2).toFixed(2)} textAnchor="middle" fill="currentColor" fillOpacity=".62" style={{ font: "500 5px var(--font-mono)" }}>{String(hour).padStart(2, "0")}:00</text>;
          })}
          <text x="0" y="-2" textAnchor="middle" fill={tone} style={{ font: "600 15px var(--font-display)" }}>30%</text>
          <text x="0" y="8" textAnchor="middle" fill="currentColor" fillOpacity=".55" style={{ font: "500 4px var(--font-mono)" }}>AFTER MIDNIGHT</text>
        </svg>
      </div>
      <p className="sr-only">Hourly listening counts: {hours.map((value, hour) => `${String(hour).padStart(2, "0")}:00, ${formatCount(value)} plays`).join("; ")}.</p>
      <p className="mt-3 text-center label-xs text-muted">00:00 → 06:00 → 12:00 → 18:00 → 24:00 · real listening density</p>
    </div>
  );
}

function CityBars({ shown }: { shown: boolean }) {
  const cities = (summary.sources.india.cities ?? []).slice(0, 10);
  const max = Math.max(...cities.map((c) => c.count), 1);
  return (
    <div className="space-y-2" aria-hidden="true">
      {cities.map((c, i) => (
        <div key={c.name} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            {c.name}
          </span>
          <span className="h-2 flex-1">
            <span
              className="block h-full transition-all duration-700"
              style={{
                width: shown ? `${(c.count / max) * 100}%` : "0%",
                background: "var(--mint)",
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-[10px] text-muted">{c.count}</span>
        </div>
      ))}
    </div>
  );
}

function ArtistBars({ c, shown }: { c: Chapter; shown: boolean }) {
  const top = summary.music.topArtists.slice(0, 8);
  const max = Math.max(...top.map((a) => a.plays), 1);
  const yearArtists = Object.entries(stats.topArtistByYear).filter(
    ([y]) => Number(y) >= c.years[0] && Number(y) <= c.years[1],
  );
  return (
    <div>
      <div className="space-y-2" aria-hidden="true">
        {top.map((a, i) => (
          <div key={a.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              {a.name}
            </span>
            <span className="h-2 flex-1">
              <span
                className="block h-full transition-all duration-700"
                style={{
                  width: shown ? `${(a.plays / max) * 100}%` : "0%",
                  background: "var(--violet)",
                  transitionDelay: `${i * 60}ms`,
                }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-mono text-[10px] text-muted">{a.plays}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 label-xs text-muted">
        {yearArtists.map(([y, a]) => `${y}: ${a}`).join("  ·  ")}
      </p>
    </div>
  );
}

/* --------------------------------- chapter --------------------------------- */

function ChapterScene({ c, i }: { c: Chapter; i: number }) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.12);
  const rows = useMemo(() => monthsOf(c), [c]);
  const tone = TONE_VAR[c.accent] ?? "var(--accent)";
  const flip = i % 2 === 1;

  const plays = useMemo(
    () =>
      Object.entries(summary.sources.spotify.byYear)
        .filter(([y]) => Number(y) >= c.years[0] && Number(y) <= c.years[1])
        .reduce((a, [, v]) => a + v, 0),
    [c],
  );
  const spendRupees = useMemo(() => {
    const items = receiptsInChapter(c);
    return items.reduce((a, r) => a + (r.amount ?? 0), 0);
  }, [c]);

  const visual =
    c.slug === "first-signals" ? (
      <DotField rows={rows} tone={tone} shown={shown} />
    ) : c.slug === "finding-a-sound" ? (
      <ArtistBars c={c} shown={shown} />
    ) : c.slug === "the-loud-year" ? (
      <Waveform rows={rows} tone={tone} shown={shown} />
    ) : c.slug === "small-expenses" ? (
      <SpendBars rows={rows} shown={shown} />
    ) : c.slug === "the-inside-years" ? (
      <NightRing shown={shown} tone={tone} />
    ) : (
      <CityBars shown={shown} />
    );

  const headline =
    c.slug === "small-expenses"
      ? { v: formatInr(spendRupees), k: "logged in this chapter" }
      : { v: formatCount(plays), k: "plays in this chapter" };

  const words = c.title.toUpperCase().split(/[\s,]+/).filter(Boolean);

  return (
    <section ref={ref} className={`${SURFACE[c.slug] ?? "surface-sand"} story-scene relative overflow-hidden`}>
      {/* oversized chapter numeral as a watermark */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-2 select-none numeral text-[26vw] leading-none md:right-10"
        style={{ color: `color-mix(in oklab, ${tone} 14%, transparent)` }}
      >
        {String(c.index + 1).padStart(2, "0")}
      </span>

      <div
        className={`relative mx-auto grid max-w-[100rem] gap-12 px-5 py-24 md:grid-cols-12 md:gap-12 md:px-10 md:py-32 ${
          shown ? "reveal reveal-in" : "reveal"
        }`}
      >
        <div className={`md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
          <p className="label-xs" style={{ color: tone }}>
            Chapter {String(c.index + 1).padStart(2, "0")}
            <span className="ml-3 text-muted">
              {c.years[0] === c.years[1] ? c.years[0] : `${c.years[0]} – ${c.years[1]}`}
            </span>
          </p>

          <h3 className="mt-6 display-xl">
            {words.map((w, k) => (
              <span
                key={k}
                className="block"
                style={k === words.length - 1 ? { color: tone } : undefined}
              >
                {w}
              </span>
            ))}
          </h3>

          <p className="mt-8 flex items-baseline gap-4">
            <span className="numeral text-[clamp(2rem,4.5vw,3.4rem)]">{headline.v}</span>
            <span className="label-xs text-muted">{headline.k}</span>
          </p>

          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-muted">{c.headline}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted opacity-80">{c.narration}</p>

          <Link
            to="/chapter/$slug"
            params={{ slug: c.slug }}
            className="group mt-10 inline-flex min-h-13 items-center gap-3 border-b pb-2 label-xs transition hover:gap-5"
            style={{ borderColor: tone, color: tone }}
          >
            Explore chapter
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className={`md:col-span-6 md:self-center ${flip ? "md:order-1 md:col-start-1" : "md:col-start-7"}`}>
          {visual}
          <p className="mt-5 border-t border-cloud/12 pt-3 label-xs text-muted opacity-70">{c.signature}</p>
        </div>
      </div>
    </section>
  );
}

export function ChapterJourney() {
  return (
    <div>
      <section className="surface-ivory">
        <div className="mx-auto max-w-[100rem] px-5 pb-6 pt-24 md:px-10 md:pt-32">
           <p className="label-xs text-muted">Scene 05 · The chapters · {formatCount(stats.musicPlaysTotal)} plays</p>
          <h2 className="mt-6 display-xl">
             SIX CHAPTERS,
             <span className="block text-muted">BOUND BY TIME.</span>
          </h2>
        </div>
      </section>
      {chapters.map((c, i) => (
        <ChapterScene key={c.slug} c={c} i={i} />
      ))}
    </div>
  );
}
