/**
 * sessionStorage-backed persistence for the last computed
 * ReassessmentResult — mirrors assessmentStateService's
 * saveLastEvidence/loadLastEvidence pattern, so a refresh on the results
 * screen doesn't lose the comparison the student just earned.
 */

const REASSESSMENT_KEY = "lgd-last-reassessment-result";

export function saveLastReassessment(result: unknown): void {
  try {
    sessionStorage.setItem(REASSESSMENT_KEY, JSON.stringify(result));
  } catch {
    // best-effort only
  }
}

export function loadLastReassessment<T>(): T | null {
  try {
    const raw = sessionStorage.getItem(REASSESSMENT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Dev/demo-reset support — see resetService.ts. */
export function clearLastReassessment(): void {
  try {
    sessionStorage.removeItem(REASSESSMENT_KEY);
  } catch {
    // ignore
  }
}
