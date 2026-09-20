import { CheckCircle2, TrendingUp, Activity } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import type { OverallImprovementTier } from "../../../types/reassessment";
import "./ImprovementSummaryBanner.css";

interface ImprovementSummaryBannerProps {
  tier: OverallImprovementTier;
  message: string;
}

const TIER_CONFIG: Record<OverallImprovementTier, { icon: typeof CheckCircle2; color: string; softColor: string }> = {
  closing: { icon: CheckCircle2, color: "var(--color-success)", softColor: "var(--color-success-soft)" },
  improving: { icon: TrendingUp, color: "var(--color-gap-practice)", softColor: "var(--color-gap-practice-soft)" },
  developing: { icon: Activity, color: "var(--color-gap-root)", softColor: "var(--color-gap-root-soft)" },
};

/**
 * The headline message is decided entirely by the deterministic
 * comparison (reassessmentService.ts) — never forced positive. The
 * "closing" tier gets a subtle one-time entrance animation on its icon
 * (a restrained scale-in, not confetti) — professional, not childish.
 */
export function ImprovementSummaryBanner({ tier, message }: ImprovementSummaryBannerProps) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <Card className="improvement-banner" style={{ background: config.softColor, borderColor: "transparent" }}>
      <span className={`improvement-banner-icon${tier === "closing" ? " celebrate" : ""}`} style={{ color: config.color, background: "var(--color-surface)" }}>
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <p className="improvement-banner-message" style={{ color: config.color }}>
        {message}
      </p>
    </Card>
  );
}
