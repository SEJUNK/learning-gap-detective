import { useMemo } from "react";
import { formatCount, summary, YEARS } from "@/lib/data/summary";
import { moments, receipts, stats } from "@/lib/receipts";

export const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
  rose: "var(--rose)",
  violet: "var(--violet)",
};

/** 24 hours of listening as a radial clock — the 11 PM – 5 AM band is lit. */
export function HourClock({ shown, tone = "var(--violet)" }: { shown: boolean; tone?: string }) {
  const hours = summary.music.hourHistogram;
  const max = Math.max(...hours, 1);
  return (
    <div>
    <svg
      viewBox="-62 -62 124 124"
      className="h-64 w-64 md:h-80 md:w-80"
      role="img"
      aria-label="Share of listening by hour of day, with 11 PM to 5 AM highlighted"
    >
      <circle r="26" fill="none" stroke="currentColor" strokeOpacity="0.14" />
      {hours.map((v, i) => {
        const night = i <= 5 || i >= 23;
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const inner = 27;
        const outer = inner + (shown ? (v / max) * 32 : 0);
        return (
          <line
            key={i}
            x1={(Math.cos(a) * inner).toFixed(3)}
            y1={(Math.sin(a) * inner).toFixed(3)}
            x2={(Math.cos(a) * outer).toFixed(3)}
            y2={(Math.sin(a) * outer).toFixed(3)}
            stroke={night ? tone : "currentColor"}
            strokeOpacity={night ? 1 : 0.24}
            strokeWidth="3.6"
            strokeLinecap="round"
            style={{ transition: "all 900ms cubic-bezier(0.22,0.68,0,1)", transitionDelay: `${i * 30}ms` }}
          />
        );
      })}
      {[0, 6, 12, 18].map((h) => {
        const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
        return (
          <text
            key={h}
            x={(Math.cos(a) * 16).toFixed(3)}
            y={(Math.sin(a) * 16 + 2).toFixed(3)}
            textAnchor="middle"
            fill="currentColor"
            fillOpacity="0.5"
            style={{ font: "500 6px var(--font-mono)" }}
          >
            {h}
          </text>
        );
      })}
    </svg>
    <p className="sr-only">Hourly listening counts: {hours.map((value, hour) => `${String(hour).padStart(2, "0")}:00, ${formatCount(value)} plays`).join("; ")}.</p>
    </div>
  );
}

/** Household entries as a dot cloud: many tiny repeats, a few large ones. */
export function AmountCloud({ shown }: { shown: boolean }) {
  const dots = useMemo(() => {
    let seed = 424242;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const actual = receipts.filter((r) => r.type === "purchase" && r.amount && r.amount > 0).slice(0, 180);
    const maxAmount = Math.max(...actual.map((r) => r.amount ?? 0), 1);
    const out = actual.map((r) => ({ x: rnd() * 100, y: 94 - Math.min(90, Math.log10((r.amount ?? 1) + 1) / Math.log10(maxAmount + 1) * 88), r: 0.7 + rnd() * 1.8, o: 0.35 + rnd() * 0.6, title: r.title, amount: r.amount ?? 0 }));
    return out;
  }, []);

  return (
    <div>
      <svg viewBox="0 0 100 100" className="h-60 w-full" role="img" aria-label="A privacy-safe sample of 180 actual purchase amounts; marks rise as amounts increase">
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x.toFixed(2)}
            cy={d.y.toFixed(2)}
            r={d.r.toFixed(2)}
            fill="var(--gold)"
            fillOpacity={shown ? d.o : 0}
            aria-hidden="true"
            style={{ transition: "fill-opacity 900ms", transitionDelay: `${(i % 40) * 20}ms` }}
          />
        ))}
      </svg>
      <p className="mt-2 label-xs text-muted opacity-70">
        A privacy-safe sample of actual purchase amounts · lower marks are smaller amounts
      </p>
    </div>
  );
}

/** Two halves of the listening archive, weighed against each other. */
export function Balance({ shown }: { shown: boolean }) {
  const [early, late] = useMemo(() => {
    let a = 0;
    let b = 0;
    for (const y of YEARS) {
      const v = summary.sources.spotify.byYear[String(y)] ?? 0;
      if (y <= 2018) a += v;
      else b += v;
    }
    return [a, b] as const;
  }, []);
  const total = early + late || 1;
  return (
    <div className="flex h-48 items-end gap-6 md:h-60">
      {[
        { k: "2013 – 2018", v: early, tone: "color-mix(in oklab, var(--cloud) 32%, transparent)" },
        { k: "2019 – 2024", v: late, tone: "var(--violet)" },
      ].map((r) => (
        <span key={r.k} className="flex flex-1 flex-col justify-end gap-3">
          <span className="numeral text-2xl">{formatCount(r.v)}</span>
          <span
            className="block transition-all duration-[1100ms]"
            style={{ height: shown ? `${(r.v / total) * 100}%` : "0%", background: r.tone }}
          />
          <span className="label-xs text-muted">{r.k}</span>
        </span>
      ))}
    </div>
  );
}

/** Where the dense days fall: a year × month heat grid. */
export function DenseDays({ shown, onPick }: { shown: boolean; onPick?: (month: string) => void }) {
  const grid = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of moments) {
      const key = m.day.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, []);
  const max = Math.max(...grid.values(), 1);
  return (
    <div className="space-y-1.5">
      {YEARS.map((y) => (
        <div key={y} className="flex items-center gap-2">
          <span className="w-10 shrink-0 font-mono text-[10px] text-muted">{y}</span>
          <span className="flex flex-1 gap-1.5">
            {Array.from({ length: 12 }, (_, m) => {
              const n = grid.get(`${y}-${String(m + 1).padStart(2, "0")}`) ?? 0;
              return (
                <button
                  type="button"
                  key={m}
                  title={n ? `${n} dense days` : undefined}
                  aria-label={`${y}-${String(m + 1).padStart(2, "0")}: ${n} dense days`}
                  disabled={!n}
                  onClick={() => n && onPick?.(`${y}-${String(m + 1).padStart(2, "0")}`)}
                  className="h-6 min-w-6 flex-1 transition-all duration-500 disabled:cursor-default"
                  style={{
                    background: n ? "var(--mint)" : "currentColor",
                    opacity: shown ? (n ? 0.3 + (n / max) * 0.7 : 0.07) : 0.07,
                  }}
                />
              );
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Artist repetition as a rhythm of bars — loyalty against a long tail. */
export function ArtistRhythm({ shown }: { shown: boolean }) {
  const top = stats.topArtists.slice(0, 12);
  const max = top[0]?.plays ?? 1;
  const total = stats.musicPlaysTotal || 1;
  return (
    <ul className="space-y-2">
      {top.map((a, i) => (
        <li key={a.name} title={`${a.name}: ${formatCount(a.plays)} plays, ${((a.plays / total) * 100).toFixed(1)}% of listening`} className="grid grid-cols-[1fr_auto] items-center gap-3">
          <span className="min-w-0">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate font-display text-base">{a.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted">{formatCount(a.plays)}</span>
            </span>
            <span
              className="mt-1.5 block h-[3px] transition-all duration-[1100ms]"
              style={{
                width: shown ? `${(a.plays / max) * 100}%` : "0%",
                background: "var(--rose)",
                opacity: 1 - i * 0.055,
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Recurrence of places: one mark per visit, so return trips are visible. */
export function PlaceRecurrence({ shown }: { shown: boolean }) {
  const top = stats.topCities.slice(0, 12);
  const max = top[0]?.visits ?? 1;
  return (
    <ul className="space-y-3">
      {top.map((c, i) => (
        <li key={c.name} title={`${c.name}: ${c.visits} returns, ${Math.round((c.visits / max) * 100)}% of the leading place`} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
          <span className="truncate label-xs text-muted">{c.name}</span>
          <span className="flex flex-wrap gap-[3px]">
            {Array.from({ length: Math.max(1, Math.round((c.visits / max) * 34)) }, (_, k) => (
              <span
                key={k}
                aria-hidden="true"
                className="block size-[5px] rounded-full transition-opacity duration-500"
                style={{
                  background: "var(--mint)",
                  opacity: shown ? 0.95 - k * 0.012 : 0,
                  transitionDelay: `${(i * 8 + k) * 12}ms`,
                }}
              />
            ))}
          </span>
          <span className="font-mono text-[11px] text-muted">{c.visits}×</span>
        </li>
      ))}
    </ul>
  );
}
