import type { ConceptId } from "../types/assessment";

/**
 * SYNTHETIC DEMONSTRATION DATA — not used by any runtime code path.
 *
 * This is a documented, reusable answer key for the Diagnostic
 * Assessment (`data/assessmentQuestions.ts`) that produces a compelling,
 * multi-concept weak→strong story when actually run through the real
 * scoring engine (`services/scoringService.ts`) — nothing about the
 * resulting scores is hardcoded or injected after the fact. It exists so
 * the hackathon demo is repeatable: click through the assessment
 * following this key, and the rest of the product (Diagnosis, Recovery
 * Path, Learning Module, Reassessment, Dashboard) genuinely reacts to
 * what the scoring engine computes from these answers.
 *
 * Honesty note on the specific numbers: the current 12-question
 * assessment bank has only 1-2 questions per concept, which caps
 * achievable per-concept percentages at coarse increments (0/50/100, or
 * 0/100 for single-question concepts). This script is calibrated to the
 * CLOSEST achievable equivalent of a "Conditions is the root gap,
 * dragging down Loops and Functions, while everything else is strong"
 * story — it does not hit an arbitrary target percentage like "48%"
 * because doing so would require expanding the question bank to
 * dozens of questions per concept purely for demo-digit cosmetics,
 * which was intentionally out of scope for this hardening phase (see
 * DEVELOPMENT_STATUS.md's Phase 8 notes).
 *
 * What this script actually produces (verified live, see
 * DEVELOPMENT_STATUS.md "Demo data" section):
 * - Conditions:  0% → Root Gap   (both Conditions questions wrong)
 * - Loops:      50% → Root Gap   (one Loops question wrong; also
 *                                 independently below the critical
 *                                 threshold, so it's flagged as its own
 *                                 root-gap candidate too — a genuine
 *                                 "multiple gaps" scenario)
 * - Functions:  50% → Needs Practice (one Functions question wrong)
 * - every other concept: 100% → Strength
 * - Overall mastery: 78%
 */
export const DEMO_INCORRECT_QUESTION_IDS: readonly string[] = [
  "q3-conditions-application",
  "q4-conditions-debugging",
  "q6-loops-debugging",
  "q8-functions-reasoning",
];

/**
 * Answer every OTHER assessment question correctly, and these four
 * incorrectly, to reproduce the demo story above. After completing the
 * Recovery Path's Conditional Logic learning module and the targeted
 * Reassessment (answering every reassessment question correctly), the
 * product's own deterministic engine will show:
 * - Conditions: 0% → 100%, status "Improved"
 * - Loops (the one affected concept a single reassessment tests):
 *   50% → 100%, status "Improved"
 * - Overall improvement tier: "closing" — "Your learning gap is closing."
 * - Application transfer: 0% → 100%, "carried over to a new problem"
 *
 * Known, documented limitation (see DEVELOPMENT_STATUS.md): a single
 * reassessment cycle tests the root gap plus only ONE affected concept
 * (by design, from Phase 7 — 3 root + 1 affected + 1 transfer questions).
 * Functions stays at its original 50% until it's tested again. Because
 * this reassessment's own `allComparisons` only ever includes the
 * concepts it actually tested (Conditions + Loops), the deterministic
 * "every targeted concept is now strong" check is satisfied by THIS
 * cycle's evidence and correctly recommends "Take a full diagnostic
 * assessment" next — an honest recommendation (a fresh assessment would
 * re-surface Functions if it's still weak), not a claim that Functions
 * has already improved. It does not proactively say "Move to Functions"
 * from inside a single reassessment result, since Functions was never
 * part of that result's evidence.
 */
export const DEMO_TARGET_CONCEPTS_FOR_STORY: readonly ConceptId[] = ["conditions", "loops", "functions"];
