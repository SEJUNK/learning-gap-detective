import { CreditCard, Music4, Wallet } from "lucide-react";
import { SOURCE_META, type SourceId } from "@/lib/data/types";

const TONE: Record<SourceId, { text: string; bg: string; border: string; dot: string }> = {
  spotify: { text: "text-accent", bg: "bg-accent/8", border: "border-accent/30", dot: "bg-accent" },
  household: { text: "text-gold", bg: "bg-gold/10", border: "border-gold/30", dot: "bg-gold" },
  india: { text: "text-mint", bg: "bg-mint/10", border: "border-mint/30", dot: "bg-mint" },
};

export const sourceTone = TONE;

const ICON: Record<SourceId, typeof Music4> = {
  spotify: Music4,
  household: Wallet,
  india: CreditCard,
};

export function SourceIcon({ source, className = "size-3.5" }: { source: SourceId; className?: string }) {
  const Icon = ICON[source];
  return <Icon className={className} aria-hidden="true" />;
}

export function SourceMark({
  source,
  showLabel = true,
  className = "",
}: {
  source: SourceId;
  showLabel?: boolean;
  className?: string;
}) {
  const tone = TONE[source];
  const meta = SOURCE_META[source];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${tone.border} ${tone.bg} ${tone.text} ${className}`}
    >
      <SourceIcon source={source} className="size-3" />
      {showLabel ? meta.verb : <span className="sr-only">{meta.verb}</span>}
    </span>
  );
}
