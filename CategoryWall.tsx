import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { receipts, stats, TYPE_META, TYPE_ORDER, type ReceiptType } from "@/lib/receipts";

const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
  rose: "var(--rose)",
  violet: "var(--violet)",
};

/** Offsets that break the grid: each category sits at its own height and indent. */
const PLACEMENT: Record<ReceiptType, string> = {
  music: "md:col-span-5 md:col-start-2",
  movie: "md:col-span-4 md:col-start-8 md:mt-16",
  place: "md:col-span-4 md:col-start-1 md:mt-10",
  purchase: "md:col-span-5 md:col-start-7",
  photo: "md:col-span-3 md:col-start-2 md:mt-12",
  message: "md:col-span-4 md:col-start-6 md:mt-6",
  search: "md:col-span-3 md:col-start-10 md:mt-14",
  event: "md:col-span-4 md:col-start-3",
  note: "md:col-span-5 md:col-start-7 md:mt-8",
};

export function CategoryWall() {
  const { ref, shown } = useReveal<HTMLDivElement>(0.06);
  const [hot, setHot] = useState<ReceiptType | null>(null);

  const previews = useMemo(() => {
    const out = new Map<string, string>();
    for (const t of TYPE_ORDER) {
      const r = receipts.find((x) => x.type === t && x.title.length > 3);
      if (r) out.set(t, r.title);
    }
    return out;
  }, []);

  const max = Math.max(...TYPE_ORDER.map((t) => stats.typeCounts[t] ?? 0), 1);

  return (
    <section ref={ref} id="explore" className="surface-ivory story-scene">
      <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
          <p className="label-xs text-muted">Scene 07 · Explore</p>
          <h2 className="mt-6 display-xl">
            WHAT KIND
              <span className="block text-muted">THE ARCHIVE, OPENED.</span>
          </h2>
          </div>
          <Link to="/explore" className="label-xs border-b border-cloud/40 pb-1 text-muted transition hover:text-cloud">
            Follow the threads →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 md:mt-24 md:grid-cols-12 md:gap-y-4">
          {TYPE_ORDER.map((t, i) => {
            const meta = TYPE_META[t];
            const tone = TONE_VAR[meta.tone] ?? "var(--accent)";
            const count = stats.typeCounts[t] ?? 0;
            const scale = 0.62 + (count / max) * 0.38;
            const live = hot === t;
            return (
              <Link
                key={t}
                to="/explore"
                search={{ type: t, q: "", night: false, chapter: "" }}
                onMouseEnter={() => setHot(t)}
                onMouseLeave={() => setHot(null)}
                onFocus={() => setHot(t)}
                onBlur={() => setHot(null)}
                style={{ transitionDelay: `${i * 70}ms` }}
                className={`group block transition-opacity duration-300 ${PLACEMENT[t]} ${
                  hot && !live ? "opacity-40" : "opacity-100"
                } ${shown ? "reveal reveal-in" : "reveal"}`}
              >
                <span className="label-xs flex items-center gap-2" style={{ color: tone }}>
                  <span aria-hidden="true" className="text-base">
                    {meta.glyph}
                  </span>
                  {meta.label}
                </span>
                <span
                  className="mt-2 block numeral transition-all duration-300 group-hover:translate-x-1"
                  style={{
                    fontSize: `calc(${scale} * clamp(2.6rem, 7vw, 6rem))`,
                    color: live ? tone : "var(--cloud)",
                  }}
                >
                  {count.toLocaleString("en-US")}
                </span>
                <span
                  className={`mt-3 block max-w-xs truncate font-mono text-[11px] text-muted transition-opacity duration-300 ${
                    live ? "opacity-100" : "opacity-70"
                  }`}
                >
                  e.g. {previews.get(t) ?? "—"}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-3 block h-px origin-left transition-transform duration-500"
                  style={{ background: tone, transform: `scaleX(${live ? 1 : 0.12})` }}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
