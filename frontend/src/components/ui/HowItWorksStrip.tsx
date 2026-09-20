import { ClipboardCheck, FileSearch, Target, Route, GraduationCap, RefreshCcw, TrendingUp, ArrowRight } from "lucide-react";
import "./HowItWorksStrip.css";

const STEPS = [
  { label: "Assess", icon: ClipboardCheck },
  { label: "Structure Evidence", icon: FileSearch },
  { label: "Identify Root Gap", icon: Target },
  { label: "Recovery Path", icon: Route },
  { label: "Targeted Learning", icon: GraduationCap },
  { label: "Reassess", icon: RefreshCcw },
  { label: "Measure Improvement", icon: TrendingUp },
] as const;

/**
 * A compact, always-visible legend of the product's core loop — not
 * documentation, just enough for a first-time viewer (a hackathon judge,
 * a new student) to place whatever screen they're looking at within the
 * bigger picture in a couple of seconds. Deliberately low visual weight
 * (small text, muted color) so it reads as a footnote, not a headline.
 */
export function HowItWorksStrip() {
  return (
    <div className="how-it-works-strip" aria-label="How Learning Gap Detective works">
      {STEPS.map((step, index) => (
        <span className="how-it-works-step" key={step.label}>
          <step.icon size={13} strokeWidth={2.2} />
          {step.label}
          {index < STEPS.length - 1 && <ArrowRight size={12} strokeWidth={2} className="how-it-works-arrow" />}
        </span>
      ))}
    </div>
  );
}
