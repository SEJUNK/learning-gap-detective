import { AlertOctagon, AlertTriangle, RotateCcw, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The four severities a concept's mastery can be classified into. This is
 * the vocabulary the whole product uses to talk about learning gaps —
 * every place that shows a status (StatusBadge, ConceptCard, InsightCard)
 * reads from this single config so color/icon/label never drift apart.
 *
 * Color is never the only signal: each status always pairs a distinct
 * icon shape and a text label with its color.
 */
export type GapStatus = "root" | "application" | "practice" | "strength";

interface GapStatusConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  softColor: string;
}

export const GAP_STATUS_CONFIG: Record<GapStatus, GapStatusConfig> = {
  root: {
    label: "Root Gap",
    description: "A foundational prerequisite is missing and likely causing downstream mistakes.",
    icon: AlertOctagon,
    color: "var(--color-gap-root)",
    softColor: "var(--color-gap-root-soft)",
  },
  application: {
    label: "Application Gap",
    description: "The concept is understood but breaks down when applied in context.",
    icon: AlertTriangle,
    color: "var(--color-gap-application)",
    softColor: "var(--color-gap-application-soft)",
  },
  practice: {
    label: "Needs Practice",
    description: "Understood, but not yet consistent — more repetition will solidify it.",
    icon: RotateCcw,
    color: "var(--color-gap-practice)",
    softColor: "var(--color-gap-practice-soft)",
  },
  strength: {
    label: "Strength",
    description: "Consistently correct — this concept is solid.",
    icon: CheckCircle2,
    color: "var(--color-gap-strength)",
    softColor: "var(--color-gap-strength-soft)",
  },
};
