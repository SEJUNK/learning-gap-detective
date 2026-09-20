import { Lock, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { CONCEPT_DISPLAY_NAMES } from "../../../constants/conceptGraph";
import type { LearningPathStep, LearningPathStepType } from "../../../types/learningPath";
import "./JourneyStepCard.css";

interface JourneyStepCardProps {
  step: LearningPathStep;
  isLast: boolean;
  onStart: (step: LearningPathStep) => void;
}

const TYPE_LABEL: Record<LearningPathStepType, string> = {
  root_gap: "Root Gap",
  concept_reinforcement: "Concept Reinforcement",
  application: "Application",
  challenge: "Challenge",
};

const TYPE_COLOR_VAR: Record<LearningPathStepType, string> = {
  root_gap: "var(--color-gap-root)",
  concept_reinforcement: "var(--color-gap-practice)",
  application: "var(--color-gap-application)",
  challenge: "var(--color-success)",
};

export function JourneyStepCard({ step, isLast, onStart }: JourneyStepCardProps) {
  const color = TYPE_COLOR_VAR[step.type];
  const locked = step.status === "locked";
  const completed = step.status === "completed";
  const inProgress = step.status === "in_progress";

  return (
    <li className="journey-step">
      <Card
        className={`journey-step-card${locked ? " locked" : ""}${completed ? " completed" : ""}${inProgress ? " in-progress" : ""}`}
        style={{ borderLeft: `4px solid ${locked ? "var(--color-border-strong)" : color}` }}
      >
        <div className="journey-step-top">
          <span className="journey-step-number">{String(step.order).padStart(2, "0")}</span>
          <span className="journey-step-kicker" style={{ color: locked ? "var(--color-text-muted)" : color }}>
            {TYPE_LABEL[step.type]}
          </span>
          {completed && <CheckCircle2 size={18} strokeWidth={2.2} className="journey-step-status-icon completed" />}
          {locked && <Lock size={16} strokeWidth={2.2} className="journey-step-status-icon" />}
        </div>

        <h3 className="journey-step-title">
          {step.concept ? CONCEPT_DISPLAY_NAMES[step.concept] : step.title}
        </h3>
        <p className="journey-step-description">{step.description}</p>

        <div className="journey-step-meta">
          <span className="journey-step-duration">
            <Clock size={13} strokeWidth={2.2} /> {step.durationMinutes} min
          </span>
        </div>

        {!locked && (
          <button type="button" className="journey-step-cta" onClick={() => onStart(step)}>
            {completed ? "Review" : inProgress ? "Continue Learning" : "Start"} <ArrowRight size={15} strokeWidth={2.4} />
          </button>
        )}
        {locked && <p className="journey-step-locked-note">Complete the previous step to unlock this one.</p>}
      </Card>

      {!isLast && (
        <div className="journey-step-connector" aria-hidden="true">
          <span className="journey-step-connector-line" />
          <ArrowRight size={16} strokeWidth={2} className="journey-step-connector-arrow" />
        </div>
      )}
    </li>
  );
}
