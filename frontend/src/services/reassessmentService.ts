import type { AssessmentEvidence, AssessmentQuestion, AssessmentResponse, ConceptId } from "../types/assessment";
import type { DiagnosticEvidence, DiagnosticFinding } from "../types/diagnosis";
import type {
  ApplicationTransferResult,
  ComparisonStatus,
  ConceptComparison,
  NextAction,
  OverallImprovementTier,
  ReassessmentResult,
} from "../types/reassessment";
import { REASSESSMENT_QUESTION_BANK } from "../data/reassessmentQuestions";
import { scoreAssessment } from "./scoringService";
import { CONCEPT_DISPLAY_NAMES } from "../constants/conceptGraph";
import { CRITICAL_GAP_THRESHOLD, STRONG_THRESHOLD, APPLICATION_QUESTION_TYPES } from "../constants/diagnosisThresholds";
import { REASSESSMENT_AFFECTED_QUESTION_COUNT, REASSESSMENT_ROOT_QUESTION_COUNT, SIGNIFICANT_IMPROVEMENT_POINTS } from "../constants/reassessmentThresholds";
import { ROUTES, learningModuleRoute } from "../routes/paths";

/**
 * The deterministic reassessment engine. No LLM anywhere in this file —
 * question selection, scoring (via the existing scoreAssessment), the
 * before/after comparison, status classification, and the next-action
 * decision are all plain functions. The optional AI reflection layer
 * (services/reassessmentAIService.ts) only ever explains this output —
 * it cannot change a score, a status, or a route.
 */

function name(concept: ConceptId): string {
  return CONCEPT_DISPLAY_NAMES[concept] ?? concept;
}

interface PrimaryFinding {
  concept: ConceptId;
  type: DiagnosticFinding["type"];
  affectedConcepts: ConceptId[];
}

/** Same precedence used by the diagnosis screen and the recovery-path generator: root gap > concept gap > application gap. */
export function pickPrimaryFinding(diagnostic: DiagnosticEvidence): PrimaryFinding | null {
  const rootGap = diagnostic.rootGaps[0];
  if (rootGap) return { concept: rootGap.concept, type: "root_gap", affectedConcepts: rootGap.affectedConcepts };

  const conceptGap = diagnostic.conceptGaps[0];
  if (conceptGap) return { concept: conceptGap.concept, type: "concept_gap", affectedConcepts: [] };

  const applicationGap = diagnostic.applicationGaps[0];
  if (applicationGap) return { concept: applicationGap.concept, type: "application_gap", affectedConcepts: [] };

  return null;
}

/**
 * Selects up to 5 reassessment questions per the spec's 3 (root) / 1
 * (affected) / 1 (application-transfer) distribution. Degrades
 * gracefully when a concept's pool is smaller than the ideal — never
 * duplicates a question, never crashes, and simply returns fewer than 5
 * when the available content genuinely doesn't support more (documented
 * in DEVELOPMENT_STATUS.md rather than padded out with filler).
 */
export function buildReassessmentQuestions(diagnostic: DiagnosticEvidence): AssessmentQuestion[] {
  const primary = pickPrimaryFinding(diagnostic);
  if (!primary) return [];

  const rootPool = REASSESSMENT_QUESTION_BANK[primary.concept] ?? [];
  const affectedConcept = primary.affectedConcepts[0];
  const affectedPool = affectedConcept ? REASSESSMENT_QUESTION_BANK[affectedConcept] ?? [] : [];

  const selected: AssessmentQuestion[] = [];
  const usedIds = new Set<string>();

  const take = (pool: AssessmentQuestion[], count: number) => {
    let takenFromThisPool = 0;
    for (const question of pool) {
      if (takenFromThisPool >= count) break;
      if (usedIds.has(question.id)) continue;
      selected.push(question);
      usedIds.add(question.id);
      takenFromThisPool += 1;
    }
  };

  take(rootPool, REASSESSMENT_ROOT_QUESTION_COUNT);
  if (affectedPool.length > 0) take(affectedPool, REASSESSMENT_AFFECTED_QUESTION_COUNT);

  // 5th slot: an application-transfer question — prefer an unused
  // application-type question from the root concept (the concept
  // actually being verified), else any remaining root question, else a
  // remaining affected-concept question.
  if (selected.length < 5) {
    const transferCandidate =
      rootPool.find((q) => !usedIds.has(q.id) && (APPLICATION_QUESTION_TYPES as readonly string[]).includes(q.questionType)) ??
      rootPool.find((q) => !usedIds.has(q.id)) ??
      affectedPool.find((q) => !usedIds.has(q.id));
    if (transferCandidate) {
      selected.push(transferCandidate);
      usedIds.add(transferCandidate.id);
    }
  }

  return selected.slice(0, 5);
}

/**
 * Classifies a single concept's before→after change. Centralized so
 * the "Improved / Still Developing / Needs More Practice" vocabulary is
 * never scattered across components, and so regression/no-improvement
 * is always handled honestly:
 * - "improved" requires an actual positive difference AND either the
 *   concept has crossed into strength (>= STRONG_THRESHOLD) or the jump
 *   itself is large (>= SIGNIFICANT_IMPROVEMENT_POINTS) — a flat or
 *   negative difference can never be classified "improved."
 * - "needs_more_practice" whenever the after-score is still below the
 *   critical threshold, regardless of any small positive movement.
 * - everything else is "still_developing."
 */
export function classifyComparisonStatus(beforeScore: number, afterScore: number): ComparisonStatus {
  const difference = afterScore - beforeScore;
  if (difference > 0 && (afterScore >= STRONG_THRESHOLD || difference >= SIGNIFICANT_IMPROVEMENT_POINTS)) {
    return "improved";
  }
  if (afterScore < CRITICAL_GAP_THRESHOLD) {
    return "needs_more_practice";
  }
  return "still_developing";
}

function buildComparison(concept: ConceptId, beforeScore: number, afterScore: number): ConceptComparison {
  const difference = afterScore - beforeScore;
  return {
    concept,
    conceptName: name(concept),
    beforeScore,
    afterScore,
    difference,
    status: classifyComparisonStatus(beforeScore, afterScore),
  };
}

function computeApplicationTransfer(
  concept: ConceptId,
  originalEvidence: AssessmentEvidence,
  reassessmentQuestions: AssessmentQuestion[],
  responses: Record<string, AssessmentResponse>,
): ApplicationTransferResult | null {
  const applicationTypes = APPLICATION_QUESTION_TYPES as readonly string[];

  const originalApplicationQuestions = [...originalEvidence.correctQuestions, ...originalEvidence.incorrectQuestions].filter(
    (q) => q.concept === concept && applicationTypes.includes(q.questionType),
  );
  if (originalApplicationQuestions.length === 0) return null;
  const originalApplicationCorrect = originalApplicationQuestions.filter((q) => q.selectedAnswer === q.correctAnswer).length;
  const beforeApplicationAccuracy = Math.round((originalApplicationCorrect / originalApplicationQuestions.length) * 100);

  const reassessmentApplicationQuestions = reassessmentQuestions.filter((q) => q.concept === concept && applicationTypes.includes(q.questionType));
  if (reassessmentApplicationQuestions.length === 0) return null;
  const reassessmentApplicationCorrect = reassessmentApplicationQuestions.filter((q) => responses[q.id]?.selectedAnswer === q.correctAnswer).length;
  const afterApplicationAccuracy = Math.round((reassessmentApplicationCorrect / reassessmentApplicationQuestions.length) * 100);

  return {
    concept,
    beforeApplicationAccuracy,
    afterApplicationAccuracy,
    transferred: afterApplicationAccuracy > beforeApplicationAccuracy,
  };
}

const OVERALL_MESSAGE: Record<OverallImprovementTier, string> = {
  closing: "Your learning gap is closing.",
  improving: "Your results are improving, but there's more to practice.",
  developing: "Your performance is still developing.",
};

function tierFromStatus(status: ComparisonStatus): OverallImprovementTier {
  if (status === "improved") return "closing";
  if (status === "still_developing") return "improving";
  return "developing";
}

/**
 * Deterministic next-action decision tree — exactly the spec's 4
 * states, in priority order. An AI layer is never consulted here.
 */
function determineNextAction(rootGapComparison: ConceptComparison | null, applicationTransfer: ApplicationTransferResult | null, allComparisons: ConceptComparison[]): NextAction {
  if (!rootGapComparison) {
    return {
      type: "full_reassessment",
      title: "Take a full diagnostic assessment",
      rationale: "There's no specific gap left to target — a full assessment will surface what to focus on next.",
      route: ROUTES.assessment,
    };
  }

  if (rootGapComparison.status !== "improved") {
    return {
      type: "repeat_recovery",
      title: `Repeat ${rootGapComparison.conceptName} recovery`,
      rationale: `${rootGapComparison.conceptName} is still below the level needed to move on — another focused recovery session should help.`,
      route: learningModuleRoute(rootGapComparison.concept),
    };
  }

  if (applicationTransfer && !applicationTransfer.transferred) {
    return {
      type: "practice_application",
      title: "Practice application challenges",
      rationale: `${rootGapComparison.conceptName} itself has improved, but applying it in new situations hasn't caught up yet.`,
      route: ROUTES.recoveryPath,
    };
  }

  const allStrong = allComparisons.every((c) => c.afterScore >= STRONG_THRESHOLD);
  if (allStrong) {
    return {
      type: "full_reassessment",
      title: "Take a full diagnostic assessment",
      rationale: "Every concept targeted this session is now strong — a full assessment can find the next area to work on.",
      route: ROUTES.assessment,
    };
  }

  const nextConcept = allComparisons.find((c) => c.concept !== rootGapComparison.concept && c.afterScore < STRONG_THRESHOLD);
  return {
    type: "advance_to_affected",
    title: nextConcept ? `Move to ${nextConcept.conceptName}` : "Continue your recovery path",
    rationale: `${rootGapComparison.conceptName} has improved — building on that foundation now is the natural next step.`,
    route: ROUTES.recoveryPath,
  };
}

export interface ReassessmentContext {
  originalEvidence: AssessmentEvidence;
  diagnosticEvidence: DiagnosticEvidence;
  reassessmentQuestions: AssessmentQuestion[];
  responses: Record<string, AssessmentResponse>;
  reassessmentId: string;
}

export function computeReassessmentResult(context: ReassessmentContext): ReassessmentResult {
  const { originalEvidence, diagnosticEvidence, reassessmentQuestions, responses, reassessmentId } = context;
  const scoring = scoreAssessment(reassessmentQuestions, responses);
  const primary = pickPrimaryFinding(diagnosticEvidence);

  const testedConcepts = Array.from(new Set(reassessmentQuestions.map((q) => q.concept)));
  // Root gap concept always leads the comparison list, if present among tested concepts.
  const orderedConcepts = primary
    ? [primary.concept, ...testedConcepts.filter((c) => c !== primary.concept)]
    : testedConcepts;

  const comparison = orderedConcepts
    .filter((concept) => scoring.conceptPerformance[concept] !== undefined)
    .map((concept) => buildComparison(concept, originalEvidence.conceptScores[concept] ?? 0, scoring.conceptPerformance[concept]));

  const rootGapComparison = primary ? comparison.find((c) => c.concept === primary.concept) ?? null : null;
  const applicationTransfer = primary ? computeApplicationTransfer(primary.concept, originalEvidence, reassessmentQuestions, responses) : null;

  const overallImprovementTier = rootGapComparison ? tierFromStatus(rootGapComparison.status) : "developing";
  const nextAction = determineNextAction(rootGapComparison, applicationTransfer, comparison);

  return {
    reassessmentId,
    originalAssessmentId: originalEvidence.assessmentId,
    studentId: originalEvidence.studentId,
    completedAt: new Date().toISOString(),
    totalScore: scoring.totalScore,
    totalQuestions: scoring.totalQuestions,
    percentage: scoring.percentage,
    conceptPerformance: scoring.conceptPerformance,
    comparison,
    rootGapComparison,
    applicationTransfer,
    overallImprovementTier,
    overallImprovementMessage: OVERALL_MESSAGE[overallImprovementTier],
    nextAction,
  };
}
