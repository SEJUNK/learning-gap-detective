import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, AlertOctagon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import type { ComparisonStatus, ConceptComparison } from "../../../types/reassessment";
import "./ComparisonCard.css";

interface ComparisonCardProps {
  comparison: ConceptComparison;
  /** The root-gap comparison renders larger and first — the single most important card on the page. */
  emphasized?: boolean;
}

const STATUS_CONFIG: Record<ComparisonStatus, { label: string; color: string; softColor: string; icon: typeof CheckCircle2 }> = {
  improved: { label: "Improved", color: "var(--color-success)", softColor: "var(--color-success-soft)", icon: CheckCircle2 },
  still_developing: { label: "Still Developing", color: "var(--color-gap-practice)", softColor: "var(--color-gap-practice-soft)", icon: RotateCcw },
  needs_more_practice: { label: "Needs More Practice", color: "var(--color-gap-root)", softColor: "var(--color-gap-root-soft)", icon: AlertOctagon },
};

/**
 * One concept's before/after — the "BEFORE VS AFTER" and "ROOT GAP
 * STATUS" sections consolidated into a single card type (the root gap's
 * card is simply rendered `emphasized`) rather than repeating the same
 * numbers in two separate sections.
 */
export function ComparisonCard({ comparison, emphasized }: ComparisonCardProps) {
  const config = STATUS_CONFIG[comparison.status];
  const StatusIcon = config.icon;
  const DeltaIcon = comparison.difference > 0 ? TrendingUp : comparison.difference < 0 ? TrendingDown : Minus;

  // Animate both bars from 0 on mount — purely decorative; the numeric
  // labels below always show the real values immediately, so nothing
  // depends on this animation to be visible (see the Phase 2 "motion is
  // never load-bearing" rule).
  const [animatedBefore, setAnimatedBefore] = useState(0);
  const [animatedAfter, setAnimatedAfter] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimatedBefore(comparison.beforeScore);
      setAnimatedAfter(comparison.afterScore);
    });
    return () => cancelAnimationFrame(frame);
  }, [comparison.beforeScore, comparison.afterScore]);

  return (
    <Card className={`comparison-card${emphasized ? " emphasized" : ""}`} style={{ borderTop: `3px solid ${config.color}` }}>
      <div className="comparison-card-header">
        <div>
          {emphasized && <span className="comparison-card-kicker">Root Gap</span>}
          <h3 className="comparison-card-title">{comparison.conceptName}</h3>
        </div>
        <span className="comparison-card-status" style={{ color: config.color, background: config.softColor }}>
          <StatusIcon size={14} strokeWidth={2.4} />
          {config.label}
        </span>
      </div>

      <div className="comparison-card-bars">
        <div className="comparison-card-bar-row">
          <span className="comparison-card-bar-label">Before</span>
          <ProgressBar value={animatedBefore} color="var(--color-text-muted)" />
          <span className="comparison-card-bar-value">{comparison.beforeScore}%</span>
        </div>
        <div className="comparison-card-bar-row">
          <span className="comparison-card-bar-label">After</span>
          <ProgressBar value={animatedAfter} color={config.color} />
          <span className="comparison-card-bar-value">{comparison.afterScore}%</span>
        </div>
      </div>

      <div className="comparison-card-delta" style={{ color: comparison.difference > 0 ? "var(--color-success)" : comparison.difference < 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
        <DeltaIcon size={16} strokeWidth={2.4} />
        {comparison.difference > 0 ? "+" : ""}
        {comparison.difference} percentage point{Math.abs(comparison.difference) === 1 ? "" : "s"}
      </div>
    </Card>
  );
}
