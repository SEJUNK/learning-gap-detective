import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import "./ReassessmentSubmitModal.css";

interface ReassessmentSubmitModalProps {
  open: boolean;
  onContinue: () => void;
  onSubmit: () => void;
}

export function ReassessmentSubmitModal({ open, onContinue, onSubmit }: ReassessmentSubmitModalProps) {
  return (
    <Modal open={open} onClose={onContinue} title="Ready to see how you improved?">
      <p className="reassessment-submit-copy">Submitting will score your reassessment and compare it against your original diagnosis.</p>
      <div className="reassessment-submit-actions">
        <Button variant="secondary" onClick={onContinue}>
          Continue Reassessment
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Submit
        </Button>
      </div>
    </Modal>
  );
}
