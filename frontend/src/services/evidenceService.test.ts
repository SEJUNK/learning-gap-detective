import { describe, expect, it } from "vitest";
import { buildAssessmentEvidence } from "./evidenceService";
import { scoreAssessment } from "./scoringService";
import { createAssessmentState } from "./assessmentStateService";
import { ASSESSMENT_QUESTIONS } from "../data/assessmentQuestions";
import type { AssessmentResponse } from "../types/assessment";

function answerAllCorrectly(): Record<string, AssessmentResponse> {
  const responses: Record<string, AssessmentResponse> = {};
  for (const question of ASSESSMENT_QUESTIONS) {
    responses[question.id] = {
      questionId: question.id,
      selectedAnswer: question.correctAnswer,
      isAnswered: true,
      confidence: "very_confident",
      timeSpent: 12,
    };
  }
  return responses;
}

describe("buildAssessmentEvidence", () => {
  it("marks the assessment complete with a completedAt timestamp", () => {
    const state = createAssessmentState("python");
    state.responses = answerAllCorrectly();
    state.completedAt = new Date().toISOString();

    const scoring = scoreAssessment(ASSESSMENT_QUESTIONS, state.responses);
    const evidence = buildAssessmentEvidence(state, ASSESSMENT_QUESTIONS, scoring);

    expect(evidence.completedAt).toBe(state.completedAt);
    expect(evidence.assessmentId).toBe(state.assessmentId);
    expect(evidence.studentId).toBe(state.studentId);
  });

  it("sorts every question into exactly one of correct / incorrect / unanswered", () => {
    const state = createAssessmentState("python");
    const responses = answerAllCorrectly();
    // Make one wrong, leave one unanswered entirely.
    const [first, second] = ASSESSMENT_QUESTIONS;
    responses[first.id] = { ...responses[first.id], selectedAnswer: (first.correctAnswer + 1) % first.options.length };
    delete responses[second.id];
    state.responses = responses;

    const scoring = scoreAssessment(ASSESSMENT_QUESTIONS, state.responses);
    const evidence = buildAssessmentEvidence(state, ASSESSMENT_QUESTIONS, scoring);

    const totalSorted = evidence.correctQuestions.length + evidence.incorrectQuestions.length + evidence.unansweredQuestions.length;
    expect(totalSorted).toBe(ASSESSMENT_QUESTIONS.length);
    expect(evidence.incorrectQuestions.some((q) => q.questionId === first.id)).toBe(true);
    expect(evidence.unansweredQuestions.some((q) => q.questionId === second.id)).toBe(true);
  });

  it("carries the overall score through unchanged from the scoring result", () => {
    const state = createAssessmentState("python");
    state.responses = answerAllCorrectly();

    const scoring = scoreAssessment(ASSESSMENT_QUESTIONS, state.responses);
    const evidence = buildAssessmentEvidence(state, ASSESSMENT_QUESTIONS, scoring);

    expect(evidence.overallScore.percentage).toBe(100);
    expect(evidence.overallScore.totalQuestions).toBe(ASSESSMENT_QUESTIONS.length);
    expect(evidence.overallScore.totalScore).toBe(scoring.totalScore);
  });

  it("includes a prerequisite relationship entry for every concept present in the question set", () => {
    const state = createAssessmentState("python");
    state.responses = {};

    const scoring = scoreAssessment(ASSESSMENT_QUESTIONS, state.responses);
    const evidence = buildAssessmentEvidence(state, ASSESSMENT_QUESTIONS, scoring);

    const concepts = new Set(ASSESSMENT_QUESTIONS.map((q) => q.concept));
    for (const concept of concepts) {
      expect(evidence.prerequisiteRelationships[concept]).toBeDefined();
    }
    // Functions' relationship entry must be an array of concept ids (evidence, not a UI label).
    expect(Array.isArray(evidence.prerequisiteRelationships.functions)).toBe(true);
  });

  it("preserves question metadata (explanation, difficulty, type) needed by a future diagnosis engine", () => {
    const state = createAssessmentState("python");
    state.responses = answerAllCorrectly();

    const scoring = scoreAssessment(ASSESSMENT_QUESTIONS, state.responses);
    const evidence = buildAssessmentEvidence(state, ASSESSMENT_QUESTIONS, scoring);

    const evidenceQuestion = evidence.correctQuestions[0];
    const sourceQuestion = ASSESSMENT_QUESTIONS.find((q) => q.id === evidenceQuestion.questionId)!;

    expect(evidenceQuestion.explanation).toBe(sourceQuestion.explanation);
    expect(evidenceQuestion.difficulty).toBe(sourceQuestion.difficulty);
    expect(evidenceQuestion.questionType).toBe(sourceQuestion.questionType);
    expect(evidenceQuestion.prerequisiteConcepts).toEqual(sourceQuestion.prerequisiteConcepts);
  });
});
