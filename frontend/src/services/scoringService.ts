import type {
  AssessmentQuestion,
  AssessmentResponse,
  ConfidencePatterns,
  Difficulty,
  QuestionResult,
  ScoringResult,
} from "../types/assessment";

/**
 * Deterministic scoring engine. No LLM, no randomness — the same
 * questions + responses always produce the same result. This is the
 * layer the (future) AI diagnosis engine is forbidden from touching:
 * it explains what this function already decided, never recomputes it.
 */

function round(value: number): number {
  return Math.round(value);
}

function isCorrect(question: AssessmentQuestion, response: AssessmentResponse | undefined): boolean {
  return Boolean(response?.isAnswered) && response!.selectedAnswer === question.correctAnswer;
}

function percentageOfPoints(earned: number, possible: number): number {
  return possible === 0 ? 0 : round((earned / possible) * 100);
}

export function scoreAssessment(
  questions: AssessmentQuestion[],
  responses: Record<string, AssessmentResponse>,
): ScoringResult {
  const questionResults: QuestionResult[] = [];

  let totalScore = 0;
  let totalPossible = 0;
  let answeredCount = 0;

  const conceptEarned: Record<string, number> = {};
  const conceptPossible: Record<string, number> = {};
  const difficultyEarned: Partial<Record<Difficulty, number>> = {};
  const difficultyPossible: Partial<Record<Difficulty, number>> = {};

  const confidencePatterns: ConfidencePatterns = {
    highConfidenceCorrect: 0,
    highConfidenceIncorrect: 0,
    lowConfidenceCorrect: 0,
    lowConfidenceIncorrect: 0,
    unrated: 0,
  };

  for (const question of questions) {
    const response = responses[question.id];
    const answered = Boolean(response?.isAnswered);
    const correct = isCorrect(question, response);

    if (answered) answeredCount += 1;
    if (correct) totalScore += question.points;
    totalPossible += question.points;

    conceptEarned[question.concept] = (conceptEarned[question.concept] ?? 0) + (correct ? question.points : 0);
    conceptPossible[question.concept] = (conceptPossible[question.concept] ?? 0) + question.points;

    difficultyEarned[question.difficulty] = (difficultyEarned[question.difficulty] ?? 0) + (correct ? question.points : 0);
    difficultyPossible[question.difficulty] = (difficultyPossible[question.difficulty] ?? 0) + question.points;

    const confidence = response?.confidence ?? null;
    if (answered) {
      if (!confidence) {
        confidencePatterns.unrated += 1;
      } else if (confidence === "very_confident") {
        if (correct) confidencePatterns.highConfidenceCorrect += 1;
        else confidencePatterns.highConfidenceIncorrect += 1;
      } else if (confidence === "guessing") {
        if (correct) confidencePatterns.lowConfidenceCorrect += 1;
        else confidencePatterns.lowConfidenceIncorrect += 1;
      }
      // "somewhat_confident" is deliberately not counted in the high/low
      // extremes — those are the diagnostically interesting patterns.
    }

    questionResults.push({
      questionId: question.id,
      concept: question.concept,
      difficulty: question.difficulty,
      isAnswered: answered,
      isCorrect: correct,
      confidence,
    });
  }

  const conceptPerformance: Record<string, number> = {};
  for (const concept of Object.keys(conceptPossible)) {
    conceptPerformance[concept] = percentageOfPoints(conceptEarned[concept] ?? 0, conceptPossible[concept]);
  }

  const difficultyPerformance: Partial<Record<Difficulty, number>> = {};
  for (const difficulty of Object.keys(difficultyPossible) as Difficulty[]) {
    difficultyPerformance[difficulty] = percentageOfPoints(difficultyEarned[difficulty] ?? 0, difficultyPossible[difficulty] ?? 0);
  }

  return {
    totalScore,
    totalQuestions: questions.length,
    percentage: percentageOfPoints(totalScore, totalPossible),
    answeredCount,
    unansweredCount: questions.length - answeredCount,
    conceptPerformance,
    difficultyPerformance,
    questionResults,
    confidencePatterns,
  };
}
