import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { ROUTES } from "../../../routes/paths";
import type { RecoveryStep } from "../../../types/dashboard";
import "./RecoveryPathSection.css";

interface RecoveryPathSectionProps {
  steps: RecoveryStep[];
}

export function RecoveryPathSection({ steps }: RecoveryPathSectionProps) {
  const completedCount = steps.filter((step) => step.completed).length;

  return (
    <section aria-labelledby="recovery-path-heading">
      <SectionHeader title="Your Recovery Path" description="Based on your current learning gaps." />
      <Card className="recovery-path-card">
        <ol className="recovery-path-list">
          {steps.map((step, index) => (
            <li className="recovery-path-step" key={step.id}>
              <div className="recovery-path-step-marker">
                {step.completed ? (
                  <CheckCircle2 size={22} strokeWidth={2} className="recovery-path-icon-complete" />
                ) : (
                  <Circle size={22} strokeWidth={2} className="recovery-path-icon-pending" />
                )}
                {index < steps.length - 1 && <span className="recovery-path-connector" aria-hidden="true" />}
              </div>
              <div className="recovery-path-step-body">
                <div className="recovery-path-step-heading">
                  <span className="recovery-path-step-number">Step {step.order}</span>
                  <span className="recovery-path-step-tag">{step.tag}</span>
                </div>
                <h3 className="recovery-path-step-title">{step.title}</h3>
                <span className="recovery-path-step-duration">
                  <Clock size={13} strokeWidth={2.2} /> {step.durationMinutes} min
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="recovery-path-footer">
          <span className="recovery-path-progress">
            {completedCount} of {steps.length} completed
          </span>
          <Link to={ROUTES.recoveryPath} className="recovery-path-cta">
            Continue Learning <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </div>
      </Card>
    </section>
  );
}
