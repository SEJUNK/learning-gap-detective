import { useReveal } from "@/hooks/useReveal";
import { formatDate, formatTime, TYPE_META, type Receipt } from "@/lib/receipts";

const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
  rose: "var(--rose)",
  violet: "var(--violet)",
};

/**
 * Three fragments presented as archival artifacts: a music card, a place
 * ticket and a torn receipt note. Clicking re-anchors the discovered thread.
 */
export function FragmentArtifacts({
  items,
  onPull,
}: {
  items: Receipt[];
  onPull: (r: Receipt) => void;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.15);
  const skins = ["artifact-paper", "artifact-ticket", "artifact-receipt"];
  const tilts = ["md:-rotate-[0.7deg]", "md:rotate-[0.5deg]", "md:-rotate-[0.4deg]"];
  const offsets = ["md:mt-0", "md:mt-10", "md:mt-4"];

  return (
    <div ref={ref} className="grid gap-8 md:grid-cols-3 md:gap-6">
      {items.map((rec, i) => {
        const meta = TYPE_META[rec.type];
        const tone = TONE_VAR[meta.tone] ?? "var(--accent)";
        return (
          <button
            key={rec.id}
            type="button"
            onClick={() => onPull(rec)}
            style={{ transitionDelay: `${i * 110}ms` }}
            className={`${skins[i % 3]} ${tilts[i % 3]} ${offsets[i % 3]} group p-6 text-left transition duration-500 hover:-translate-y-1.5 hover:rotate-0 hover:shadow-lift ${
              shown ? "reveal reveal-in" : "reveal"
            }`}
          >
            <span className="label-xs flex items-center justify-between gap-3" style={{ color: tone }}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="text-base">
                  {meta.glyph}
                </span>
                {meta.label}
              </span>
              <span className="text-muted">{formatTime(rec.ts)}</span>
            </span>

            <span className="mt-6 block font-display text-[1.4rem] leading-[1.15]">{rec.title}</span>
            {rec.subtitle ? <span className="mt-2 block text-sm text-muted">{rec.subtitle}</span> : null}
            {rec.note ?? rec.detail ? (
              <span className="mt-4 block text-sm leading-relaxed text-muted">{rec.note ?? rec.detail}</span>
            ) : null}

            <span className="mt-8 flex items-center justify-between gap-3 border-t border-cloud/12 pt-4 label-xs text-muted">
              <span>{formatDate(rec.ts)}</span>
              <span className="transition group-hover:text-cloud">Pull this thread ↓</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
