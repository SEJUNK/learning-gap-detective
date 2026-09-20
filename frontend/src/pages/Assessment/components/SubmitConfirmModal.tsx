import { CheckCircle2, Circle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import "./SubmitConfirmModal.css";

interface SubmitConfirmModalProps {
  open: boolean;
  answeredCount: number;
  totalQuestions: number;
  onContinue: () => void;
  onSubmit: () => void;
}

export function SubmitConfirmModal({ open, answeredCount, totalQuestions, onContinue, onSubmit }: SubmitConfirmModalProps) {
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Modal open={open} onClose={onContinue} title="Ready to submit?">
      <p className="submit-confirm-copy">
        You've answered {answeredCount} of {totalQuestions} questions.
      </p>

      <div className="submit-confirm-stats">
        <div className="submit-confirm-stat">
          <CheckCircle2 size={16} strokeWidth={2.2} className="submit-confirm-icon-answered" />
          Answered: <strong>{answeredCount}</strong>
        </div>
        <div className="submit-confirm-stat">
          <Circle size={16} strokeWidth={2.2} className="submit-confirm-icon-unanswered" />
          Unanswered: <strong>{unansweredCount}</strong>
        </div>
      </div>

      {unansweredCount > 0 && (
        <p className="submit-confirm-notice">
          Unanswered questions count as incorrect in scoring. You can still submit, or go back and finish them.
        </p>
      )}

      <div className="submit-confirm-actions">
        <Button variant="secondary" onClick={onContinue}>
          Continue Assessment
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </Modal>
  );
}
