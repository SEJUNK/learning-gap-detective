import { memo } from "react";
import { SourceIcon, SourceMark, sourceTone } from "./SourceMark";
import type { Fragment } from "@/lib/data/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatStamp(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${hh}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

/** "08 JUL 2013" + "03:17 AM", the way an archive label would read. */
export function stampParts(ts: number) {
  const d = new Date(ts);
  const h = d.getHours();
  const hh = String(h % 12 === 0 ? 12 : h % 12).padStart(2, "0");
  return {
    date: `${String(d.getDate()).padStart(2, "0")} ${(MONTHS[d.getMonth()] ?? "").toUpperCase()} ${d.getFullYear()}`,
    time: `${hh}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
  };
}

export function formatMoney(amount: number, currency = "INR") {
  const symbol = currency === "INR" ? "₹" : "";
  return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`;
}

/** One record from any dataset, rendered as an archive artifact rather than a table row. */
export const FragmentLine = memo(function FragmentLine({
  fragment,
  selected = false,
  onSelect,
}: {
  fragment: Fragment;
  selected?: boolean;
  onSelect?: (f: Fragment) => void;
}) {
  const tone = sourceTone[fragment.source];
  const stamp = stampParts(fragment.timestamp);
  return (
    <button
      type="button"
      onClick={() => onSelect?.(fragment)}
      aria-current={selected ? "true" : undefined}
      className={`group grid h-full w-full grid-cols-[1fr_auto] items-center gap-x-5 border-b border-l-2 px-4 text-left transition ${
        selected ? `${tone.bg} border-b-cloud/15` : "border-b-cloud/10 border-l-transparent hover:bg-cloud/[0.04]"
      }`}
      style={selected ? { borderLeftColor: "currentColor" } : undefined}
    >
      <span className="min-w-0">
        <span className={`flex items-center gap-2 label-xs ${tone.text}`}>
          <SourceIcon source={fragment.source} className="size-3" />
          <span className="truncate">{fragment.category}</span>
        </span>
        <span className="mt-1.5 block truncate font-display text-[1.05rem] leading-tight">{fragment.title}</span>
        <span className="mt-0.5 flex items-baseline gap-x-1.5 text-xs text-muted">
          <span className="truncate">{fragment.description}</span>
          {fragment.location ? <span className="hidden truncate sm:inline">· {fragment.location}</span> : null}
        </span>
      </span>
      <span className="shrink-0 text-right">
        {fragment.amount ? (
          <span className={`block numeral text-base ${tone.text}`}>
            {formatMoney(fragment.amount, fragment.currency)}
          </span>
        ) : null}
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{stamp.date}</span>
        <span className="block font-mono text-[10px] tracking-[0.1em] text-muted opacity-70">{stamp.time}</span>
      </span>
    </button>
  );
});

/** The opened artifact: large label, oversized amount, original fields kept. */
export function FragmentDetail({ fragment }: { fragment: Fragment }) {
  const entries = Object.entries(fragment.metadata).filter(
    ([, v]) => v !== "" && v !== null && v !== undefined,
  );
  const stamp = stampParts(fragment.timestamp);
  const tone = sourceTone[fragment.source];
  return (
    <article className="artifact-paper p-6">
      <div className="flex items-center justify-between gap-3 border-b border-cloud/12 pb-4">
        <SourceMark source={fragment.source} />
        <span className="label-xs text-muted">Fragment</span>
      </div>

      <p className={`mt-6 label-xs ${tone.text}`}>{fragment.category}</p>
      <h3 className="mt-3 display-lg">{fragment.title}</h3>
      <p className="mt-3 text-sm text-muted">{fragment.description}</p>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-cloud/12 pt-5">
        <span>
          <span className="block label-xs text-muted">Recorded</span>
          <span className="mt-1.5 block font-mono text-sm">{stamp.date}</span>
          <span className="block font-mono text-sm text-muted">{stamp.time}</span>
        </span>
        {fragment.amount ? (
          <span>
            <span className="block label-xs text-muted">Amount</span>
            <span className="mt-1 block numeral text-4xl">{formatMoney(fragment.amount, fragment.currency)}</span>
          </span>
        ) : null}
        {fragment.location ? (
          <span>
            <span className="block label-xs text-muted">Place</span>
            <span className="mt-1.5 block font-display text-lg">{fragment.location}</span>
          </span>
        ) : null}
      </div>

      {entries.length ? (
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-cloud/12 pt-5 font-mono text-[11px]">
          {entries.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 border-b border-cloud/8 pb-1">
              <dt className="capitalize text-muted">{k.replace(/([A-Z])/g, " $1")}</dt>
              <dd className="truncate">{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="mt-6 border-t border-dashed border-cloud/15 pt-4 label-xs text-muted">
        Source ·{" "}
        {fragment.source === "spotify"
          ? "Spotify history"
          : fragment.source === "household"
            ? "Household ledger"
            : "Card activity"}
      </p>
    </article>
  );
}
