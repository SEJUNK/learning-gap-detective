import type { ConceptId } from "./assessment";

/**
 * Targeted Reassessment data model. Verifies whether a diagnosed gap
 * actually closed — built entirely from the existing scoring engine
 * (services/scoringService.ts) plus a before/after comparison layer.
 * Nothing here is AI-generated; the (optional) AI reflection is a
 * separate, purely-interpretive layer added on top (see
 * services/reassessmentAIService.ts).
 */

export type ComparisonStatus = "improved" | "still_developing" | "needs_more_practice";

export interface ConceptComparison {
  concept: ConceptId;
  conceptName: string;
  beforeScore: number;
  afterScore: number;
  /** afterScore - beforeScore. Can be negative — regression is not hidden. */
  difference: number;
  status: ComparisonStatus;
}

export interface ApplicationTransferResult {
  concept: ConceptId;
  beforeApplicationAccuracy: number;
  afterApplicationAccuracy: number;
  /** True only when the reassessment's application-type accuracy for this concept genuinely exceeds the original. */
  transferred: boolean;
}

export type NextActionType = "advance_to_affected" | "practice_application" | "repeat_recovery" | "full_reassessment";

export interface NextAction {
  type: NextActionType;
  title: string;
  rationale: string;
  route: string;
}

/** The three overall-tone tiers the results screen's headline message maps to — deterministic, never forced positive. */
export type OverallImprovementTier = "closing" | "improving" | "developing";

export interface ReassessmentResult {
  reassessmentId: string;
  originalAssessmentId: string;
  studentId: string;
  completedAt: string;
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  conceptPerformance: Record<string, number>;
  /** Root gap concept's comparison first, then every other tested concept. */
  comparison: ConceptComparison[];
  rootGapComparison: ConceptComparison | null;
  applicationTransfer: ApplicationTransferResult | null;
  overallImprovementTier: OverallImprovementTier;
  overallImprovementMessage: string;
  nextAction: NextAction;
}
