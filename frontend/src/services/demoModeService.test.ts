import { afterEach, describe, expect, it } from "vitest";
import { buildDemoAssessmentResponses, buildDemoReassessmentResponses, isDemoModeEnabled, setDemoModeEnabled, startDemoJourney } from "./demoModeService";
import { ASSESSMENT_QUESTIONS } from "../data/assessmentQuestions";
import { DEMO_INCORRECT_QUESTION_IDS } from "../data/demoScript";
import { scoreAssessment } from "./scoringService";
import type { AssessmentQuestion } from "../types/assessment";

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

describe("demoModeService", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("persists the demo mode flag", () => {
    expect(isDemoModeEnabled()).toBe(false);
    setDemoModeEnabled(true);
    expect(isDemoModeEnabled()).toBe(true);
    setDemoModeEnabled(false);
    expect(isDemoModeEnabled()).toBe(false);
  });

  it("startDemoJourney resets state, enables demo mode, and returns the assessment route", () => {
    setDemoModeEnabled(false);
    localStorage.setItem("lgd-mastery-overrides", JSON.stringify({ conditions: { mastery: 90 } }));

    const route = startDemoJourney();

    expect(route).toBe("/assessment");
    expect(isDemoModeEnabled()).toBe(true);
    expect(localStorage.getItem("lgd-mastery-overrides")).toBeNull();
  });

  it("buildDemoAssessmentResponses answers every question, matching correctAnswer except the documented incorrect ones", () => {
    const responses = buildDemoAssessmentResponses();

    expect(Object.keys(responses)).toHaveLength(ASSESSMENT_QUESTIONS.length);
    for (const question of ASSESSMENT_QUESTIONS) {
      const response = responses[question.id];
      expect(response.isAnswered).toBe(true);
      if (DEMO_INCORRECT_QUESTION_IDS.includes(question.id)) {
        expect(response.selectedAnswer).not.toBe(question.correctAnswer);
      } else {
        expect(response.selectedAnswer).toBe(question.correctAnswer);
      }
    }
  });

  it("running the demo answers through the real scoring engine reproduces the documented demo story", () => {
    const responses = buildDemoAssessmentResponses();
    const result = scoreAssessment(ASSESSMENT_QUESTIONS, responses);

    expect(result.conceptPerformance.conditions).toBe(0);
    expect(result.conceptPerformance.loops).toBe(50);
    expect(result.conceptPerformance.functions).toBe(50);
    expect(result.conceptPerformance.lists).toBe(100);
  });

  it("buildDemoReassessmentResponses answers every given question correctly, whatever the question set", () => {
    const questions: AssessmentQuestion[] = [
      { ...ASSESSMENT_QUESTIONS[0], id: "r-1", correctAnswer: 2 },
      { ...ASSESSMENT_QUESTIONS[1], id: "r-2", correctAnswer: 0 },
    ];

    const responses = buildDemoReassessmentResponses(questions);

    expect(responses["r-1"].selectedAnswer).toBe(2);
    expect(responses["r-2"].selectedAnswer).toBe(0);
    const result = scoreAssessment(questions, responses);
    expect(result.percentage).toBe(100);
  });
});
