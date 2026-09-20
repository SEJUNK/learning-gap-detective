import type { AssessmentEvidence, ConceptId } from "../types/assessment";
import type { DiagnosticEvidence } from "../types/diagnosis";
import type { ReassessmentResult } from "../types/reassessment";
import type { GapStatus } from "../constants/gapStatus";
import { STRONG_THRESHOLD } from "../constants/diagnosisThresholds";

/**
 * THE single source of truth for "what has the student's mastery become
 * since the static seed data" — every stage of the real journey
 * (original assessment, reassessment) writes here, and
 * `dashboardService.getDashboardData()` is the only reader, merging these
 * overrides onto the static mock at read time. Nothing here mutates
 * `dashboardMockData.ts` directly, and no other module keeps its own copy
 * of "current mastery" — this is what keeps Diagnosis, Recovery Path,
 * Reassessment, and the Dashboard from ever showing different numbers
 * for the same concept.
 */

const STORAGE_KEY = "lgd-mastery-overrides";

export type MasteryOverrideSource = "assessment" | "reassessment";

export interface MasteryOverride {
  mastery: number;
  updatedAt: string;
  source: MasteryOverrideSource;
  /**
   * Only set by `applyAssessmentEvidence` — a full status classification
   * computed from the real diagnostic findings (root/application/practice/
   * strength), not just "did it cross the strength threshold." Absent for
   * reassessment overrides, which use the more conservative
   * keep-unless-promoted rule in `dashboardService` instead, since a
   * single before/after comparison isn't enough context to safely
   * reclassify which *kind* of gap a concept still has.
   */
  status?: GapStatus;
}

function load(): Record<string, MasteryOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MasteryOverride>) : {};
  } catch {
    return {};
  }
}

function save(overrides: Record<string, MasteryOverride>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // best-effort — a lost override just means the dashboard shows the pre-reassessment value
  }
}

export function getMasteryOverrides(): Record<string, MasteryOverride> {
  return load();
}

/**
 * Writes every concept a reassessment actually tested into the override
 * map — this is the "update the student's local/mock learning state"
 * step. Only mastery + a timestamp are stored; the dashboard mock's
 * richer per-concept fields (status, prerequisites, affected concepts)
 * are recomputed/merged by the reader, not duplicated here.
 */
export function applyReassessmentResult(result: ReassessmentResult): void {
  const overrides = load();
  for (const comparison of result.comparison) {
    overrides[comparison.concept] = { mastery: comparison.afterScore, updatedAt: result.completedAt, source: "reassessment" };
  }
  save(overrides);
}

/**
 * Writes EVERY concept the original diagnostic assessment scored into the
 * override map, using the same `DiagnosticEvidence` that Diagnosis and
 * Recovery Path are already built from — so the very first thing a
 * student sees on the Dashboard after their real assessment is the real
 * score, not the pre-assessment seed story. Previously only a
 * *reassessment* ever wrote here, which meant the Dashboard kept showing
 * static demo numbers for a student's actual first assessment.
 */
export function applyAssessmentEvidence(evidence: AssessmentEvidence, diagnostic: DiagnosticEvidence): void {
  const overrides = load();
  const rootConcepts = new Set(diagnostic.rootGaps.map((g) => g.concept));
  const applicationConcepts = new Set(diagnostic.applicationGaps.map((g) => g.concept));

  for (const [concept, mastery] of Object.entries(evidence.conceptScores)) {
    const status: GapStatus =
      mastery >= STRONG_THRESHOLD ? "strength" : rootConcepts.has(concept as ConceptId) ? "root" : applicationConcepts.has(concept as ConceptId) ? "application" : "practice";

    overrides[concept] = { mastery, status, updatedAt: evidence.completedAt, source: "assessment" };
  }
  save(overrides);
}

export function getMasteryOverride(concept: ConceptId): MasteryOverride | null {
  return load()[concept] ?? null;
}

/** Dev/demo-reset support — see resetService.ts. */
export function clearMasteryOverrides(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
