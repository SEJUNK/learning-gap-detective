import type { ConfidenceLevel } from "../../../types/assessment";
import "./ConfidencePrompt.css";

interface ConfidencePromptProps {
  value: ConfidenceLevel | null;
  onChange: (value: ConfidenceLevel) => void;
}

const OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: "guessing", label: "Guessing" },
  { value: "somewhat_confident", label: "Somewhat confident" },
  { value: "very_confident", label: "Very confident" },
];

/** Optional, lightweight self-report — stored separately from correctness, never affects scoring. */
export function ConfidencePrompt({ value, onChange }: ConfidencePromptProps) {
  return (
    <div className="confidence-prompt">
      <span className="confidence-prompt-label">How confident are you? (optional)</span>
      <div className="confidence-prompt-options" role="radiogroup" aria-label="Confidence level">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`confidence-pill${selected ? " selected" : ""}`}
              onClick={() => onChange(option.value)}
            >
              <span className="confidence-pill-dot" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
