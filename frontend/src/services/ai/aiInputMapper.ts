import type { DiagnosticEvidence } from "../../types/diagnosis";
import type { AIInputEvidence, AIInputFinding } from "../../types/aiDiagnosis";
import { CONCEPT_DISPLAY_NAMES } from "../../constants/conceptGraph";
import type { ConceptId } from "../../types/assessment";

function conceptName(id: string): string {
  return CONCEPT_DISPLAY_NAMES[id as ConceptId] ?? id;
}

function toConceptMasteryNames(mastery: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [concept, value] of Object.entries(mastery)) {
    result[conceptName(concept)] = value;
  }
  return result;
}

function graphWithNames(graph: Record<string, ConceptId[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [concept, prereqs] of Object.entries(graph)) {
    result[conceptName(concept)] = prereqs.map(conceptName);
  }
  return result;
}

/**
 * Builds the exact, bounded structure the AI layer is allowed to see.
 * Everything here traces back to DiagnosticEvidence (already
 * deterministic) — no raw question text, no per-question answer
 * selections, no student identifiers beyond what's needed to label the
 * output. This is the control point that keeps prompts small, grounded,
 * and free of anything the AI shouldn't be reasoning over.
 */
export function toAIInputEvidence(evidence: DiagnosticEvidence): AIInputEvidence {
  const mapFinding = (finding: {
    concept: string;
    mastery?: number;
    affectedConcepts?: string[];
    conceptualAccuracy?: number;
    applicationAccuracy?: number;
    evidence: string[];
  }): AIInputFinding => ({
    concept: conceptName(finding.concept),
    mastery: finding.mastery,
    affectedConcepts: finding.affectedConcepts?.map(conceptName),
    conceptualAccuracy: finding.conceptualAccuracy,
    applicationAccuracy: finding.applicationAccuracy,
    evidence: finding.evidence,
  });

  return {
    subject: evidence.subject,
    overallScore: evidence.overallScore,
    conceptMasteryAverage: evidence.conceptMasteryAverage,
    conceptMastery: toConceptMasteryNames(evidence.conceptMastery),
    rootGaps: evidence.rootGaps.map(mapFinding),
    conceptGaps: evidence.conceptGaps.map(mapFinding),
    applicationGaps: evidence.applicationGaps.map(mapFinding),
    strengths: evidence.strengths.map(mapFinding),
    confidenceNote: evidence.confidenceInsight?.note ?? null,
    prerequisiteGraph: graphWithNames(evidence.prerequisiteGraph),
  };
}
