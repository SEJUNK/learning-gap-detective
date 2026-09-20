import { TYPE_META, formatDate, formatTime, isNight, type Receipt } from "@/lib/receipts";

export function TypeChip({ type, className = "" }: { type: Receipt["type"]; className?: string }) {
  const m = TYPE_META[type];
  return (
    <span
      className={`rounded px-2 py-1 font-mono text-[9px] font-semibold uppercase ${m.bg} ${m.text} ${className}`}
    >
      {m.label}
    </span>
  );
}

export function TypeGlyph({ type, className = "" }: { type: Receipt["type"]; className?: string }) {
  const m = TYPE_META[type];
  return (
    <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-md font-mono text-sm ${m.bg} ${m.text} ${className}`}>
      {m.glyph}
    </span>
  );
}

export function FragmentRow({
  receipt,
  active = false,
  reason,
  onSelect,
}: {
  receipt: Receipt;
  active?: boolean;
  reason?: string | undefined;
  onSelect?: ((r: Receipt) => void) | undefined;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(receipt)}
      className={`group flex min-h-16 w-full items-center gap-3 border-b border-l-2 px-3 py-2.5 text-left transition ${
        active
          ? `border-l-accent border-b-cloud/20 bg-accent/8 ${TYPE_META[receipt.type].ring}`
          : "border-l-transparent border-b-cloud/10 hover:border-l-accent hover:bg-cloud/[0.035]"
      }`}
    >
      <TypeGlyph type={receipt.type} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-sm font-medium transition group-hover:text-accent">{receipt.title}</p>
        <p className="line-clamp-2 break-words font-mono text-[10px] text-muted">
          {receipt.subtitle ? `${receipt.subtitle} · ` : ""}
          {formatDate(receipt.ts)}
          {isNight(receipt.ts) ? ` · ${formatTime(receipt.ts)}` : ""}
        </p>
      </div>
      {receipt.amount ? (
        <span className="shrink-0 font-mono text-[10px] text-gold">₹{Math.round(receipt.amount).toLocaleString("en-IN")}</span>
      ) : null}
      {reason ? <span className="hidden shrink-0 font-mono text-[9px] uppercase text-accent sm:block">{reason}</span> : null}
    </button>
  );
}

export function ReceiptDetail({ receipt }: { receipt: Receipt }) {
  const metaEntries = Object.entries(receipt.meta).filter(([, v]) => v !== null && v !== "" && v !== undefined);
  return (
    <article className="artifact-paper relative p-6">
      <div className="flex items-center justify-between gap-2">
        <TypeChip type={receipt.type} />
        <span className="font-mono text-[9px] text-muted">
          {formatDate(receipt.ts)} · {formatTime(receipt.ts)}
        </span>
      </div>
       <p className="mt-5 label-xs text-muted">Evidence fragment</p>
       <h3 className="mt-2 font-display text-3xl leading-tight">{receipt.title}</h3>
      {receipt.subtitle ? <p className="mt-1 text-sm text-muted">{receipt.subtitle}</p> : null}
      {receipt.detail ? <p className="mt-3 text-xs leading-relaxed text-muted">{receipt.detail}</p> : null}
      {receipt.note ? (
        <p className="mt-4 border-l-2 border-violet bg-violet/5 p-4 font-display text-base italic leading-relaxed text-cloud/90">
          {receipt.note}
        </p>
      ) : null}
      {metaEntries.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10px]">
          {metaEntries.slice(0, 8).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 border-b border-cloud/10 pb-1">
              <dt className="text-muted capitalize">{k.replace(/([A-Z])/g, " $1")}</dt>
              <dd className="truncate text-cloud/90">
                {typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {receipt.tags.slice(0, 6).map((t) => (
          <span key={t} className="rounded-md bg-cloud/5 px-2 py-0.5 text-[10px] text-muted">
            {t}
          </span>
        ))}
      </div>
      <p className="mt-4 border-t border-dashed border-cloud/10 pt-3 font-mono text-[9px] uppercase text-muted">
        {receipt.derived ? "Inferred from " : "Source · "}
        {receipt.source}
      </p>
    </article>
  );
}
