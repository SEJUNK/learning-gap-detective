import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useMemo, useRef } from "react";
import { coverage, formatCount, summary, YEARS } from "@/lib/data/summary";
import { moments } from "@/lib/receipts";

/**
 * The hero visual is an abstract data landscape built from the real archive:
 *  - a listening waveform drawn from monthly play counts (music),
 *  - glowing nodes where spending was logged (purchases),
 *  - small location dots where card activity appears (places),
 *  - a scatter of faint fragment marks whose density follows the data.
 * Everything is derived from aggregates — no record-level rendering.
 */
type Month = { key: string; spotify: number; spend: number; move: number; total: number };

function months(): Month[] {
  const s = summary.sources.spotify.byMonth;
  const h = summary.sources.household.byMonth;
  const i = summary.sources.india.byMonth;
  const keys = new Set([...Object.keys(s), ...Object.keys(h), ...Object.keys(i)]);
  return [...keys]
    .sort()
    .map((key) => {
      const spotify = s[key] ?? 0;
      const spend = h[key] ?? 0;
      const move = i[key] ?? 0;
      return { key, spotify, spend, move, total: spotify + spend + move };
    });
}

function wavePath(values: number[], max: number, base: number, amp: number) {
  const n = values.length;
  if (!n) return "";
  const pts = values.map((v, i) => {
    const x = (i / (n - 1)) * 100;
    const y = base - (v / max) * amp;
    return [x, y] as const;
  });
  let d = `M ${pts[0]![0].toFixed(2)} ${pts[0]![1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const p = pts[i - 1]!;
    const c = pts[i]!;
    const mx = ((p[0] + c[0]) / 2).toFixed(2);
    d += ` C ${mx} ${p[1].toFixed(2)}, ${mx} ${c[1].toFixed(2)}, ${c[0].toFixed(2)} ${c[1].toFixed(2)}`;
  }
  return d;
}

function scatter(ms: Month[]) {
  let seed = 20130708;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const max = Math.max(...ms.map((m) => m.total), 1);
  const out: { x: number; y: number; r: number; delay: number }[] = [];
  ms.forEach((m, i) => {
    const density = m.total / max;
    const count = 1 + Math.round(density * 6);
    for (let k = 0; k < count; k += 1) {
      out.push({
        x: ((i + rnd()) / ms.length) * 100,
        y: 4 + rnd() * 92,
        r: 0.16 + density * 0.34 + rnd() * 0.16,
        delay: rnd() * 6,
      });
    }
  });
  return out;
}

export function HeroField() {
  const fieldRef = useRef<HTMLElement | null>(null);
  const landscapeRef = useRef<SVGSVGElement | null>(null);
  const ms = useMemo(months, []);
  const dots = useMemo(() => scatter(ms), [ms]);
  const maxPlays = Math.max(...ms.map((m) => m.spotify), 1);
  const maxSpend = Math.max(...ms.map((m) => m.spend + m.move), 1);

  const wave = useMemo(() => wavePath(ms.map((m) => m.spotify), maxPlays, 74, 34), [ms, maxPlays]);
  const waveSoft = useMemo(() => wavePath(ms.map((m) => m.spotify), maxPlays, 84, 20), [ms, maxPlays]);

  const spendNodes = useMemo(
    () =>
      ms
        .map((m, i) => ({ ...m, i }))
        .filter((m) => m.spend > 0)
        .map((m) => ({
          x: (m.i / (ms.length - 1)) * 100,
          y: 74 - (m.spend / maxSpend) * 26,
          r: 0.35 + (m.spend / maxSpend) * 0.9,
        })),
    [ms, maxSpend],
  );

  const placeNodes = useMemo(
    () =>
      ms
        .map((m, i) => ({ ...m, i }))
        .filter((m) => m.move > 0)
        .map((m) => ({
          x: (m.i / (ms.length - 1)) * 100,
          y: 88 - (m.move / maxSpend) * 22,
          r: 0.3 + (m.move / maxSpend) * 0.8,
        })),
    [ms, maxSpend],
  );

  const totalSpend = (summary.sources.household.spend ?? 0) + (summary.sources.india.spend ?? 0);
  const yearTotals = useMemo(() => coverage().map((c) => c.total), []);
  const yearMax = Math.max(...yearTotals, 1);

  return (
    <section
      ref={fieldRef}
      id="life"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const rect = fieldRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (!landscapeRef.current) return;
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
        landscapeRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }}
      onPointerLeave={() => {
        if (landscapeRef.current) landscapeRef.current.style.transform = "translate3d(0, 0, 0)";
      }}
      className="surface-dark-base surface-noir story-scene archival-grain relative isolate overflow-hidden"
    >
      {/* layered light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 55% at 18% 8%, color-mix(in oklab, var(--violet) 26%, transparent), transparent 70%), radial-gradient(60% 50% at 92% 30%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 72%), radial-gradient(90% 60% at 60% 112%, color-mix(in oklab, var(--mint) 14%, transparent), transparent 70%)",
        }}
      />

      {/* the data landscape */}
      <svg
        ref={landscapeRef}
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ transition: "transform 280ms ease-out" }}
      >
        <defs>
          <linearGradient id="hero-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--violet)" stopOpacity="0.15" />
            <stop offset="45%" stopColor="var(--violet)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--violet)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--violet)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* faint fragment scatter */}
        <g>
          {dots.map((d, i) => (
            <circle
              key={i}
              cx={d.x.toFixed(2)}
              cy={d.y.toFixed(2)}
              r={d.r.toFixed(3)}
              fill="var(--cloud)"
              fillOpacity="0.22"
              className="signal-pulse"
              style={{ animationDelay: `${d.delay.toFixed(2)}s` }}
            />
          ))}
        </g>

        {/* listening waveform */}
        <path d={`${wave} L 100 100 L 0 100 Z`} fill="url(#hero-fill)" />
        <path d={wave} fill="none" stroke="url(#hero-wave)" strokeWidth="0.45" vectorEffect="non-scaling-stroke" />
        <path
          d={waveSoft}
          fill="none"
          stroke="var(--violet)"
          strokeOpacity="0.3"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />

        {/* spending nodes */}
        {spendNodes.map((n, i) => (
          <circle key={`s${i}`} cx={n.x.toFixed(2)} cy={n.y.toFixed(2)} r={n.r.toFixed(3)} fill="var(--gold)" fillOpacity="0.75" />
        ))}
        {/* place dots */}
        {placeNodes.map((n, i) => (
          <circle key={`p${i}`} cx={n.x.toFixed(2)} cy={n.y.toFixed(2)} r={n.r.toFixed(3)} fill="var(--mint)" fillOpacity="0.7" />
        ))}
      </svg>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
        style={{ background: "linear-gradient(to top, var(--noir) 12%, transparent)" }}
      />

      {/* composition */}
      <div className="relative mx-auto flex min-h-[calc(100svh-3.4rem)] max-w-[100rem] flex-col justify-between gap-10 px-5 pb-8 pt-16 md:px-10 md:pb-10 md:pt-20">
        <div>
          <p className="label-xs text-muted">An interactive archive · 2013 → 2024</p>

          <h1 className="fragment-in mt-6 display-mega">
            <span className="block">RECEIPTS</span>
            <span className="display-fade block italic">
              OF A LIFE
            </span>
          </h1>

          <p className="mt-6 max-w-xl font-display text-[clamp(1.15rem,2.4vw,1.85rem)] leading-[1.25]">
            Eleven years of small things,
            <span className="block text-muted">read as one life.</span>
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <div className="mb-7 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-5">
              <span className="numeral fragment-in whitespace-nowrap text-[clamp(3.6rem,10vw,9rem)] text-accent">{formatCount(summary.combined.count)}</span>
              <span className="label-xs text-muted sm:mb-2">source records<br /><span className="normal-case">not curated fragments</span></span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/chapter/$slug"
                params={{ slug: "first-signals" }}
                className="editorial-action group"
              >
                Enter the story
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/explore"
                className="inline-flex min-h-14 items-center border-b border-cloud/40 px-2 label-xs text-muted transition hover:border-cloud hover:text-cloud"
              >
                Explore fragments
              </Link>
            </div>
            <a href="#fragments" className="mt-6 inline-flex min-h-11 items-center gap-2 label-xs text-muted transition hover:text-cloud">Begin <ArrowDown className="size-3.5" aria-hidden="true" /></a>
          </div>

          {/* thin visual timeline of the whole archive */}
          <div>
            <div className="flex h-20 items-end gap-[3px]" aria-hidden="true">
              {YEARS.map((y, i) => (
                <span key={y} className="flex flex-1 flex-col items-stretch gap-2">
                  <span
                    className="block w-full"
                    style={{
                      height: `${Math.max(3, (yearTotals[i]! / yearMax) * 56)}px`,
                      background: "var(--cloud)",
                      opacity: 0.25 + (yearTotals[i]! / yearMax) * 0.6,
                    }}
                  />
                </span>
              ))}
            </div>
             <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 border-t border-cloud/20 pt-3 label-xs text-muted">
              <span>{YEARS[0]}</span>
               <span className="min-w-0 text-center leading-relaxed opacity-70">
                {formatCount(summary.sources.spotify.listeningHours ?? 0)} hours listened ·{" "}
                {`₹${(totalSpend / 10000000).toFixed(1)}Cr`} logged · {moments.length} threads
              </span>
              <span>{YEARS[YEARS.length - 1]}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
