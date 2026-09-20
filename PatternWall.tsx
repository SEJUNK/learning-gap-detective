import { Link } from "@tanstack/react-router";
import { useReveal } from "@/hooks/useReveal";
import { AmountCloud, Balance, DenseDays, HourClock, TONE_VAR } from "@/components/story/patternViz";
import { moments, patterns } from "@/lib/receipts";

function PatternScene({
  value,
  words,
  tone,
  body,
  visual,
  shown,
  flip,
}: {
  value: string;
  words: string[];
  tone: string;
  body: string;
  visual: React.ReactNode;
  shown: boolean;
  flip: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={`${value}: ${words.join(" ")}`}
      className={`grid items-center gap-10 border-t border-cloud/12 py-16 md:grid-cols-12 md:gap-12 md:py-24 ${
        shown ? "reveal reveal-in" : "reveal"
      }`}
    >
      <div className={`md:col-span-5 ${flip ? "md:order-2 md:col-start-8" : ""}`}>
        <p className="whitespace-nowrap numeral-mega" aria-hidden="true" style={{ color: tone }}>
          {value}
        </p>
        <h3 className="mt-6 display-lg" aria-hidden="true">
          {words.map((w, i) => (
            <span key={i} className="block">
              {w}
            </span>
          ))}
        </h3>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      </div>
      <div className={`md:col-span-6 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-7"}`}>{visual}</div>
    </div>
  );
}

export function PatternWall() {
  const { ref, shown } = useReveal<HTMLDivElement>(0.06);
  const get = (id: string) => patterns.find((p) => p.id === id);
  const night = get("after-midnight");
  const small = get("small-things");
  const shift = get("attention-shift");

  return (
    <section ref={ref} id="patterns" className="surface-dark-base surface-noir story-scene">
      <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
          <p className="label-xs text-muted">Scene 06 · The patterns</p>
          <h2 className="mt-6 display-xl">
            WHAT THE DATA
            <span className="block" style={{ color: "color-mix(in oklab, var(--cloud) 42%, transparent)" }}>
              KEEPS REPEATING
            </span>
          </h2>
          </div>
          <Link to="/patterns" className="label-xs border-b border-cloud/40 pb-1 text-muted transition hover:text-cloud">
            All patterns →
          </Link>
        </div>

        <div className="mt-14">
          {night ? (
            <PatternScene
              value={night.value}
              words={["THE", "2 AM", "HABIT"]}
              tone={TONE_VAR[night.accent] ?? "var(--violet)"}
              body={night.body}
              visual={
                <div className="flex justify-center">
                  <HourClock shown={shown} tone={TONE_VAR[night.accent] ?? "var(--violet)"} />
                </div>
              }
              shown={shown}
              flip={false}
            />
          ) : null}

          {small ? (
            <PatternScene
              value={small.value}
              words={["A LIFE OF", "SMALL", "AMOUNTS"]}
              tone={TONE_VAR[small.accent] ?? "var(--gold)"}
              body={small.body}
              visual={<AmountCloud shown={shown} />}
              shown={shown}
              flip
            />
          ) : null}

          {shift ? (
            <PatternScene
              value={shift.value}
              words={["ATTENTION", "MOVED"]}
              tone={TONE_VAR[shift.accent] ?? "var(--violet)"}
              body={shift.body}
              visual={<Balance shown={shown} />}
              shown={shown}
              flip={false}
            />
          ) : null}

          <PatternScene
            value={String(moments.length)}
            words={["DAYS WHERE", "EVERYTHING", "HAPPENED AT ONCE"]}
            tone="var(--mint)"
            body="Each mark is a month; brighter means more days on which four or more different kinds of record landed together. They cluster exactly where the three archives overlap."
            visual={<DenseDays shown={shown} />}
            shown={shown}
            flip
          />
        </div>
      </div>
    </section>
  );
}
