import type { AssessmentResponse, AssessmentState } from "../types/assessment";

/**
 * localStorage-backed persistence for the in-progress assessment. Reads
 * and writes are wrapped in try/catch since storage can throw (private
 * browsing, quota, disabled) — a failure here should degrade to
 * in-memory state, never crash the assessment.
 *
 * Shaped so a real backend can replace this module later: callers only
 * depend on load/save/clear, not on localStorage directly.
 */

const STATE_KEY = "lgd-assessment-state";
const EVIDENCE_KEY = "lgd-last-assessment-evidence";
const MOCK_STUDENT_ID = "student-alex-carter";

export function createAssessmentState(subject: string): AssessmentState {
  return {
    assessmentId: `assessment-${Date.now()}`,
    studentId: MOCK_STUDENT_ID,
    subject,
    startedAt: new Date().toISOString(),
    completedAt: null,
    currentQuestionIndex: 0,
    responses: {},
  };
}

export function loadInProgressAssessment(): AssessmentState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AssessmentState;
    if (parsed.completedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAssessmentState(state: AssessmentState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // best-effort only — losing autosave shouldn't break the assessment
  }
}

export function clearAssessmentState(): void {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    // ignore
  }
}

/** Dev/demo-reset support — see resetService.ts. Clears in-progress state AND the last-submitted evidence. */
export function clearAllAssessmentData(): void {
  clearAssessmentState();
  try {
    sessionStorage.removeItem(EVIDENCE_KEY);
  } catch {
    // ignore
  }
}

export function saveLastEvidence(evidence: unknown): void {
  try {
    sessionStorage.setItem(EVIDENCE_KEY, JSON.stringify(evidence));
  } catch {
    // ignore — the diagnosis flow also receives evidence via router state
  }
}

export function loadLastEvidence<T>(): T | null {
  try {
    const raw = sessionStorage.getItem(EVIDENCE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function emptyResponse(questionId: string): AssessmentResponse {
  return { questionId, selectedAnswer: null, isAnswered: false, confidence: null, timeSpent: 0 };
}
