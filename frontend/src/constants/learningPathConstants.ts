import type { LearningPathStepType } from "../types/learningPath";

/**
 * Centralized constants for the recovery path generator
 * (services/learningPathService.ts). Documented rather than left as
 * inline magic numbers, matching the pattern set by
 * diagnosisThresholds.ts.
 */

/** Fixed duration per step type, in minutes — matches the spec's own worked example (8/10/12/10 = 40). */
export const STEP_DURATION_MINUTES: Record<LearningPathStepType, number> = {
  root_gap: 8,
  concept_reinforcement: 10,
  application: 12,
  challenge: 10,
};

/**
 * Keeps the promise "shortest path to close the gap" honest: at most
 * this many supporting (non-primary, non-challenge) steps are added,
 * regardless of how many concepts a diagnosis touches. Total path
 * length is therefore capped at 1 (primary) + MAX_SUPPORTING_STEPS + 1
 * (challenge) = 4 by default, comfortably inside the 3-5 step target.
 */
export const MAX_SUPPORTING_STEPS = 2;
