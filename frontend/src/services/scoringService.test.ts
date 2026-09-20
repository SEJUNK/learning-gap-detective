import { describe, expect, it } from "vitest";
import { scoreAssessment } from "./scoringService";
import type { AssessmentQuestion, AssessmentResponse } from "../types/assessment";

function makeQuestion(overrides: Partial<AssessmentQuestion> & Pick<AssessmentQuestion, "id" | "concept">): AssessmentQuestion {
  return {
    question: "Q",
    prerequisiteConcepts: [],
    difficulty: "easy",
    questionType: "conceptual",
    options: ["a", "b"],
    correctAnswer: 0,
    explanation: "because",
    points: 1,
    ...overrides,
  };
}

function answered(questionId: string, selectedAnswer: number, extra: Partial<AssessmentResponse> = {}): AssessmentResponse {
  return { questionId, selectedAnswer, isAnswered: true, confidence: null, timeSpent: 10, ...extra };
}

const FOUR_QUESTIONS: AssessmentQuestion[] = [
  makeQuestion({ id: "q1", concept: "variables", difficulty: "easy", correctAnswer: 0 }),
  makeQuestion({ id: "q2", concept: "conditions", difficulty: "medium", correctAnswer: 1 }),
  makeQuestion({ id: "q3", concept: "conditions", difficulty: "hard", correctAnswer: 0 }),
  makeQuestion({ id: "q4", concept: "loops", difficulty: "medium", correctAnswer: 1 }),
];

describe("scoreAssessment", () => {
  it("scores 100% when every answer is correct", () => {
    const responses = {
      q1: answered("q1", 0),
      q2: answered("q2", 1),
      q3: answered("q3", 0),
      q4: answered("q4", 1),
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.totalScore).toBe(4);
    expect(result.percentage).toBe(100);
    expect(result.answeredCount).toBe(4);
    expect(result.unansweredCount).toBe(0);
  });

  it("scores 0% when every answer is incorrect", () => {
    const responses = {
      q1: answered("q1", 1),
      q2: answered("q2", 0),
      q3: answered("q3", 1),
      q4: answered("q4", 0),
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.totalScore).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("scores a mix of correct and incorrect answers proportionally", () => {
    const responses = {
      q1: answered("q1", 0), // correct
      q2: answered("q2", 0), // incorrect (correct is 1)
      q3: answered("q3", 0), // correct
      q4: answered("q4", 0), // incorrect (correct is 1)
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.totalScore).toBe(2);
    expect(result.percentage).toBe(50);
  });

  it("computes per-concept performance independently", () => {
    const responses = {
      q1: answered("q1", 0), // variables correct
      q2: answered("q2", 1), // conditions correct
      q3: answered("q3", 1), // conditions incorrect
      q4: answered("q4", 1), // loops correct
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.conceptPerformance.variables).toBe(100);
    expect(result.conceptPerformance.loops).toBe(100);
    // conditions has 2 questions, 1 correct → 50%
    expect(result.conceptPerformance.conditions).toBe(50);
  });

  it("computes per-difficulty performance independently", () => {
    const responses = {
      q1: answered("q1", 0), // easy, correct
      q2: answered("q2", 1), // medium, correct
      q3: answered("q3", 1), // hard, incorrect
      q4: answered("q4", 0), // medium, incorrect
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.difficultyPerformance.easy).toBe(100);
    expect(result.difficultyPerformance.hard).toBe(0);
    // medium has 2 questions, 1 correct → 50%
    expect(result.difficultyPerformance.medium).toBe(50);
  });

  it("detects confidence patterns: high-confidence-incorrect and low-confidence-correct", () => {
    const responses = {
      q1: answered("q1", 0, { confidence: "very_confident" }), // correct + very confident
      q2: answered("q2", 0, { confidence: "very_confident" }), // incorrect + very confident
      q3: answered("q3", 0, { confidence: "guessing" }), // correct + guessing
      q4: answered("q4", 0, { confidence: "guessing" }), // incorrect + guessing
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.confidencePatterns.highConfidenceCorrect).toBe(1);
    expect(result.confidencePatterns.highConfidenceIncorrect).toBe(1);
    expect(result.confidencePatterns.lowConfidenceCorrect).toBe(1);
    expect(result.confidencePatterns.lowConfidenceIncorrect).toBe(1);
    expect(result.confidencePatterns.unrated).toBe(0);
  });

  it("counts answered-but-unrated confidence separately from the high/low buckets", () => {
    const responses = {
      q1: answered("q1", 0), // no confidence given
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.confidencePatterns.unrated).toBe(1);
    expect(result.confidencePatterns.highConfidenceCorrect).toBe(0);
    expect(result.confidencePatterns.lowConfidenceCorrect).toBe(0);
  });

  it("treats unanswered questions as incorrect for scoring but tracks them separately", () => {
    const responses = {
      q1: answered("q1", 0), // correct
      // q2, q3, q4 left unanswered entirely
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.totalScore).toBe(1);
    expect(result.answeredCount).toBe(1);
    expect(result.unansweredCount).toBe(3);
    expect(result.percentage).toBe(25);
  });

  it("treats a stored response with isAnswered: false the same as no response", () => {
    const responses = {
      q1: { questionId: "q1", selectedAnswer: 0, isAnswered: false, confidence: null, timeSpent: 0 },
    };

    const result = scoreAssessment(FOUR_QUESTIONS, responses);

    expect(result.answeredCount).toBe(0);
    expect(result.totalScore).toBe(0);
  });

  it("produces one QuestionResult per question, in question order", () => {
    const result = scoreAssessment(FOUR_QUESTIONS, {});

    expect(result.questionResults.map((r) => r.questionId)).toEqual(["q1", "q2", "q3", "q4"]);
    expect(result.questionResults.every((r) => !r.isAnswered && !r.isCorrect)).toBe(true);
  });
});
