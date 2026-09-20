import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import "./JourneyTimeline.css";

const STEPS = ["Diagnostic", "Gap Identified", "Recovery Path", "Practice", "Reassessment", "Next Step"];

/** Reinforces the full-loop product story — every step so far is done; only "Next Step" remains. */
export function JourneyTimeline() {
  return (
    <Card className="journey-timeline-card">
      <ol className="journey-timeline">
        {STEPS.map((step, index) => {
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step} className={`journey-timeline-item${isLast ? " current" : " done"}`}>
              {isLast ? <Circle size={16} strokeWidth={2.2} /> : <CheckCircle2 size={16} strokeWidth={2.2} />}
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
