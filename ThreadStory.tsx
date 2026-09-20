import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ReceiptDetail } from "@/components/receipt-bits";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useReveal } from "@/hooks/useReveal";
import { findConnections, formatDate, formatTime, TYPE_META, type Receipt } from "@/lib/receipts";

const TONE_VAR: Record<string, string> = {
  accent: "var(--accent)",
  gold: "var(--gold)",
  mint: "var(--mint)",
  rose: "var(--rose)",
  violet: "var(--violet)",
};

/**
 * The discovered thread. No card wraps it — the thread itself is the design:
 * a drawn spine, nodes on the spine, content alternating around it.
 */
export function ThreadStory({ anchor, onSelect }: { anchor: Receipt; onSelect: (r: Receipt) => void }) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.12);
  const [hot, setHot] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const dialog = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const links = useMemo(() => findConnections(anchor, 5), [anchor]);
  const nodes: { r: Receipt; reason?: string }[] = [
    { r: anchor },
    ...links.map((l) => ({ r: l.receipt, reason: l.reason })),
  ];
  const hotNode = nodes.find((node) => node.r.id === hot);

  const closeReader = useCallback(() => setOpen(false), []);
  useDialogFocus(open, dialog, closeButton, trigger, closeReader);

  return (
    <section ref={ref} className="surface-dark-base surface-plum story-scene archival-grain relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 85% 0%, color-mix(in oklab, var(--violet) 26%, transparent), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
             <p className="label-xs text-muted">Scene 03 · The thread</p>
             <h2 id="thread-title" tabIndex={-1} className="mt-6 scroll-mt-24 display-xl">
              THESE RECORDS
              <span className="block" style={{ color: "color-mix(in oklab, var(--cloud) 45%, transparent)" }}>
                NEVER MET
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted">
            Pull a fragment to discover what touched it. Connections come only from shared dates, hours, places or words already present in the archive.
          </p>
        </div>

        <ol className="relative mt-20 md:mt-28">
          {/* the drawn spine */}
          <span
            aria-hidden="true"
            className="absolute left-[11px] top-2 w-px origin-top md:left-1/2"
            style={{
              bottom: "2rem",
              background: hot
                ? "linear-gradient(to bottom, var(--cloud), var(--violet), var(--cloud))"
                : "linear-gradient(to bottom, var(--violet), color-mix(in oklab, var(--cloud) 35%, transparent))",
              boxShadow: hot ? "0 0 18px color-mix(in oklab, var(--violet) 55%, transparent)" : undefined,
              transform: `scaleY(${shown ? 1 : 0})`,
              transition: "transform 1800ms cubic-bezier(0.22,0.68,0,1)",
            }}
          />

          {nodes.map((n, i) => {
            const meta = TYPE_META[n.r.type];
            const tone = TONE_VAR[meta.tone] ?? "var(--accent)";
            const left = i % 2 === 0;
            const live = hot === n.r.id;
            return (
              <li
                key={n.r.id}
                style={{ transitionDelay: `${i * 140}ms` }}
                className={`relative pb-14 pl-10 md:grid md:grid-cols-2 md:gap-16 md:pl-0 ${
                  shown ? "reveal reveal-in" : "reveal"
                }`}
              >
                {/* node on the spine */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1 grid size-6 place-items-center rounded-full font-mono text-[12px] transition-all duration-300 md:left-1/2 md:-translate-x-1/2"
                  style={{
                    background: "var(--plum)",
                    color: tone,
                    boxShadow: live
                      ? `0 0 0 1.5px ${tone}, 0 0 28px 2px color-mix(in oklab, ${tone} 55%, transparent)`
                      : `0 0 0 1px ${tone}`,
                    transform: live ? "scale(1.35)" : undefined,
                  }}
                >
                  <span aria-hidden="true">{meta.glyph}</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    trigger.current = document.activeElement as HTMLElement | null;
                    onSelect(n.r);
                    setOpen(true);
                  }}
                  onMouseEnter={() => setHot(n.r.id)}
                  onMouseLeave={() => setHot(null)}
                  onFocus={() => setHot(n.r.id)}
                  onBlur={() => setHot(null)}
                  className={`block w-full text-left transition-opacity duration-300 ${
                    left ? "md:col-start-1 md:pr-14 md:text-right" : "md:col-start-2 md:pl-14"
                  } ${hot && !live ? "opacity-55" : "opacity-100"}`}
                >
                  <span
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 label-xs"
                    style={{ color: tone }}
                  >
                    <span>{meta.label}</span>
                    <span className="text-muted">
                      {formatDate(n.r.ts)} · {formatTime(n.r.ts)}
                    </span>
                  </span>
                  <span className="mt-3 block display-lg text-[clamp(1.5rem,2.6vw,2.2rem)]">{n.r.title}</span>
                  <span className={`mt-2 flex flex-wrap items-center gap-x-4 text-sm text-muted ${left ? "md:justify-end" : ""}`}>
                    {n.r.subtitle ? <span>{n.r.subtitle}</span> : null}
                    {n.r.amount ? (
                      <span className="font-mono text-xs" style={{ color: "var(--gold)" }}>
                        ₹{Math.round(n.r.amount).toLocaleString("en-IN")}
                      </span>
                    ) : null}
                    {n.r.place ? <span className="font-mono text-xs">{n.r.place}</span> : null}
                  </span>
                  <span
                    className={`mt-4 block label-xs transition-opacity duration-300 ${
                      live ? "opacity-100" : "opacity-45"
                    }`}
                    style={{ color: n.reason ? tone : undefined }}
                  >
                    {n.reason ?? "Thread anchor · click any node to pull a new thread"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="min-h-20 border-y border-cloud/15 py-5" aria-live="polite">
          <p className="label-xs text-muted">{hotNode ? "Fragment in focus" : "Follow the line"}</p>
          <p className="mt-2 font-display text-xl">{hotNode?.r.title ?? "Hover or focus a node to inspect its evidence."}</p>
          {hotNode ? <p className="mt-1 text-xs text-muted">{TYPE_META[hotNode.r.type].label} · {formatDate(hotNode.r.ts)} · {formatTime(hotNode.r.ts)}{hotNode.reason ? ` · ${hotNode.reason}` : " · thread anchor"}</p> : null}
        </div>

        <button
          type="button"
          onClick={(event) => { trigger.current = event.currentTarget; setOpen(true); }}
          className="editorial-action group mt-8"
        >
          Pull this thread
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div ref={dialog} tabIndex={-1} className="fixed inset-0 z-[70] bg-noir/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="thread-reader-title">
          <div className="exhibition-panel ml-auto flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-ink text-cloud">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-cloud/15 bg-ink/95 px-5 py-4 backdrop-blur-xl md:px-10">
              <div>
                <p className="label-xs text-muted">Current fragment → connected fragments → next thread</p>
                <h3 id="thread-reader-title" className="mt-1 font-display text-xl">Inside the archive</h3>
              </div>
                <button ref={closeButton} type="button" onClick={closeReader} aria-label="Close thread reader" className="grid size-11 place-items-center border border-cloud/20 transition hover:bg-cloud/5">
                 <X className="size-4" aria-hidden="true" />
              </button>
            </header>
            <div className="grid gap-10 p-5 md:p-10">
              <ReceiptDetail receipt={anchor} />
              <div>
                <p className="label-xs text-muted">Connected fragments</p>
                <div className="relative mt-6 border-l border-violet/40 pl-6">
                  {links.map((link, i) => (
                    <button
                      key={link.receipt.id}
                      type="button"
                      onClick={() => onSelect(link.receipt)}
                      className="group relative block w-full border-b border-cloud/12 py-5 text-left"
                    >
                      <span className="absolute -left-[1.72rem] top-7 size-2 rounded-full bg-violet transition group-hover:scale-150" aria-hidden="true" />
                      <span className="label-xs text-violet">{String(i + 1).padStart(2, "0")} · {link.reason}</span>
                      <span className="mt-2 block font-display text-2xl transition group-hover:translate-x-1">{link.receipt.title}</span>
                      <span className="mt-1 block text-xs text-muted">{TYPE_META[link.receipt.type].label} · {formatDate(link.receipt.ts)} · {formatTime(link.receipt.ts)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Link to="/explore" className="group inline-flex min-h-14 items-center justify-center gap-3 bg-cloud px-8 label-xs text-ink transition hover:gap-5">
                Continue in Threads <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
