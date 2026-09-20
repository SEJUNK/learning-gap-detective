import type { ConceptId } from "./assessment";

/**
 * The deterministic diagnostic engine's output vocabulary. Distinct from
 * (but visually mapped onto, see constants/gapStatus.ts) the shared
 * GapStatus used elsewhere in the product — a diagnosis needs to
 * distinguish "problem starts here and explains other problems"
 * (root_gap) from "problem is isolated to this concept" (concept_gap)
 * from "understands it, can't apply it" (application_gap), which the
 * simpler 4-color dashboard vocabulary doesn't need to.
 */
export type FindingType = "root_gap" | "concept_gap" | "application_gap" | "strength";

interface BaseFinding {
  concept: ConceptId;
  /** 0-1. The engine never claims certainty — see MIN/MAX_FINDING_CONFIDENCE. */
  confidence: number;
  /** Human-readable, hedged evidence bullets ("Evidence suggests...", "This pattern may indicate..."). */
  evidence: string[];
}

export interface RootGapFinding extends BaseFinding {
  type: "root_gap";
  mastery: number;
  affectedConcepts: ConceptId[];
}

export interface ConceptGapFinding extends BaseFinding {
  type: "concept_gap";
  mastery: number;
}

export interface ApplicationGapFinding extends BaseFinding {
  type: "application_gap";
  conceptualAccuracy: number;
  applicationAccuracy: number;
}

export interface StrengthFinding {
  type: "strength";
  concept: ConceptId;
  mastery: number;
  evidence: string[];
}

export type DiagnosticFinding = RootGapFinding | ConceptGapFinding | ApplicationGapFinding | StrengthFinding;

export interface ConfidenceInsight {
  highConfidenceIncorrectCount: number;
  questionIds: string[];
  note: string;
}

/**
 * The deterministic diagnostic engine's complete output. Built entirely
 * from AssessmentEvidence + the concept prerequisite graph — no AI
 * involved in producing any field here. This is what the AI
 * interpretation layer explains; it never recomputes it.
 */
export interface DiagnosticEvidence {
  assessmentId: string;
  studentId: string;
  subject: string;
  overallScore: {
    totalScore: number;
    totalQuestions: number;
    percentage: number;
  };
  /** Average of per-concept mastery (equal-weighted by concept, unlike overallScore.percentage which is question-weighted). */
  conceptMasteryAverage: number;
  conceptMastery: Record<string, number>;
  rootGaps: RootGapFinding[];
  conceptGaps: ConceptGapFinding[];
  applicationGaps: ApplicationGapFinding[];
  strengths: StrengthFinding[];
  confidenceInsight: ConfidenceInsight | null;
  prerequisiteGraph: Record<string, ConceptId[]>;
  generatedAt: string;
}
