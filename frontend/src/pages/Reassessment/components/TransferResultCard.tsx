import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import type { ApplicationTransferResult } from "../../../types/reassessment";
import "./TransferResultCard.css";

interface TransferResultCardProps {
  transfer: ApplicationTransferResult;
  conceptName: string;
}

/** Only ever rendered when real before/after application-question data exists on both sides — see reassessmentService.ts. */
export function TransferResultCard({ transfer, conceptName }: TransferResultCardProps) {
  return (
    <section aria-labelledby="transfer-heading">
      <SectionHeader title="Application Transfer" description="Whether the improvement carried over to a new, unfamiliar problem." />
      <Card className="transfer-card">
        <div className="transfer-card-row">
          <span className="transfer-card-label">Original application ({conceptName})</span>
          <span className="transfer-card-value">{transfer.beforeApplicationAccuracy}%</span>
        </div>
        <ArrowRight size={16} strokeWidth={2.2} className="transfer-card-arrow" />
        <div className="transfer-card-row">
          <span className="transfer-card-label">Reassessment application</span>
          <span className="transfer-card-value" style={{ color: transfer.transferred ? "var(--color-success)" : "var(--color-text-primary)" }}>
            {transfer.afterApplicationAccuracy}%
          </span>
        </div>

        <p className="transfer-card-note">
          {transfer.transferred ? (
            <>
              <CheckCircle2 size={15} strokeWidth={2.4} /> Your improvement carried over to a new problem.
            </>
          ) : (
            <>
              <Circle size={15} strokeWidth={2.2} /> Applying this in a new scenario hasn't caught up to the conceptual improvement yet.
            </>
          )}
        </p>
      </Card>
    </section>
  );
}
