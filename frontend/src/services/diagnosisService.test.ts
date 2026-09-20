import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AssessmentEvidence, ConceptId, EvidenceQuestion } from "../types/assessment";

vi.mock("./ai/aiProviderFactory", () => ({
  getAIProvider: vi.fn(),
}));

import { getAIProvider } from "./ai/aiProviderFactory";
import { getDiagnosis } from "./diagnosisService";
import { isValidStructuredDiagnosis } from "./ai/diagnosisValidator";

function q(concept: ConceptId, prerequisiteConcepts: ConceptId[]): EvidenceQuestion {
  return {
    questionId: `q-${concept}`,
    question: "Q",
    concept,
    prerequisiteConcepts,
    difficulty: "medium",
    questionType: "application",
    selectedAnswer: 1,
    correctAnswer: 0,
    explanation: "because",
    confidence: null,
    timeSpent: 5,
  };
}

function buildEvidence(): AssessmentEvidence {
  return {
    assessmentId: "assessment-1",
    studentId: "student-1",
    subject: "Python",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    overallScore: { totalScore: 1, totalQuestions: 3, percentage: 33 },
    conceptScores: { conditions: 40, loops: 50, functions: 55 },
    difficultyPerformance: {},
    correctQuestions: [],
    incorrectQuestions: [q("conditions", []), q("loops", ["conditions"]), q("functions", ["loops", "conditions"])],
    unansweredQuestions: [],
    confidencePatterns: { highConfidenceCorrect: 0, highConfidenceIncorrect: 0, lowConfidenceCorrect: 0, lowConfidenceIncorrect: 0, unrated: 0 },
    prerequisiteRelationships: {},
    generatedAt: new Date().toISOString(),
  };
}

describe("getDiagnosis", () => {
  beforeEach(() => {
    vi.mocked(getAIProvider).mockReset();
  });

  it("returns a valid diagnosis sourced from the provider when the call succeeds", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn().mockResolvedValue({
        headline: "Custom AI headline",
        summary: "Custom AI summary",
        rootCause: null,
        applicationGaps: [],
        strengths: [],
        recommendations: [],
        learningSequence: [],
        confidenceInsight: null,
        source: "ai",
      }),
      generateReassessmentReflection: vi.fn(),
    });

    const { diagnosis, diagnosticEvidence } = await getDiagnosis(buildEvidence());

    expect(diagnosis.source).toBe("ai");
    expect(diagnosis.headline).toBe("Custom AI headline");
    expect(diagnosticEvidence.rootGaps.length).toBeGreaterThan(0);
  });

  it("10. AI failure fallback: a rejected provider call still returns a valid, usable diagnosis", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn().mockRejectedValue(new Error("network error")),
      generateReassessmentReflection: vi.fn(),
    });

    const { diagnosis } = await getDiagnosis(buildEvidence());

    expect(diagnosis.source).toBe("fallback");
    expect(isValidStructuredDiagnosis(diagnosis)).toBe(true);
    // The fallback must still be evidence-grounded, not a generic placeholder.
    expect(diagnosis.headline.toLowerCase()).toContain("conditions");
  });

  it("falls back when the provider resolves with an invalid shape", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn().mockResolvedValue({ headline: "" /* missing everything else */ }),
      generateReassessmentReflection: vi.fn(),
    });

    const { diagnosis } = await getDiagnosis(buildEvidence());

    expect(diagnosis.source).toBe("fallback");
    expect(isValidStructuredDiagnosis(diagnosis)).toBe(true);
  });

  it("the deterministic diagnosticEvidence is identical regardless of whether the AI call succeeds or fails", async () => {
    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn().mockRejectedValue(new Error("boom")),
      generateReassessmentReflection: vi.fn(),
    });
    const failed = await getDiagnosis(buildEvidence());

    vi.mocked(getAIProvider).mockReturnValue({
      generateDiagnosis: vi.fn().mockResolvedValue({
        headline: "h",
        summary: "s",
        rootCause: null,
        applicationGaps: [],
        strengths: [],
        recommendations: [],
        learningSequence: [],
        confidenceInsight: null,
        source: "ai",
      }),
      generateReassessmentReflection: vi.fn(),
    });
    const succeeded = await getDiagnosis(buildEvidence());

    expect(failed.diagnosticEvidence.rootGaps).toEqual(succeeded.diagnosticEvidence.rootGaps);
  });
});
