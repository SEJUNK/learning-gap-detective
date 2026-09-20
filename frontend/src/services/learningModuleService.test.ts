import { describe, expect, it } from "vitest";
import { checkAnswer, computeModuleAccuracy } from "./learningModuleService";
import type { InteractiveQuestion } from "../types/learningModule";

const QUESTION: InteractiveQuestion = {
  id: "q1",
  question: "What does and require?",
  options: ["one true", "all true", "none true", "always true"],
  correctAnswer: 1,
  correctFeedback: "Correct — every condition must be True.",
  misconceptionFeedback: {
    0: "You're thinking of or.",
    2: "and never needs zero true conditions.",
  },
};

describe("checkAnswer", () => {
  it("2. correct answer: returns isCorrect true with the positive feedback", () => {
    const result = checkAnswer(QUESTION, 1);
    expect(result.isCorrect).toBe(true);
    expect(result.feedback).toBe("Correct — every condition must be True.");
  });

  it("3. incorrect answer: returns the specific misconception feedback for that option", () => {
    const result = checkAnswer(QUESTION, 0);
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toBe("You're thinking of or.");
  });

  it("returns a distinct misconception message per wrong option, not one generic string", () => {
    const first = checkAnswer(QUESTION, 0);
    const second = checkAnswer(QUESTION, 2);
    expect(first.feedback).not.toBe(second.feedback);
  });

  it("falls back to a constructive generic message for an unauthored wrong option", () => {
    const result = checkAnswer(QUESTION, 3);
    expect(result.isCorrect).toBe(false);
    expect(result.feedback.length).toBeGreaterThan(0);
    expect(result.feedback.toLowerCase()).not.toBe("incorrect.");
  });
});

describe("computeModuleAccuracy", () => {
  it("5. practice scoring: counts correct/total accurately", () => {
    const summary = computeModuleAccuracy([true, true, false, true, false]);
    expect(summary.correctCount).toBe(3);
    expect(summary.totalCount).toBe(5);
    expect(summary.accuracyLabel).toBe("3/5");
  });

  it("never claims mastery from a perfect mini-session score — uses modest 'Solid progress' framing", () => {
    const summary = computeModuleAccuracy([true, true, true, true, true]);
    expect(summary.confidenceLabel).toBe("Solid progress");
    expect(summary.confidenceLabel.toLowerCase()).not.toContain("master");
  });

  it("labels a middling result as 'Improving', not discouraging", () => {
    const summary = computeModuleAccuracy([true, false, true, false]);
    expect(summary.confidenceLabel).toBe("Improving");
  });

  it("labels a weak result as 'Needs another look' without shaming language", () => {
    const summary = computeModuleAccuracy([false, false, true, false]);
    expect(summary.confidenceLabel).toBe("Needs another look");
  });

  it("handles zero results without dividing by zero", () => {
    const summary = computeModuleAccuracy([]);
    expect(summary.accuracyLabel).toBe("0/0");
    expect(summary.correctCount).toBe(0);
  });
});
