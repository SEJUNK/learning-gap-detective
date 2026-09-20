/**
 * Centralized thresholds for the reassessment improvement classification
 * (services/reassessmentService.ts). Deliberately reuses
 * STRONG_THRESHOLD/CRITICAL_GAP_THRESHOLD from diagnosisThresholds.ts —
 * "improved" for a concept means the same thing here as "strength" means
 * in the original diagnosis, so the same numbers apply rather than a
 * second, potentially inconsistent, set of cutoffs.
 */

/**
 * A jump of at least this many percentage points counts as a
 * significant improvement even if the concept hasn't yet crossed
 * STRONG_THRESHOLD — someone going from 30% to 55% has made real
 * progress worth calling "improved," not "still developing."
 */
export const SIGNIFICANT_IMPROVEMENT_POINTS = 20;

/** Used to build the intro screen's "Estimated time" — honest, scales with however many questions were actually selected. */
export const REASSESSMENT_SECONDS_PER_QUESTION = 48;

/** Target question count per the spec's 3 (root) / 1 (affected) / 1 (application transfer) distribution. */
export const REASSESSMENT_QUESTION_COUNT = 5;
export const REASSESSMENT_ROOT_QUESTION_COUNT = 3;
export const REASSESSMENT_AFFECTED_QUESTION_COUNT = 1;
