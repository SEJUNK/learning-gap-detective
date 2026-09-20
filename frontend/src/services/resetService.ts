import { clearAllAssessmentData } from "./assessmentStateService";
import { clearLearningPathProgress } from "./learningPathStateService";
import { clearLastReassessment } from "./reassessmentStateService";
import { clearMasteryOverrides } from "./studentStateService";

/**
 * Development/demo control only — restores a clean initial student state
 * so the full hackathon walkthrough (Assessment → Diagnosis → Recovery
 * Path → Learning → Reassessment → Dashboard) can be re-run from scratch
 * without manually clearing browser storage. Not a general "delete my
 * account" feature: there's no confirmation-of-identity, no server-side
 * record to remove (nothing here has a backend yet), and it's exposed
 * only from the Settings page behind its own confirmation dialog.
 *
 * Clears every piece of state this app writes:
 * - the in-progress and last-submitted assessment
 * - recovery-path step progress
 * - the last computed reassessment result
 * - every mastery override (from both the original assessment and any
 *   reassessment) — this is what makes the Dashboard fall back to the
 *   static seed story again
 */
export function resetDemoState(): void {
  clearAllAssessmentData();
  clearLearningPathProgress();
  clearLastReassessment();
  clearMasteryOverrides();
}
