/**
 * The AI reflection layer's input/output contracts — the reassessment
 * equivalent of aiDiagnosis.ts. Same rule applies: the AI only
 * interprets structured before/after evidence it's handed; it never
 * invents a number, a status, or an improvement that isn't already in
 * the input.
 */

export interface ReflectionComparisonInput {
  concept: string;
  beforeScore: number;
  afterScore: number;
  difference: number;
  status: string;
}

export interface ReassessmentReflectionInput {
  overallImprovementTier: "closing" | "improving" | "developing";
  comparisons: ReflectionComparisonInput[];
  applicationTransfer: { concept: string; beforeAccuracy: number; afterAccuracy: number; transferred: boolean } | null;
}

export interface ReassessmentReflection {
  headline: string;
  narrative: string;
  source: "ai" | "mock" | "fallback";
}
