import { ArrowRight } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { ProgressRing } from "../../../components/ui/ProgressRing";
import { GAP_STATUS_CONFIG, type GapStatus } from "../../../constants/gapStatus";
import "./RootFindingPanel.css";

export type MainFindingKind = "root_gap" | "concept_gap" | "application_gap" | "none";

interface RootFindingPanelProps {
  kind: MainFindingKind;
  conceptName: string | null;
  mastery: number | null;
  explanation: string;
  affectedConcepts?: string[];
  /** 0-1, from the finding itself. The engine never claims certainty — see constants/diagnosisThresholds.ts. */
  confidence?: number | null;
}

/**
 * Below this, the finding is presented as a hypothesis ("Possible Root
 * Gap") rather than a claim ("Root Gap Detected") — the whole point of
 * carrying a confidence score through from the deterministic engine is
 * that the UI can actually distinguish evidence from interpretation
 * instead of stating every inference with the same certainty.
 */
const TENTATIVE_CONFIDENCE_THRESHOLD = 0.6;

const KIND_CONFIG: Record<MainFindingKind, { label: string; tentativeLabel: string; status: GapStatus }> = {
  root_gap: { label: "Root Gap Detected", tentativeLabel: "Possible Root Gap", status: "root" },
  concept_gap: { label: "Concept Gap Detected", tentativeLabel: "Possible Concept Gap", status: "practice" },
  application_gap: { label: "Application Gap Detected", tentativeLabel: "Possible Application Gap", status: "application" },
  none: { label: "No Major Gaps Detected", tentativeLabel: "No Major Gaps Detected", status: "strength" },
};

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High confidence";
  if (confidence >= TENTATIVE_CONFIDENCE_THRESHOLD) return "Moderate confidence";
  return "Preliminary signal";
}

/** The diagnosis screen's visual centerpiece — the single most important finding, made unmissable. */
export function RootFindingPanel({ kind, conceptName, mastery, explanation, affectedConcepts = [], confidence = null }: RootFindingPanelProps) {
  const { label: definiteLabel, tentativeLabel, status } = KIND_CONFIG[kind];
  const isTentative = kind !== "none" && confidence !== null && confidence < TENTATIVE_CONFIDENCE_THRESHOLD;
  const label = isTentative ? tentativeLabel : definiteLabel;
  const config = GAP_STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Card className="root-finding-panel" style={{ borderTop: `4px solid ${config.color}` }}>
      <div className="root-finding-kicker-row">
        <div className="root-finding-kicker" style={{ color: config.color, background: config.softColor }} title={config.description}>
          <Icon size={16} strokeWidth={2.4} />
          {label.toUpperCase()}
        </div>
        {confidence !== null && kind !== "none" && (
          <span className="root-finding-confidence" title={`Based on the strength of the supporting evidence (${Math.round(confidence * 100)}%).`}>
            {confidenceLabel(confidence)}
          </span>
        )}
      </div>

      <div className="root-finding-body">
        <div className="root-finding-text">
          <h2 className="root-finding-concept">{conceptName ?? "Your performance"}</h2>
          <p className="root-finding-explanation">{explanation}</p>

          {affectedConcepts.length > 0 && (
            <div className="root-finding-affected">
              <span className="root-finding-affected-label" title="This isn't just a list of weak topics — it's a prerequisite chain: the root concept feeds directly into each one shown here.">
                Prerequisite chain — this may be causing downstream difficulty in:
              </span>
              <div className="root-finding-chain">
                <span className="root-finding-chip root-finding-chip-root" style={{ color: config.color, background: config.softColor }}>
                  {conceptName}
                </span>
                <ArrowRight size={16} strokeWidth={2.4} className="root-finding-chain-arrow" />
                <div className="root-finding-affected-chips">
                  {affectedConcepts.map((concept) => (
                    <span key={concept} className="root-finding-chip">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {mastery !== null && (
          <div className="root-finding-ring">
            <ProgressRing value={mastery} color={config.color} size={104} strokeWidth={9} />
            <span className="root-finding-ring-label">mastery</span>
          </div>
        )}
      </div>
    </Card>
  );
}
