import { Card } from "../../../components/ui/Card";
import type { LearningPathTimeBreakdown } from "../../../types/learningPath";
import "./TimeEstimateBreakdown.css";

interface TimeEstimateBreakdownProps {
  totalMinutes: number;
  breakdown: LearningPathTimeBreakdown;
}

const ROWS: { key: keyof LearningPathTimeBreakdown; label: string; color: string }[] = [
  { key: "conceptLearningMinutes", label: "Concept learning", color: "var(--color-gap-root)" },
  { key: "practiceMinutes", label: "Practice", color: "var(--color-gap-application)" },
  { key: "challengeMinutes", label: "Challenge", color: "var(--color-success)" },
];

export function TimeEstimateBreakdown({ totalMinutes, breakdown }: TimeEstimateBreakdownProps) {
  return (
    <Card className="time-estimate-card">
      <div className="time-estimate-total">
        <span className="time-estimate-total-label">Total estimated time</span>
        <span className="time-estimate-total-value">{totalMinutes} minutes</span>
      </div>

      <div className="time-estimate-bar" role="img" aria-label="Time breakdown by activity type">
        {ROWS.filter((row) => breakdown[row.key] > 0).map((row) => (
          <span
            key={row.key}
            className="time-estimate-bar-segment"
            style={{ width: `${(breakdown[row.key] / totalMinutes) * 100}%`, background: row.color }}
          />
        ))}
      </div>

      <ul className="time-estimate-rows">
        {ROWS.filter((row) => breakdown[row.key] > 0).map((row) => (
          <li key={row.key} className="time-estimate-row">
            <span className="time-estimate-dot" style={{ background: row.color }} />
            <span className="time-estimate-row-label">{row.label}</span>
            <span className="time-estimate-row-value">{breakdown[row.key]} min</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
