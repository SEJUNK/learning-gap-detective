import { afterEach, describe, expect, it } from "vitest";
import { resetDemoState } from "./resetService";
import { saveAssessmentState, createAssessmentState, loadInProgressAssessment, saveLastEvidence, loadLastEvidence } from "./assessmentStateService";
import { markStepCompleted, getProgress } from "./learningPathStateService";
import { saveLastReassessment, loadLastReassessment } from "./reassessmentStateService";
import { applyAssessmentEvidence, getMasteryOverride } from "./studentStateService";
import type { AssessmentEvidence } from "../types/assessment";
import type { DiagnosticEvidence } from "../types/diagnosis";

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
(globalThis as unknown as { localStorage: MemoryStorage; sessionStorage: MemoryStorage }).localStorage = new MemoryStorage();
(globalThis as unknown as { localStorage: MemoryStorage; sessionStorage: MemoryStorage }).sessionStorage = new MemoryStorage();

function buildDiagnostic(): DiagnosticEvidence {
  return {
    assessmentId: "a1",
    studentId: "s1",
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
  };
}

function buildEvidence(): AssessmentEvidence {
  return {
    assessmentId: "a1",
    studentId: "s1",
    subject: "Python",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    overallScore: { totalScore: 1, totalQuestions: 1, percentage: 100 },
    conceptScores: { conditions: 48 },
    difficultyPerformance: {},
    correctQuestions: [],
    incorrectQuestions: [],
    unansweredQuestions: [],
    confidencePatterns: { highConfidenceCorrect: 0, highConfidenceIncorrect: 0, lowConfidenceCorrect: 0, lowConfidenceIncorrect: 0, unrated: 0 },
    prerequisiteRelationships: {},
    generatedAt: new Date().toISOString(),
  };
}

describe("resetDemoState", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("clears in-progress assessment state, last evidence, path progress, last reassessment, and mastery overrides", () => {
    saveAssessmentState(createAssessmentState("Python"));
    saveLastEvidence(buildEvidence());
    markStepCompleted("path-1", "step-1");
    saveLastReassessment({ some: "result" });
    applyAssessmentEvidence(buildEvidence(), buildDiagnostic());

    expect(loadInProgressAssessment()).not.toBeNull();
    expect(loadLastEvidence()).not.toBeNull();
    expect(getProgress("path-1").completedStepIds.size).toBe(1);
    expect(loadLastReassessment()).not.toBeNull();
    expect(getMasteryOverride("conditions")).not.toBeNull();

    resetDemoState();

    expect(loadInProgressAssessment()).toBeNull();
    expect(loadLastEvidence()).toBeNull();
    expect(getProgress("path-1").completedStepIds.size).toBe(0);
    expect(loadLastReassessment()).toBeNull();
    expect(getMasteryOverride("conditions")).toBeNull();
  });
});
