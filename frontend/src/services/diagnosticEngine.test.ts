import { describe, expect, it } from "vitest";
import { analyzeDiagnosticEvidence } from "./diagnosticEngine";
import type { AssessmentEvidence, ConceptId, EvidenceQuestion, QuestionType } from "../types/assessment";

let questionCounter = 0;

function q(
  concept: ConceptId,
  prerequisiteConcepts: ConceptId[],
  questionType: QuestionType,
  confidence: EvidenceQuestion["confidence"] = null,
): EvidenceQuestion {
  questionCounter += 1;
  return {
    questionId: `q-${concept}-${questionCounter}`,
    question: "Q",
    concept,
    prerequisiteConcepts,
    difficulty: "medium",
    questionType,
    selectedAnswer: 0,
    correctAnswer: 0,
    explanation: "because",
    confidence,
    timeSpent: 10,
  };
}

interface BuildOptions {
  conceptScores: Record<string, number>;
  correctQuestions?: EvidenceQuestion[];
  incorrectQuestions?: EvidenceQuestion[];
  unansweredQuestions?: EvidenceQuestion[];
}

function buildEvidence(opts: BuildOptions): AssessmentEvidence {
  const correctQuestions = opts.correctQuestions ?? [];
  const incorrectQuestions = opts.incorrectQuestions ?? [];
  const unansweredQuestions = opts.unansweredQuestions ?? [];
  const total = correctQuestions.length + incorrectQuestions.length + unansweredQuestions.length;

  return {
    assessmentId: "assessment-test",
    studentId: "student-test",
    subject: "Python",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    overallScore: {
      totalScore: correctQuestions.length,
      totalQuestions: total,
      percentage: total === 0 ? 0 : Math.round((correctQuestions.length / total) * 100),
    },
    conceptScores: opts.conceptScores,
    difficultyPerformance: {},
    correctQuestions,
    incorrectQuestions,
    unansweredQuestions,
    confidencePatterns: {
      highConfidenceCorrect: 0,
      highConfidenceIncorrect: 0,
      lowConfidenceCorrect: 0,
      lowConfidenceIncorrect: 0,
      unrated: 0,
    },
    prerequisiteRelationships: {},
    generatedAt: new Date().toISOString(),
  };
}

describe("analyzeDiagnosticEvidence", () => {
  it("1. strong student: high mastery everywhere yields strengths and no gaps", () => {
    const evidence = buildEvidence({
      conceptScores: { variables: 100, data_types: 95, conditions: 90, loops: 88 },
      correctQuestions: [
        q("variables", [], "conceptual"),
        q("data_types", ["variables"], "code_output"),
        q("conditions", ["variables", "data_types"], "application"),
        q("loops", ["conditions"], "code_output"),
      ],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.rootGaps).toHaveLength(0);
    expect(result.conceptGaps).toHaveLength(0);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.map((s) => s.concept)).toContain("variables");
  });

  it("2. weak student: broad low mastery yields gap findings, not silence", () => {
    const evidence = buildEvidence({
      conceptScores: { variables: 40, data_types: 30, conditions: 25, loops: 20 },
      incorrectQuestions: [
        q("variables", [], "conceptual"),
        q("data_types", ["variables"], "code_output"),
        q("conditions", ["variables", "data_types"], "application"),
        q("loops", ["conditions"], "code_output"),
      ],
    });

    const result = analyzeDiagnosticEvidence(evidence);
    const totalGapFindings = result.rootGaps.length + result.conceptGaps.length;

    expect(totalGapFindings).toBeGreaterThan(0);
    expect(result.strengths).toHaveLength(0);
  });

  it("3. single concept gap: one weak concept with strong prerequisites and no weak dependents", () => {
    const evidence = buildEvidence({
      conceptScores: { variables: 90, data_types: 90, dictionaries: 40 },
      correctQuestions: [q("variables", [], "conceptual"), q("data_types", ["variables"], "code_output")],
      incorrectQuestions: [q("dictionaries", ["lists"], "conceptual")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.conceptGaps).toHaveLength(1);
    expect(result.conceptGaps[0].concept).toBe("dictionaries");
    expect(result.rootGaps).toHaveLength(0);
  });

  it("4. multiple concept gaps: several isolated weak concepts are all reported", () => {
    const evidence = buildEvidence({
      conceptScores: { variables: 95, exceptions: 30, oop: 25 },
      correctQuestions: [q("variables", [], "conceptual")],
      incorrectQuestions: [q("exceptions", ["functions"], "debugging"), q("oop", ["functions", "dictionaries"], "reasoning")],
    });

    const result = analyzeDiagnosticEvidence(evidence);
    const gapConcepts = [...result.rootGaps, ...result.conceptGaps].map((f) => f.concept);

    expect(gapConcepts).toContain("exceptions");
    expect(gapConcepts).toContain("oop");
  });

  it("5. root prerequisite gap: a weak prerequisite explaining weak dependents is flagged as root, not concept, gap", () => {
    const evidence = buildEvidence({
      conceptScores: { conditions: 42, loops: 56, functions: 61 },
      incorrectQuestions: [
        q("conditions", ["variables", "data_types"], "application"),
        q("loops", ["conditions"], "debugging"), // links back to conditions
        q("functions", ["loops", "conditions"], "application"), // links back to conditions too
      ],
      correctQuestions: [q("loops", ["conditions"], "code_output"), q("functions", ["loops", "conditions"], "reasoning")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.rootGaps).toHaveLength(1);
    const rootGap = result.rootGaps[0];
    expect(rootGap.concept).toBe("conditions");
    expect(rootGap.affectedConcepts).toEqual(expect.arrayContaining(["loops", "functions"]));
    expect(rootGap.confidence).toBeGreaterThan(0);
    expect(rootGap.confidence).toBeLessThanOrEqual(0.95);
    // Conditions must not ALSO appear as its own isolated concept gap.
    expect(result.conceptGaps.map((f) => f.concept)).not.toContain("conditions");
  });

  it("does not infer a root gap from a single low score with no weak dependents", () => {
    const evidence = buildEvidence({
      conceptScores: { conditions: 40, loops: 90, functions: 95 },
      incorrectQuestions: [q("conditions", ["variables", "data_types"], "application")],
      correctQuestions: [q("loops", ["conditions"], "code_output"), q("functions", ["loops", "conditions"], "application")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.rootGaps).toHaveLength(0);
    // With no weak dependents, this becomes an isolated concept gap instead.
    expect(result.conceptGaps.map((f) => f.concept)).toContain("conditions");
  });

  it("6. application gap: strong conceptual accuracy but weak application accuracy on the same concept", () => {
    const evidence = buildEvidence({
      conceptScores: { functions: 61 },
      correctQuestions: [q("functions", ["loops"], "conceptual"), q("functions", ["loops"], "code_output")],
      incorrectQuestions: [q("functions", ["loops"], "application"), q("functions", ["loops"], "reasoning")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.applicationGaps).toHaveLength(1);
    expect(result.applicationGaps[0].concept).toBe("functions");
    expect(result.applicationGaps[0].conceptualAccuracy).toBe(100);
    expect(result.applicationGaps[0].applicationAccuracy).toBe(0);
  });

  it("does not claim an application gap without evidence in both buckets", () => {
    const evidence = buildEvidence({
      conceptScores: { functions: 50 },
      incorrectQuestions: [q("functions", ["loops"], "application"), q("functions", ["loops"], "reasoning")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.applicationGaps).toHaveLength(0);
  });

  it("7. strong concept: high mastery with both conceptual and application evidence", () => {
    const evidence = buildEvidence({
      conceptScores: { lists: 91 },
      correctQuestions: [q("lists", ["data_types", "loops"], "code_output"), q("lists", ["data_types", "loops"], "application")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.strengths).toHaveLength(1);
    expect(result.strengths[0].concept).toBe("lists");
    expect(result.strengths[0].evidence[0]).toMatch(/conceptual/i);
  });

  it("8. high-confidence incorrect answers surface a confidence insight", () => {
    const evidence = buildEvidence({
      conceptScores: { conditions: 80 },
      incorrectQuestions: [q("conditions", [], "application", "very_confident"), q("conditions", [], "debugging", "very_confident")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.confidenceInsight).not.toBeNull();
    expect(result.confidenceInsight?.highConfidenceIncorrectCount).toBe(2);
    expect(result.confidenceInsight?.note).not.toMatch(/wrong|fail|bad/i);
  });

  it("does not surface a confidence insight when there are no high-confidence mistakes", () => {
    const evidence = buildEvidence({
      conceptScores: { conditions: 80 },
      incorrectQuestions: [q("conditions", [], "application", "guessing")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.confidenceInsight).toBeNull();
  });

  it("9. missing/partial evidence: no questions at all does not throw and returns empty findings", () => {
    const evidence = buildEvidence({ conceptScores: {} });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.rootGaps).toEqual([]);
    expect(result.conceptGaps).toEqual([]);
    expect(result.applicationGaps).toEqual([]);
    expect(result.strengths).toEqual([]);
    expect(result.confidenceInsight).toBeNull();
    expect(result.conceptMasteryAverage).toBe(0);
  });

  it("handles a concept score with no matching question data gracefully", () => {
    const evidence = buildEvidence({ conceptScores: { oop: 30 } });

    const result = analyzeDiagnosticEvidence(evidence);

    // No question-level data for oop, so no concept gap should be claimed from mastery alone.
    expect(result.conceptGaps).toHaveLength(0);
  });

  it("computes conceptMasteryAverage as the equal-weighted average across concepts", () => {
    const evidence = buildEvidence({ conceptScores: { variables: 100, loops: 50 } });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.conceptMasteryAverage).toBe(75);
  });

  it("carries the prerequisite graph through unchanged for the Learning Gap Map to render", () => {
    const evidence = buildEvidence({ conceptScores: {} });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.prerequisiteGraph.functions).toEqual(expect.arrayContaining(["loops", "conditions"]));
  });

  it("10. insufficient evidence: a concept with zero answered questions is not claimed as a root gap purely from an unanswered-driven low score", () => {
    // `conditions` was never attempted (only unanswered questions), so its
    // 0% mastery reflects missing evidence, not a demonstrated weakness —
    // it must not be used to justify flagging it as a root gap for a
    // genuinely weak dependent.
    const evidence = buildEvidence({
      conceptScores: { conditions: 0, loops: 40 },
      unansweredQuestions: [q("conditions", ["variables", "data_types"], "application")],
      incorrectQuestions: [q("loops", ["conditions"], "debugging")],
    });

    const result = analyzeDiagnosticEvidence(evidence);

    expect(result.rootGaps.map((f) => f.concept)).not.toContain("conditions");
  });
});
