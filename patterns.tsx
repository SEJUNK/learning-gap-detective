import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import {
  AmountCloud,
  ArtistRhythm,
  Balance,
  DenseDays,
  HourClock,
  PlaceRecurrence,
  TONE_VAR,
} from "@/components/story/patternViz";
import { formatCount, summary } from "@/lib/data/summary";
import { moments, patterns, receipts, stats } from "@/lib/receipts";

export const Route = createFileRoute("/patterns")({
  head: () => ({
    meta: [
      { title: "Seven exhibits — what eleven years of records keep repeating" },
      {
        name: "description",
        content:
          "An exhibition of seven patterns read from three datasets: late-night listening, small amounts, shifting attention, dense days, loyalty, returning places and the shape of a week.",
      },
      { property: "og:title", content: "Seven exhibits — Receipts of a Life" },
      {
        property: "og:description",
        content: "Seven patterns read from eleven years of listening, spending and card records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Patterns,
});

type Surface = "noir" | "night" | "indigo" | "ivory" | "sand" | "plum";

const SURFACE_CLASS: Record<Surface, string> = {
  noir: "surface-dark-base surface-noir",
  night: "surface-dark-base surface-night",
  indigo: "surface-dark-base surface-indigo",
  plum: "surface-dark-base surface-plum",
  ivory: "surface-ivory",
  sand: "surface-sand",
};

/** One exhibit: oversized number, stacked title, custom visual, asymmetric. */
function Exhibit({
  index,
  surface,
  value,
  words,
  tone,
  body,
  caption,
  visual,
  align,
}: {
  index: number;
  surface: Surface;
  value: string;
  words: string[];
  tone: string;
  body: string;
  caption: string;
  visual: (shown: boolean) => React.ReactNode;
  align: "left" | "right";
}) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.12);
  const textSide = align === "left" ? "md:col-span-5 md:col-start-1" : "md:col-span-5 md:col-start-8 md:order-2";
  const visualSide = align === "left" ? "md:col-span-6 md:col-start-7" : "md:col-span-6 md:col-start-1 md:order-1";

  return (
    <section ref={ref} className={`${SURFACE_CLASS[surface]} relative overflow-hidden`}>
      <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-36">
        <div className={`grid items-center gap-12 md:grid-cols-12 ${shown ? "reveal reveal-in" : "reveal"}`}>
          <div className={textSide}>
            <p className="label-xs text-muted">Exhibit {String(index).padStart(2, "0")}</p>
            <div role="group" aria-label={`${value}: ${words.join(" ")}`}>
            <p className="mt-6 whitespace-nowrap numeral-mega" aria-hidden="true" style={{ color: tone }}>
              {value}
            </p>
            <h2 className="mt-6 display-lg" aria-hidden="true">
              {words.map((w, i) => (
                <span key={i} className="block">
                  {w}
                </span>
              ))}
            </h2>
            </div>
            <p className="mt-7 max-w-md text-sm leading-relaxed text-muted md:text-base">{body}</p>
            <p className="mt-7 label-xs text-muted opacity-70">{caption}</p>
          </div>
          <div className={visualSide}>{visual(shown)}</div>
        </div>
      </div>
    </section>
  );
}

/** Every fragment by weekday — the bars barely move, which is the point. */
function WeekShape({ shown, bars }: { shown: boolean; bars: { label: string; value: number }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex h-56 items-end gap-3 md:h-72">
      {bars.map((b, i) => (
        <span key={b.label} className="flex flex-1 flex-col items-center justify-end gap-3">
          <span className="font-mono text-[11px] text-muted">{formatCount(b.value)}</span>
          <span
            className="block w-full transition-all duration-[1100ms]"
            style={{
              height: shown ? `${(b.value / max) * 100}%` : "0%",
              background: "var(--mint)",
              opacity: 0.45 + (b.value / max) * 0.55,
              transitionDelay: `${i * 70}ms`,
            }}
          />
          <span className="label-xs text-muted">{b.label}</span>
        </span>
      ))}
    </div>
  );
}

function Patterns() {
  const [denseMonth, setDenseMonth] = useState<string | null>(null);
  const get = (id: string) => patterns.find((p) => p.id === id);
  const night = get("after-midnight");
  const small = get("small-things");
  const shift = get("attention-shift");
  const week = get("week-shape");
  const loyalty = get("loyalty");
  const places = get("returning-places");

  return (
    <div>
      {/* Exhibition title wall */}
      <section className="surface-dark-base surface-noir relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 0%, color-mix(in oklab, var(--violet) 26%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-[100rem] gap-12 px-5 pb-24 pt-20 md:grid-cols-12 md:px-10 md:pb-32 md:pt-28">
          <div className="md:col-span-7">
            <p className="label-xs text-muted">Raw records → insight</p>
            <h1 className="mt-8 font-display text-[clamp(4rem,10vw,9.5rem)] font-semibold leading-[0.84]">
              <span className="block whitespace-nowrap">SEVEN</span>
              <span className="display-fade block whitespace-nowrap italic">
                EXHIBITS
              </span>
            </h1>
          </div>
          <div className="flex flex-col justify-end md:col-span-4 md:col-start-9">
            <p className="text-sm leading-relaxed text-muted md:text-base">
              None of these numbers is a field in the data. Each one was found by reading the three archives
              against each other — {formatCount(summary.sources.spotify.count)} plays, a household ledger and a
              card trail, all measured in your browser.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-cloud/15 pt-6">
              <div>
                <dt className="label-xs text-muted">Raw records</dt>
                 <dd className="mt-2 whitespace-nowrap numeral text-3xl">{formatCount(summary.combined.count)}</dd>
              </div>
              <div>
                <dt className="label-xs text-muted">Curated fragments</dt>
                 <dd className="mt-2 whitespace-nowrap numeral text-3xl">{formatCount(receipts.length)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {night ? (
        <Exhibit
          index={1}
          surface="night"
          value={night.value}
          words={["THE", "2 AM", "HABIT"]}
          tone={TONE_VAR[night.accent] ?? "var(--violet)"}
          body={night.body}
          caption="Every play, folded into 24 hours · the lit spokes are 11 PM to 5 AM"
          visual={(shown) => (
            <div className="flex justify-center">
              <HourClock shown={shown} tone={TONE_VAR[night.accent] ?? "var(--violet)"} />
            </div>
          )}
          align="left"
        />
      ) : null}

      {small ? (
        <Exhibit
          index={2}
          surface="sand"
          value={small.value}
          words={["A LIFE OF", "SMALL", "AMOUNTS"]}
          tone={TONE_VAR[small.accent] ?? "var(--gold)"}
          body={small.body}
          caption="Household ledger, 2015 – 2018 · one mark per share of the entries"
          visual={(shown) => <AmountCloud shown={shown} />}
          align="right"
        />
      ) : null}

      {shift ? (
        <Exhibit
          index={3}
          surface="indigo"
          value={shift.value}
          words={["ATTENTION", "SHIFTED"]}
          tone={TONE_VAR[shift.accent] ?? "var(--violet)"}
          body={`OBSERVED DATA — ${shift.body}`}
          caption="INTERPRETATION — later travel activity overlaps this shift; the archive does not prove that one caused the other."
          visual={(shown) => <Balance shown={shown} />}
          align="left"
        />
      ) : null}

      <Exhibit
        index={4}
        surface="ivory"
        value={String(moments.length)}
        words={["DAYS WHERE", "EVERYTHING", "HAPPENED AT ONCE"]}
        tone="var(--mint)"
        body="Days on which four or more different kinds of record landed together. They cluster exactly where the three archives overlap — and thin out when only the music is left."
        caption="One cell per month, brighter where dense days pile up"
        visual={(shown) => (
          <div>
            <DenseDays shown={shown} onPick={setDenseMonth} />
            {denseMonth ? (
              <div className="mt-6 border-t border-cloud/15 pt-4" aria-live="polite">
                <p className="label-xs text-muted">Dense days in {denseMonth}</p>
                {moments.filter((moment) => moment.day.startsWith(denseMonth)).map((moment) => (
                  <p key={moment.day} className="mt-2 font-display text-lg">{moment.day} · {moment.items.length} fragments · {moment.types.length} categories</p>
                ))}
              </div>
            ) : <p className="mt-5 label-xs text-muted">Select a lit month to open its dense days</p>}
          </div>
        )}
        align="right"
      />

      {loyalty ? (
        <Exhibit
          index={5}
          surface="noir"
          value={loyalty.value}
          words={["LOYALTY", "OVER", "NOVELTY"]}
          tone={TONE_VAR[loyalty.accent] ?? "var(--rose)"}
          body={loyalty.body}
          caption={`Top twelve artists of ${formatCount(summary.sources.spotify.artists ?? 0)}`}
          visual={(shown) => <ArtistRhythm shown={shown} />}
          align="left"
        />
      ) : null}

      {places ? (
        <Exhibit
          index={6}
          surface="ivory"
          value={places.value}
          words={["PLACES THAT", "KEEP", "RETURNING"]}
          tone={TONE_VAR[places.accent] ?? "var(--mint)"}
          body={places.body}
          caption="Visits per city, scaled against the most revisited place"
          visual={(shown) => <PlaceRecurrence shown={shown} />}
          align="right"
        />
      ) : null}

      {week ? (
        <Exhibit
          index={7}
          surface="plum"
          value={week.value}
          words={["THE SHAPE", "OF A WEEK"]}
          tone={TONE_VAR[week.accent] ?? "var(--mint)"}
          body={week.body}
          caption="Every curated fragment, sorted by weekday"
          visual={(shown) => <WeekShape shown={shown} bars={week.bars ?? []} />}
          align="left"
        />
      ) : null}

      {/* Closing */}
      <section className="surface-dark-base surface-night">
        <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
          <p className="label-xs text-muted">Where the patterns come from</p>
          <h2 className="mt-8 display-xl">
            NOW GO READ
            <span className="block" style={{ color: "color-mix(in oklab, var(--cloud) 42%, transparent)" }}>
              THE RECORDS THEMSELVES.
            </span>
          </h2>
          <ul className="mt-10 flex flex-col gap-1.5 text-sm text-muted">
            {stats.sources.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
            Photos, saved messages and searches are not their own records in these archives — they are inferred
            from geotagged travel, entertainment bookings and first-listen moments, and every inferred fragment
            says so. Card numbers, names, dates of birth, street addresses and precise coordinates never leave
            the source files.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/archive"
              className="group inline-flex min-h-14 items-center gap-3 bg-cloud px-8 label-xs text-ink transition hover:gap-5"
            >
              Open the archive
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex min-h-14 items-center border-b border-cloud/40 px-2 label-xs text-muted transition hover:border-cloud hover:text-cloud"
            >
              Follow the threads
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
