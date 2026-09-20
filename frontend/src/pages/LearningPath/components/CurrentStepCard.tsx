import { ArrowRight, Play } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { CONCEPT_DISPLAY_NAMES } from "../../../constants/conceptGraph";
import type { LearningPathStep } from "../../../types/learningPath";
import "./CurrentStepCard.css";

interface CurrentStepCardProps {
  step: LearningPathStep;
  progressPercent: number;
  onStart: (step: LearningPathStep) => void;
}

/** Section 3 — the single most actionable card on the page: exactly what to do right now. */
export function CurrentStepCard({ step, progressPercent, onStart }: CurrentStepCardProps) {
  return (
    <Card className="current-step-card">
      <div className="current-step-icon">
        <Play size={20} strokeWidth={2.2} fill="currentColor" />
      </div>

      <div className="current-step-body">
        <span className="current-step-kicker">Start Here</span>
        <h3 className="current-step-title">{step.concept ? CONCEPT_DISPLAY_NAMES[step.concept] : step.title}</h3>
        <span className="current-step-duration">{step.durationMinutes} minutes</span>

        <div className="current-step-reason">
          <span className="current-step-reason-label">Why this first?</span>
          <p>{step.reason}</p>
        </div>

        <div className="current-step-progress">
          <span className="current-step-progress-label">Progress: {progressPercent}%</span>
          <ProgressBar value={progressPercent} />
        </div>
      </div>

      <button type="button" className="current-step-cta" onClick={() => onStart(step)}>
        Start Learning <ArrowRight size={16} strokeWidth={2.4} />
      </button>
    </Card>
  );
}
