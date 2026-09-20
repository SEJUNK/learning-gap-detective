import { describe, expect, it } from "vitest";
import { buildReassessmentQuestions, classifyComparisonStatus, computeReassessmentResult, pickPrimaryFinding } from "./reassessmentService";
import { CONCEPT_PREREQUISITES } from "../constants/conceptGraph";
import type { AssessmentEvidence, AssessmentQuestion, AssessmentResponse, ConceptId, EvidenceQuestion } from "../types/assessment";
import type { DiagnosticEvidence } from "../types/diagnosis";

function q(id: string, concept: ConceptId, correctAnswer = 0, questionType: AssessmentQuestion["questionType"] = "conceptual"): AssessmentQuestion {
  return {
    id,
    question: "Q",
    concept,
    prerequisiteConcepts: CONCEPT_PREREQUISITES[concept],
    difficulty: "medium",
    questionType,
    options: ["a", "b"],
    correctAnswer,
    explanation: "because",
    points: 1,
  };
}

function answer(questionId: string, selectedAnswer: number): AssessmentResponse {
  return { questionId, selectedAnswer, isAnswered: true, confidence: null, timeSpent: 5 };
}

function evidenceQuestion(concept: ConceptId, questionType: AssessmentQuestion["questionType"], correct: boolean): EvidenceQuestion {
  return {
    questionId: `orig-${concept}-${questionType}-${correct}`,
    question: "Q",
    concept,
    prerequisiteConcepts: CONCEPT_PREREQUISITES[concept],
    difficulty: "medium",
    questionType,
    selectedAnswer: correct ? 0 : 1,
    correctAnswer: 0,
    explanation: "because",
    confidence: null,
    timeSpent: 5,
  };
}

function buildOriginalEvidence(opts: { conceptScores: Record<string, number>; correctQuestions?: EvidenceQuestion[]; incorrectQuestions?: EvidenceQuestion[] }): AssessmentEvidence {
  return {
    assessmentId: "original-assessment-1",
    studentId: "student-1",
    subject: "Python",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    overallScore: { totalScore: 6, totalQuestions: 12, percentage: 50 },
    conceptScores: opts.conceptScores,
    difficultyPerformance: {},
    correctQuestions: opts.correctQuestions ?? [],
    incorrectQuestions: opts.incorrectQuestions ?? [],
    unansweredQuestions: [],
    confidencePatterns: { highConfidenceCorrect: 0, highConfidenceIncorrect: 0, lowConfidenceCorrect: 0, lowConfidenceIncorrect: 0, unrated: 0 },
    prerequisiteRelationships: {},
    generatedAt: new Date().toISOString(),
  };
}

function buildDiagnostic(overrides: Partial<DiagnosticEvidence>): DiagnosticEvidence {
  return {
    assessmentId: "original-assessment-1",
    studentId: "student-1",
    subject: "Python",
    overallScore: { totalScore: 6, totalQuestions: 12, percentage: 50 },
    conceptMasteryAverage: 50,
    conceptMastery: {},
    rootGaps: [],
    conceptGaps: [],
    applicationGaps: [],
    strengths: [],
    confidenceInsight: null,
    prerequisiteGraph: CONCEPT_PREREQUISITES,
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("classifyComparisonStatus", () => {
  it("1. significant improvement: a large jump into strength is classified improved", () => {
    expect(classifyComparisonStatus(30, 85)).toBe("improved");
  });

  it("2. small improvement: a modest gain that doesn't cross into strength is still developing", () => {
    expect(classifyComparisonStatus(50, 58)).toBe("still_developing");
  });

  it("3. no improvement: a flat score is never classified improved", () => {
    expect(classifyComparisonStatus(60, 60)).toBe("still_developing");
  });

  it("4. regression: a drop is never classified improved, and a drop below critical is needs_more_practice", () => {
    expect(classifyComparisonStatus(70, 50)).toBe("needs_more_practice");
  });

  it("a big jump below the strong threshold still counts as improved if it's significant", () => {
    expect(classifyComparisonStatus(25, 50)).toBe("improved");
  });

  it("a score that stays below critical is needs_more_practice even with a small positive gain", () => {
    expect(classifyComparisonStatus(30, 40)).toBe("needs_more_practice");
  });
});

describe("buildReassessmentQuestions", () => {
  it("returns no questions when there is no diagnosed gap to target", () => {
    const diagnostic = buildDiagnostic({});
    expect(buildReassessmentQuestions(diagnostic)).toEqual([]);
  });

  it("selects at most 5 questions, weighted toward the root gap concept", () => {
    const diagnostic = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops"], evidence: [] }],
    });
    const questions = buildReassessmentQuestions(diagnostic);

    expect(questions.length).toBeLessThanOrEqual(5);
    expect(questions.filter((q) => q.concept === "conditions").length).toBeGreaterThanOrEqual(3);
    expect(questions.some((q) => q.concept === "loops")).toBe(true);
  });

  it("never selects the same question twice", () => {
    const diagnostic = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops"], evidence: [] }],
    });
    const questions = buildReassessmentQuestions(diagnostic);
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("computeReassessmentResult", () => {
  it("5. root gap improvement is reflected in rootGapComparison", () => {
    const questions = [q("rc1", "conditions", 0), q("rc2", "conditions", 0), q("rc3", "conditions", 0)];
    const responses = { rc1: answer("rc1", 0), rc2: answer("rc2", 0), rc3: answer("rc3", 0) };
    const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40 } });
    const diagnosticEvidence = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: [], evidence: [] }],
    });

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r1" });

    expect(result.rootGapComparison?.concept).toBe("conditions");
    expect(result.rootGapComparison?.beforeScore).toBe(40);
    expect(result.rootGapComparison?.afterScore).toBe(100);
    expect(result.rootGapComparison?.status).toBe("improved");
    expect(result.overallImprovementTier).toBe("closing");
    expect(result.overallImprovementMessage).toBe("Your learning gap is closing.");
  });

  it("6. application improvement: transfer is detected when reassessment application accuracy exceeds the original", () => {
    const questions = [q("app1", "functions", 0, "application")];
    const responses = { app1: answer("app1", 0) };
    const originalEvidence = buildOriginalEvidence({
      conceptScores: { functions: 60 },
      incorrectQuestions: [evidenceQuestion("functions", "application", false)],
    });
    const diagnosticEvidence = buildDiagnostic({
      applicationGaps: [{ type: "application_gap", concept: "functions", conceptualAccuracy: 100, applicationAccuracy: 0, confidence: 0.6, evidence: [] }],
    });

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r2" });

    expect(result.applicationTransfer).not.toBeNull();
    expect(result.applicationTransfer?.beforeApplicationAccuracy).toBe(0);
    expect(result.applicationTransfer?.afterApplicationAccuracy).toBe(100);
    expect(result.applicationTransfer?.transferred).toBe(true);
  });

  it("does not claim transfer when application accuracy did not actually improve", () => {
    const questions = [q("app2", "functions", 0, "application")];
    const responses = { app2: answer("app2", 1) }; // wrong
    const originalEvidence = buildOriginalEvidence({
      conceptScores: { functions: 60 },
      correctQuestions: [evidenceQuestion("functions", "application", true)],
    });
    const diagnosticEvidence = buildDiagnostic({
      applicationGaps: [{ type: "application_gap", concept: "functions", conceptualAccuracy: 100, applicationAccuracy: 100, confidence: 0.6, evidence: [] }],
    });

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r3" });

    expect(result.applicationTransfer?.transferred).toBe(false);
  });

  it("omits application transfer entirely when there's no application-type evidence on either side", () => {
    const questions = [q("c1", "conditions", 0, "conceptual")];
    const responses = { c1: answer("c1", 0) };
    const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40 } });
    const diagnosticEvidence = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: [], evidence: [] }],
    });

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r4" });

    expect(result.applicationTransfer).toBeNull();
  });

  it("7. multiple concept comparison: root gap concept leads, affected concept follows", () => {
    const questions = [q("rc1", "conditions", 0), q("lc1", "loops", 0)];
    const responses = { rc1: answer("rc1", 0), lc1: answer("lc1", 0) };
    const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40, loops: 56 } });
    const diagnosticEvidence = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops"], evidence: [] }],
    });

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r5" });

    expect(result.comparison).toHaveLength(2);
    expect(result.comparison[0].concept).toBe("conditions");
    expect(result.comparison[1].concept).toBe("loops");
  });

  it("8. missing original assessment / no diagnosed gap: returns a safe, empty-but-valid result, never throws", () => {
    const originalEvidence = buildOriginalEvidence({ conceptScores: {} });
    const diagnosticEvidence = buildDiagnostic({});

    expect(() =>
      computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: [], responses: {}, reassessmentId: "r6" }),
    ).not.toThrow();

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: [], responses: {}, reassessmentId: "r6" });
    expect(result.comparison).toEqual([]);
    expect(result.rootGapComparison).toBeNull();
    expect(result.nextAction.type).toBe("full_reassessment");
  });

  it("9. invalid reassessment data: unanswered/empty responses score as 0 without throwing", () => {
    const questions = [q("rc1", "conditions", 0), q("rc2", "conditions", 0)];
    const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40 } });
    const diagnosticEvidence = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: [], evidence: [] }],
    });

    const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses: {}, reassessmentId: "r7" });

    expect(result.totalScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.rootGapComparison?.afterScore).toBe(0);
    expect(result.rootGapComparison?.status).toBe("needs_more_practice");
  });

  describe("10. next-action determination", () => {
    it("repeat_recovery when the root gap is still not improved", () => {
      const questions = [q("rc1", "conditions", 0)];
      const responses = { rc1: answer("rc1", 1) }; // wrong -> afterScore 0
      const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40 } });
      const diagnosticEvidence = buildDiagnostic({
        rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: [], evidence: [] }],
      });
      const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r8" });
      expect(result.nextAction.type).toBe("repeat_recovery");
    });

    it("practice_application when the root gap improved but application transfer did not", () => {
      // 4 conceptual questions correct + 1 application question wrong: concept score
      // jumps 40 -> 80 (a significant +40 improvement, "improved" via the jump
      // branch even though it hasn't crossed STRONG_THRESHOLD), while the lone
      // application-type question stays wrong — exactly root-improved-but-
      // application-lagging.
      const questions = [
        q("rc1", "conditions", 0),
        q("rc2", "conditions", 0),
        q("rc3", "conditions", 0),
        q("rc4", "conditions", 0),
        q("app1", "conditions", 0, "application"),
      ];
      const responses = {
        rc1: answer("rc1", 0),
        rc2: answer("rc2", 0),
        rc3: answer("rc3", 0),
        rc4: answer("rc4", 0),
        app1: answer("app1", 1),
      };
      const originalEvidence = buildOriginalEvidence({
        conceptScores: { conditions: 40 },
        correctQuestions: [evidenceQuestion("conditions", "application", true)],
      });
      const diagnosticEvidence = buildDiagnostic({
        rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: [], evidence: [] }],
      });
      const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r9" });
      expect(result.rootGapComparison?.status).toBe("improved");
      expect(result.applicationTransfer?.transferred).toBe(false);
      expect(result.nextAction.type).toBe("practice_application");
    });

    it("advance_to_affected when the root gap improved and other concepts still have room", () => {
      const questions = [q("rc1", "conditions", 0), q("lc1", "loops", 0)];
      const responses = { rc1: answer("rc1", 0), lc1: answer("lc1", 1) }; // conditions 100%, loops 0%
      const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40, loops: 56 } });
      const diagnosticEvidence = buildDiagnostic({
        rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops"], evidence: [] }],
      });
      const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r10" });
      expect(result.nextAction.type).toBe("advance_to_affected");
    });

    it("full_reassessment when every tested concept is now strong", () => {
      const questions = [q("rc1", "conditions", 0), q("lc1", "loops", 0)];
      const responses = { rc1: answer("rc1", 0), lc1: answer("lc1", 0) }; // both 100%
      const originalEvidence = buildOriginalEvidence({ conceptScores: { conditions: 40, loops: 56 } });
      const diagnosticEvidence = buildDiagnostic({
        rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: ["loops"], evidence: [] }],
      });
      const result = computeReassessmentResult({ originalEvidence, diagnosticEvidence, reassessmentQuestions: questions, responses, reassessmentId: "r11" });
      expect(result.nextAction.type).toBe("full_reassessment");
    });
  });
});

describe("pickPrimaryFinding", () => {
  it("prefers a root gap over a concept gap or application gap", () => {
    const diagnostic = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 40, confidence: 0.8, affectedConcepts: [], evidence: [] }],
      conceptGaps: [{ type: "concept_gap", concept: "loops", mastery: 30, confidence: 0.6, evidence: [] }],
    });
    expect(pickPrimaryFinding(diagnostic)?.concept).toBe("conditions");
  });

  it("returns null when there is nothing to target", () => {
    expect(pickPrimaryFinding(buildDiagnostic({}))).toBeNull();
  });
});
