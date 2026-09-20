/**
 * Centralized thresholds for the deterministic diagnostic engine
 * (services/diagnosticEngine.ts). Every mastery-based decision in the
 * engine reads from here — nothing is compared against a magic number
 * inline, so the diagnostic "personality" of the product can be tuned
 * in one place and every finding type stays consistent with the others.
 *
 * Mastery is a 0-100 percentage (from AssessmentEvidence.conceptScores).
 */

/** Below this, a concept's own evidence is weak enough to be gap-candidate material. */
export const CRITICAL_GAP_THRESHOLD = 55;

/** Between CRITICAL and this, a concept is "developing" — not flagged as a gap or a strength on its own. */
export const DEVELOPING_THRESHOLD = 75;

/** At or above this, a concept is confident enough to call a strength. */
export const STRONG_THRESHOLD = 85;

/**
 * Application-gap detection: a concept needs a conceptual-accuracy at or
 * above this AND an application-accuracy at or below the second constant
 * for the "understands it, can't apply it" pattern to be called out.
 */
export const APPLICATION_GAP_CONCEPTUAL_MIN = 70;
export const APPLICATION_GAP_APPLICATION_MAX = 50;

/** Question types treated as testing conceptual understanding vs. applying it — see diagnosticEngine.ts. */
export const CONCEPTUAL_QUESTION_TYPES = ["conceptual", "code_output"] as const;
export const APPLICATION_QUESTION_TYPES = ["application", "debugging", "reasoning"] as const;

/** A root-gap or concept-gap confidence score is clamped into this range — the engine never claims certainty. */
export const MIN_FINDING_CONFIDENCE = 0.3;
export const MAX_FINDING_CONFIDENCE = 0.95;

/** High-confidence-but-wrong pattern: flag it once at least this many questions show it. */
export const HIGH_CONFIDENCE_INCORRECT_MIN_COUNT = 1;
