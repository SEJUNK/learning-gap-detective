import type { ConceptId } from "./assessment";

/**
 * The Personalized Recovery Path data model. Generated deterministically
 * from DiagnosticEvidence (services/learningPathService.ts) — the AI
 * layer may later supply wording (objective phrasing, encouragement),
 * but it never decides step order, prerequisites, or status. That stays
 * deterministic so progression is reproducible and testable.
 */

export type LearningPathStepType = "root_gap" | "concept_reinforcement" | "application" | "challenge";

export type LearningPathStepStatus = "locked" | "available" | "in_progress" | "completed";

export interface LearningPathStep {
  id: string;
  order: number;
  type: LearningPathStepType;
  /** null only for the final challenge step when it spans multiple concepts. */
  concept: ConceptId | null;
  title: string;
  description: string;
  /** "Why am I learning this first?" — personalized, references actual evidence. */
  reason: string;
  objective: string;
  durationMinutes: number;
  /** ids of steps that must be completed before this one can become available. */
  prerequisites: string[];
  status: LearningPathStepStatus;
}

export interface LearningPathTimeBreakdown {
  conceptLearningMinutes: number;
  practiceMinutes: number;
  challengeMinutes: number;
}

export interface LearningPath {
  id: string;
  generatedAt: string;
  /** The concept the path is anchored on, if any gap was found. */
  rootConcept: ConceptId | null;
  rootGapCount: number;
  supportingGapCount: number;
  steps: LearningPathStep[];
  totalDurationMinutes: number;
  timeBreakdown: LearningPathTimeBreakdown;
  /** Deterministic, hedged — "you'll be ready to reassess", never a numeric promise. */
  expectedOutcomes: string[];
  /** Why this path was built this way, one paragraph, referencing the actual root cause. */
  rationale: string;
}
