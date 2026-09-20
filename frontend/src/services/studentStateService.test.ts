import { afterEach, describe, expect, it } from "vitest";
import { applyAssessmentEvidence, clearMasteryOverrides, getMasteryOverride } from "./studentStateService";
import type { AssessmentEvidence } from "../types/assessment";
import type { DiagnosticEvidence } from "../types/diagnosis";

// Same rationale as dashboardService.test.ts: Vitest's default environment
// has no `localStorage`, so a minimal in-memory polyfill stands in for it.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();

function buildEvidence(conceptScores: Record<string, number>): AssessmentEvidence {
  return {
    assessmentId: "assessment-1",
    studentId: "student-1",
    subject: "Python",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    overallScore: { totalScore: 0, totalQuestions: 0, percentage: 0 },
    conceptScores,
    difficultyPerformance: {},
    correctQuestions: [],
    incorrectQuestions: [],
    unansweredQuestions: [],
    confidencePatterns: { highConfidenceCorrect: 0, highConfidenceIncorrect: 0, lowConfidenceCorrect: 0, lowConfidenceIncorrect: 0, unrated: 0 },
    prerequisiteRelationships: {},
    generatedAt: new Date().toISOString(),
  };
}

function buildDiagnostic(overrides: Partial<DiagnosticEvidence> = {}): DiagnosticEvidence {
  return {
    assessmentId: "assessment-1",
    studentId: "student-1",
    subject: "Python",
    overallScore: { totalScore: 0, totalQuestions: 0, percentage: 0 },
    conceptMasteryAverage: 0,
    conceptMastery: {},
    rootGaps: [],
    conceptGaps: [],
    applicationGaps: [],
    strengths: [],
    confidenceInsight: null,
    prerequisiteGraph: {},
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("studentStateService.applyAssessmentEvidence", () => {
  afterEach(() => {
    clearMasteryOverrides();
  });

  it("writes every scored concept as a mastery override, sourced from the assessment", () => {
    applyAssessmentEvidence(buildEvidence({ conditions: 48, lists: 91 }), buildDiagnostic());

    expect(getMasteryOverride("conditions")).toMatchObject({ mastery: 48, source: "assessment" });
    expect(getMasteryOverride("lists")).toMatchObject({ mastery: 91, source: "assessment" });
  });

  it("classifies a weak concept flagged as a root gap with status 'root'", () => {
    const diagnostic = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "conditions", mastery: 48, confidence: 0.7, affectedConcepts: ["loops"], evidence: [] }],
    });
    applyAssessmentEvidence(buildEvidence({ conditions: 48 }), diagnostic);

    expect(getMasteryOverride("conditions")?.status).toBe("root");
  });

  it("classifies a weak concept flagged as an application gap with status 'application'", () => {
    const diagnostic = buildDiagnostic({
      applicationGaps: [{ type: "application_gap", concept: "functions", conceptualAccuracy: 80, applicationAccuracy: 40, confidence: 0.6, evidence: [] }],
    });
    applyAssessmentEvidence(buildEvidence({ functions: 61 }), diagnostic);

    expect(getMasteryOverride("functions")?.status).toBe("application");
  });

  it("classifies a weak concept with no specific finding as status 'practice'", () => {
    applyAssessmentEvidence(buildEvidence({ loops: 56 }), buildDiagnostic());

    expect(getMasteryOverride("loops")?.status).toBe("practice");
  });

  it("classifies a concept at or above the strong threshold as status 'strength', even if it was also flagged as a root gap", () => {
    const diagnostic = buildDiagnostic({
      rootGaps: [{ type: "root_gap", concept: "variables", mastery: 90, confidence: 0.5, affectedConcepts: [], evidence: [] }],
    });
    applyAssessmentEvidence(buildEvidence({ variables: 90 }), diagnostic);

    expect(getMasteryOverride("variables")?.status).toBe("strength");
  });

  it("clearMasteryOverrides resets to a clean slate", () => {
    applyAssessmentEvidence(buildEvidence({ conditions: 48 }), buildDiagnostic());
    expect(getMasteryOverride("conditions")).not.toBeNull();

    clearMasteryOverrides();

    expect(getMasteryOverride("conditions")).toBeNull();
  });
});
