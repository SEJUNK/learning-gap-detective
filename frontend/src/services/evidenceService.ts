import type {
  AssessmentEvidence,
  AssessmentQuestion,
  AssessmentResponse,
  AssessmentState,
  ConceptId,
  EvidenceQuestion,
  ScoringResult,
} from "../types/assessment";

/**
 * Builds the structured evidence object the (future) AI diagnosis engine
 * will consume. This is the deliberate boundary: everything on this
 * object is a fact computed by `scoringService` or copied from the
 * question bank — no interpretation, no explanation, no "why" is added
 * here. That's the next phase's job, built on top of this object.
 */

function toEvidenceQuestion(question: AssessmentQuestion, response: AssessmentResponse | undefined): EvidenceQuestion {
  return {
    questionId: question.id,
    question: question.question,
    concept: question.concept,
    prerequisiteConcepts: question.prerequisiteConcepts,
    difficulty: question.difficulty,
    questionType: question.questionType,
    selectedAnswer: response?.selectedAnswer ?? null,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    confidence: response?.confidence ?? null,
    timeSpent: response?.timeSpent ?? 0,
  };
}

export function buildAssessmentEvidence(
  state: AssessmentState,
  questions: AssessmentQuestion[],
  scoring: ScoringResult,
): AssessmentEvidence {
  const correctQuestions: EvidenceQuestion[] = [];
  const incorrectQuestions: EvidenceQuestion[] = [];
  const unansweredQuestions: EvidenceQuestion[] = [];

  for (const question of questions) {
    const response = state.responses[question.id];
    const evidenceQuestion = toEvidenceQuestion(question, response);
    const result = scoring.questionResults.find((r) => r.questionId === question.id);

    if (!result?.isAnswered) {
      unansweredQuestions.push(evidenceQuestion);
    } else if (result.isCorrect) {
      correctQuestions.push(evidenceQuestion);
    } else {
      incorrectQuestions.push(evidenceQuestion);
    }
  }

  const prerequisiteRelationships: Record<string, ConceptId[]> = {};
  for (const question of questions) {
    if (!(question.concept in prerequisiteRelationships)) {
      prerequisiteRelationships[question.concept] = question.prerequisiteConcepts;
    }
  }

  return {
    assessmentId: state.assessmentId,
    studentId: state.studentId,
    subject: state.subject,
    startedAt: state.startedAt,
    completedAt: state.completedAt ?? new Date().toISOString(),
    overallScore: {
      totalScore: scoring.totalScore,
      totalQuestions: scoring.totalQuestions,
      percentage: scoring.percentage,
    },
    conceptScores: scoring.conceptPerformance,
    difficultyPerformance: scoring.difficultyPerformance,
    correctQuestions,
    incorrectQuestions,
    unansweredQuestions,
    confidencePatterns: scoring.confidencePatterns,
    prerequisiteRelationships,
    generatedAt: new Date().toISOString(),
  };
}
