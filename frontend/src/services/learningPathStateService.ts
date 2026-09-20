/**
 * localStorage-backed progress tracking for the recovery path, mirroring
 * the pattern in assessmentStateService.ts. Keyed by pathId (stable per
 * assessment — see learningPathService.generateLearningPath) so
 * completing a new assessment naturally starts fresh progress instead of
 * inheriting an old path's completed steps.
 */

const STORAGE_KEY = "lgd-learning-path-progress";

interface StoredProgress {
  pathId: string;
  completedStepIds: string[];
  inProgressStepId: string | null;
}

function load(): StoredProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredProgress) : null;
  } catch {
    return null;
  }
}

function save(progress: StoredProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // best-effort — losing persisted progress shouldn't break the page
  }
}

export function getProgress(pathId: string): { completedStepIds: Set<string>; inProgressStepId: string | null } {
  const stored = load();
  if (!stored || stored.pathId !== pathId) {
    return { completedStepIds: new Set(), inProgressStepId: null };
  }
  return { completedStepIds: new Set(stored.completedStepIds), inProgressStepId: stored.inProgressStepId };
}

export function markStepInProgress(pathId: string, stepId: string): void {
  const current = getProgress(pathId);
  save({ pathId, completedStepIds: Array.from(current.completedStepIds), inProgressStepId: stepId });
}

export function markStepCompleted(pathId: string, stepId: string): void {
  const current = getProgress(pathId);
  current.completedStepIds.add(stepId);
  const inProgressStepId = current.inProgressStepId === stepId ? null : current.inProgressStepId;
  save({ pathId, completedStepIds: Array.from(current.completedStepIds), inProgressStepId });
}

/** Dev/demo-reset support — see resetService.ts. */
export function clearLearningPathProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
