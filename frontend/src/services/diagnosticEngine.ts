import type { AssessmentEvidence, ConceptId, EvidenceQuestion } from "../types/assessment";
import type {
  ApplicationGapFinding,
  ConceptGapFinding,
  ConfidenceInsight,
  DiagnosticEvidence,
  RootGapFinding,
  StrengthFinding,
} from "../types/diagnosis";
import { CONCEPT_DISPLAY_NAMES, CONCEPT_PREREQUISITES } from "../constants/conceptGraph";
import {
  APPLICATION_GAP_APPLICATION_MAX,
  APPLICATION_GAP_CONCEPTUAL_MIN,
  APPLICATION_QUESTION_TYPES,
  CONCEPTUAL_QUESTION_TYPES,
  CRITICAL_GAP_THRESHOLD,
  HIGH_CONFIDENCE_INCORRECT_MIN_COUNT,
  MAX_FINDING_CONFIDENCE,
  MIN_FINDING_CONFIDENCE,
  STRONG_THRESHOLD,
} from "../constants/diagnosisThresholds";

/**
 * The deterministic diagnostic analysis layer. Input: AssessmentEvidence
 * (Phase 3's output). Output: DiagnosticEvidence — weak/strong concepts,
 * root-gap candidates, application gaps, all with hedged, evidence-backed
 * reasoning. No LLM call happens anywhere in this file; this is the
 * layer the AI interpretation step (services/ai/) explains, never
 * recomputes.
 */

interface ConceptStats {
  concept: ConceptId;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  conceptualCorrect: number;
  conceptualTotal: number;
  applicationCorrect: number;
  applicationTotal: number;
  incorrectQuestions: EvidenceQuestion[];
}

function name(concept: ConceptId): string {
  return CONCEPT_DISPLAY_NAMES[concept] ?? concept;
}

function clampConfidence(value: number): number {
  return Math.max(MIN_FINDING_CONFIDENCE, Math.min(MAX_FINDING_CONFIDENCE, value));
}

function isConceptualType(type: EvidenceQuestion["questionType"]): boolean {
  return (CONCEPTUAL_QUESTION_TYPES as readonly string[]).includes(type);
}

function isApplicationType(type: EvidenceQuestion["questionType"]): boolean {
  return (APPLICATION_QUESTION_TYPES as readonly string[]).includes(type);
}

function buildConceptStats(evidence: AssessmentEvidence): Map<ConceptId, ConceptStats> {
  const stats = new Map<ConceptId, ConceptStats>();

  const ensure = (concept: ConceptId): ConceptStats => {
    let entry = stats.get(concept);
    if (!entry) {
      entry = {
        concept,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        total: 0,
        conceptualCorrect: 0,
        conceptualTotal: 0,
        applicationCorrect: 0,
        applicationTotal: 0,
        incorrectQuestions: [],
      };
      stats.set(concept, entry);
    }
    return entry;
  };

  const tally = (question: EvidenceQuestion, bucket: "correct" | "incorrect" | "unanswered") => {
    const entry = ensure(question.concept);
    entry.total += 1;
    entry[bucket] += 1;
    if (bucket === "incorrect") entry.incorrectQuestions.push(question);

    if (bucket !== "unanswered") {
      const wasCorrect = bucket === "correct";
      if (isConceptualType(question.questionType)) {
        entry.conceptualTotal += 1;
        if (wasCorrect) entry.conceptualCorrect += 1;
      } else if (isApplicationType(question.questionType)) {
        entry.applicationTotal += 1;
        if (wasCorrect) entry.applicationCorrect += 1;
      }
    }
  };

  evidence.correctQuestions.forEach((q) => tally(q, "correct"));
  evidence.incorrectQuestions.forEach((q) => tally(q, "incorrect"));
  evidence.unansweredQuestions.forEach((q) => tally(q, "unanswered"));

  return stats;
}

function detectRootGaps(
  evidence: AssessmentEvidence,
  conceptStats: Map<ConceptId, ConceptStats>,
): { findings: RootGapFinding[]; claimedConcepts: Set<ConceptId> } {
  const findings: RootGapFinding[] = [];
  const claimedConcepts = new Set<ConceptId>();

  // Reverse the prerequisite graph: concept -> concepts that depend on it.
  const dependents = new Map<ConceptId, ConceptId[]>();
  for (const [concept, prereqs] of Object.entries(CONCEPT_PREREQUISITES) as [ConceptId, ConceptId[]][]) {
    for (const prereq of prereqs) {
      dependents.set(prereq, [...(dependents.get(prereq) ?? []), concept]);
    }
  }

  for (const [concept, mastery] of Object.entries(evidence.conceptScores) as [ConceptId, number][]) {
    if (mastery >= CRITICAL_GAP_THRESHOLD) continue;

    // A concept with zero actually-answered questions has insufficient
    // evidence, not a demonstrated weakness — its 0% score is an artifact
    // of being skipped, not of being wrong. Never claim a root gap from
    // that alone (matches the same rule detectConceptGaps already applies).
    const stats = conceptStats.get(concept);
    if (!stats || stats.correct + stats.incorrect === 0) continue;

    const dependentConcepts = dependents.get(concept) ?? [];
    const weakDependents = dependentConcepts.filter((d) => {
      const dMastery = evidence.conceptScores[d];
      const dStats = conceptStats.get(d);
      // Same rule applied to the dependent side: an unattempted dependent
      // isn't evidence of "real downstream impact," just missing data.
      return typeof dMastery === "number" && dMastery < STRONG_THRESHOLD && !!dStats && dStats.correct + dStats.incorrect > 0;
    });

    // Rule: a low score alone never qualifies. We require at least one
    // dependent concept that is ALSO not solid — real downstream impact.
    if (weakDependents.length === 0) continue;

    // Question-level link: incorrect questions in a dependent concept
    // that explicitly draw on this concept as a prerequisite.
    let linkedMistakes = 0;
    for (const dependent of weakDependents) {
      const dependentStats = conceptStats.get(dependent);
      if (!dependentStats) continue;
      linkedMistakes += dependentStats.incorrectQuestions.filter((q) => q.prerequisiteConcepts.includes(concept)).length;
    }

    const evidenceStrings: string[] = [
      `${name(concept)} mastery is ${mastery}%, below the ${CRITICAL_GAP_THRESHOLD}% threshold used to flag a weak prerequisite.`,
      `${weakDependents.length} dependent concept${weakDependents.length === 1 ? "" : "s"} also show${weakDependents.length === 1 ? "s" : ""} weakness: ${weakDependents.map(name).join(", ")}.`,
    ];
    if (linkedMistakes > 0) {
      evidenceStrings.push(
        `${linkedMistakes} incorrect question${linkedMistakes === 1 ? "" : "s"} in ${weakDependents.map(name).join("/")} explicitly drew on ${name(concept)}.`,
      );
    }

    const confidence = clampConfidence(
      0.45 + 0.12 * Math.min(weakDependents.length, 3) + 0.08 * Math.min(linkedMistakes, 3) + (mastery < CRITICAL_GAP_THRESHOLD - 15 ? 0.1 : 0),
    );

    findings.push({
      type: "root_gap",
      concept,
      mastery,
      confidence,
      affectedConcepts: weakDependents,
      evidence: evidenceStrings,
    });
    claimedConcepts.add(concept);
  }

  // Rank by confidence so the strongest candidate leads.
  findings.sort((a, b) => b.confidence - a.confidence);
  return { findings, claimedConcepts };
}

function detectConceptGaps(evidence: AssessmentEvidence, claimedConcepts: Set<ConceptId>): ConceptGapFinding[] {
  const findings: ConceptGapFinding[] = [];

  for (const [concept, mastery] of Object.entries(evidence.conceptScores) as [ConceptId, number][]) {
    if (mastery >= CRITICAL_GAP_THRESHOLD) continue;
    if (claimedConcepts.has(concept)) continue; // already explained as a root gap

    const prereqs = CONCEPT_PREREQUISITES[concept] ?? [];
    const explainedByPrerequisite = prereqs.some((p) => {
      const pMastery = evidence.conceptScores[p];
      return typeof pMastery === "number" && pMastery < CRITICAL_GAP_THRESHOLD;
    });
    // If a prerequisite is itself weak, that's the more likely story —
    // don't double-count this concept as its own isolated gap.
    if (explainedByPrerequisite) continue;

    const incorrectCount = evidence.incorrectQuestions.filter((q) => q.concept === concept).length;
    const totalCount = incorrectCount + evidence.correctQuestions.filter((q) => q.concept === concept).length;
    if (totalCount === 0) continue;

    findings.push({
      type: "concept_gap",
      concept,
      mastery,
      confidence: clampConfidence(0.5 + 0.1 * Math.min(incorrectCount, 3)),
      evidence: [
        `${incorrectCount} of ${totalCount} ${name(concept)} question${totalCount === 1 ? "" : "s"} answered incorrectly.`,
        prereqs.length > 0
          ? `Prerequisite concept${prereqs.length === 1 ? "" : "s"} (${prereqs.map(name).join(", ")}) do not show comparable weakness, suggesting this gap is specific to ${name(concept)} rather than inherited from an earlier concept.`
          : `${name(concept)} has no prerequisite concepts in this assessment, so this evidence suggests a direct gap.`,
      ],
    });
  }

  return findings;
}

function detectApplicationGaps(conceptStats: Map<ConceptId, ConceptStats>): ApplicationGapFinding[] {
  const findings: ApplicationGapFinding[] = [];

  for (const stats of conceptStats.values()) {
    if (stats.conceptualTotal === 0 || stats.applicationTotal === 0) continue; // not enough evidence to split

    const conceptualAccuracy = Math.round((stats.conceptualCorrect / stats.conceptualTotal) * 100);
    const applicationAccuracy = Math.round((stats.applicationCorrect / stats.applicationTotal) * 100);

    if (conceptualAccuracy < APPLICATION_GAP_CONCEPTUAL_MIN) continue;
    if (applicationAccuracy > APPLICATION_GAP_APPLICATION_MAX) continue;

    findings.push({
      type: "application_gap",
      concept: stats.concept,
      conceptualAccuracy,
      applicationAccuracy,
      confidence: clampConfidence(0.5 + 0.15 * (stats.conceptualTotal + stats.applicationTotal >= 3 ? 1 : 0)),
      evidence: [
        `${stats.conceptualCorrect} of ${stats.conceptualTotal} conceptual ${name(stats.concept)} question${stats.conceptualTotal === 1 ? "" : "s"} correct (${conceptualAccuracy}%).`,
        `${stats.applicationCorrect} of ${stats.applicationTotal} application question${stats.applicationTotal === 1 ? "" : "s"} correct (${applicationAccuracy}%).`,
        "This pattern may indicate the concept itself is understood, but applying it in context is still developing.",
      ],
    });
  }

  return findings;
}

function detectStrengths(conceptStats: Map<ConceptId, ConceptStats>, evidence: AssessmentEvidence): StrengthFinding[] {
  const findings: StrengthFinding[] = [];

  for (const [concept, mastery] of Object.entries(evidence.conceptScores) as [ConceptId, number][]) {
    if (mastery < STRONG_THRESHOLD) continue;
    const stats = conceptStats.get(concept);
    if (!stats || stats.total === 0) continue;

    const evidenceStrings: string[] = [];
    if (stats.conceptualTotal > 0 && stats.applicationTotal > 0) {
      evidenceStrings.push(
        `Strong across both conceptual (${stats.conceptualCorrect}/${stats.conceptualTotal}) and application (${stats.applicationCorrect}/${stats.applicationTotal}) questions.`,
      );
    } else {
      evidenceStrings.push(`${stats.correct} of ${stats.total} ${name(concept)} question${stats.total === 1 ? "" : "s"} correct.`);
    }

    findings.push({ type: "strength", concept, mastery, evidence: evidenceStrings });
  }

  return findings;
}

function detectConfidenceInsight(evidence: AssessmentEvidence): ConfidenceInsight | null {
  const highConfidenceIncorrect = [...evidence.incorrectQuestions].filter((q) => q.confidence === "very_confident");
  if (highConfidenceIncorrect.length < HIGH_CONFIDENCE_INCORRECT_MIN_COUNT) return null;

  return {
    highConfidenceIncorrectCount: highConfidenceIncorrect.length,
    questionIds: highConfidenceIncorrect.map((q) => q.questionId),
    note: `You were highly confident on ${highConfidenceIncorrect.length} question${highConfidenceIncorrect.length === 1 ? "" : "s"} you answered incorrectly. These may be useful to review carefully.`,
  };
}

export function analyzeDiagnosticEvidence(evidence: AssessmentEvidence): DiagnosticEvidence {
  const conceptStats = buildConceptStats(evidence);
  const { findings: rootGaps, claimedConcepts } = detectRootGaps(evidence, conceptStats);
  const conceptGaps = detectConceptGaps(evidence, claimedConcepts);
  const applicationGaps = detectApplicationGaps(conceptStats);
  const strengths = detectStrengths(conceptStats, evidence);
  const confidenceInsight = detectConfidenceInsight(evidence);

  const conceptMasteryValues = Object.values(evidence.conceptScores);
  const conceptMasteryAverage =
    conceptMasteryValues.length === 0 ? 0 : Math.round(conceptMasteryValues.reduce((sum, v) => sum + v, 0) / conceptMasteryValues.length);

  return {
    assessmentId: evidence.assessmentId,
    studentId: evidence.studentId,
    subject: evidence.subject,
    overallScore: evidence.overallScore,
    conceptMasteryAverage,
    conceptMastery: evidence.conceptScores,
    rootGaps,
    conceptGaps,
    applicationGaps,
    strengths,
    confidenceInsight,
    prerequisiteGraph: CONCEPT_PREREQUISITES,
    generatedAt: new Date().toISOString(),
  };
}
