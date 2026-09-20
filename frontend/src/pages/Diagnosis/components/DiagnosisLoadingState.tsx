import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { DiagnosisStep } from "../../../services/diagnosisService";
import "./DiagnosisLoadingState.css";

interface DiagnosisLoadingStateProps {
  currentStep: DiagnosisStep;
}

const STEPS: { id: DiagnosisStep; label: string }[] = [
  { id: "reviewing", label: "Reviewing answers" },
  { id: "mapping", label: "Mapping concepts" },
  { id: "patterns", label: "Finding patterns" },
  { id: "building", label: "Building your recovery path" },
];

/**
 * Reflects the pipeline's real stage transitions (services/diagnosisService
 * calls `onStep`) — never a fake timer standing in for work that isn't
 * happening. Most stages are near-instant (deterministic); only "Finding
 * patterns" (the AI call) may take real time.
 */
export function DiagnosisLoadingState({ currentStep }: DiagnosisLoadingStateProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="diagnosis-loading">
      <h1 className="diagnosis-loading-title">Analyzing your learning patterns…</h1>
      <ul className="diagnosis-loading-steps">
        {STEPS.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.id} className={`diagnosis-loading-step${isDone ? " done" : ""}${isCurrent ? " current" : ""}`}>
              {isDone && <CheckCircle2 size={18} strokeWidth={2.2} />}
              {isCurrent && <Loader2 size={18} strokeWidth={2.2} className="diagnosis-loading-spinner" />}
              {!isDone && !isCurrent && <Circle size={18} strokeWidth={2} />}
              <span>{step.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
