import { Check } from "lucide-react";
import "./ModuleProgressIndicator.css";

export type ModuleStage = "why" | "learn" | "practice" | "challenge" | "check" | "complete";

const STAGES: { id: ModuleStage; label: string }[] = [
  { id: "why", label: "Why this matters" },
  { id: "learn", label: "Learn" },
  { id: "practice", label: "Practice" },
  { id: "challenge", label: "Challenge" },
  { id: "check", label: "Check" },
];

interface ModuleProgressIndicatorProps {
  currentStage: ModuleStage;
}

/** Compact on mobile (dots only, label for the current stage); full labels on desktop. */
export function ModuleProgressIndicator({ currentStage }: ModuleProgressIndicatorProps) {
  const currentIndex = currentStage === "complete" ? STAGES.length : STAGES.findIndex((s) => s.id === currentStage);

  return (
    <ol className="module-progress" aria-label="Lesson progress">
      {STAGES.map((stage, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={stage.id} className={`module-progress-item${done ? " done" : ""}${current ? " current" : ""}`}>
            <span className="module-progress-dot" aria-hidden="true">
              {done ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <span className="module-progress-label">{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
